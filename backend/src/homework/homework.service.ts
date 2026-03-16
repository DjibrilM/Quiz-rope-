import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HomeworkSession } from './schemas/homework-session.schema';
import { HomeworkChat } from './schemas/homework-chat.schema';
import { GEMINI_MODEL } from '../constants';

const HOMEWORK_PROMPT = `You are a tutor helping a K-12 student understand their homework.
Analyze the homework image carefully and respond ONLY with valid JSON — no markdown fences.

{
  "title": "short descriptive title of the homework",
  "subject": "one of exactly: MATH, SCIENCE, ENGLISH, HISTORY, GEOGRAPHY",
  "topics": ["topic1", "topic2"],
  "answers_markdown": "full markdown answers here"
}

For answers_markdown:
- Use ## for each question number
- Use **bold** for the final answer
- Use numbered lists for step-by-step reasoning
- Keep language simple and age-appropriate
- Be thorough — explain WHY each answer is correct`;

interface GeminiHomeworkResult {
  title: string;
  subject: string;
  topics: string[];
  answers_markdown: string;
}

@Injectable()
export class HomeworkService {
  private readonly logger = new Logger(HomeworkService.name);

  constructor(
    @InjectModel(HomeworkSession.name)
    private sessionModel: Model<HomeworkSession>,
    @InjectModel(HomeworkChat.name)
    private chatModel: Model<HomeworkChat>,
  ) {}

  async analyze(
    parentId: string,
    imageBase64: string,
    mimeType: string,
  ): Promise<HomeworkSession> {
    const session = await this.sessionModel.create({
      parentId: new Types.ObjectId(parentId),
      imageBase64,
      imageMimeType: mimeType,
      status: 'PROCESSING',
    });

    this.runAnalysis(session._id.toString(), imageBase64, mimeType).catch(
      async (err) => {
        this.logger.error(`Homework analysis failed for ${session._id}:`, err.message);
        await this.sessionModel.findByIdAndUpdate(session._id, {
          status: 'FAILED',
          errorMessage: err.message,
        });
      },
    );

    return session;
  }

  private async runAnalysis(
    sessionId: string,
    base64: string,
    mimeType: string,
  ): Promise<void> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey,
      maxOutputTokens: 4096,
      temperature: 0.3,
    });

    const response = await model.invoke([
      new HumanMessage({
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
          { type: 'text', text: HOMEWORK_PROMPT },
        ],
      }),
    ]);

    const text =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    const cleaned = text
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let result: GeminiHomeworkResult;
    try {
      result = JSON.parse(cleaned);
    } catch {
      throw new Error(`Gemini returned unparseable response: ${cleaned.slice(0, 200)}`);
    }

    const validSubjects = ['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY'];
    const subject = validSubjects.includes(result.subject?.toUpperCase())
      ? result.subject.toUpperCase()
      : 'SCIENCE';

    await this.sessionModel.findByIdAndUpdate(sessionId, {
      status: 'READY',
      title: result.title || 'Homework',
      subject,
      topics: result.topics || [],
      answersMarkdown: result.answers_markdown || '',
    });

    this.logger.log(`Homework session ${sessionId} analyzed successfully`);
  }

  async getSession(sessionId: string, parentId: string): Promise<HomeworkSession> {
    if (!Types.ObjectId.isValid(sessionId)) throw new NotFoundException();
    const session = await this.sessionModel.findOne({
      _id: sessionId,
      parentId: new Types.ObjectId(parentId),
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getSessionRaw(sessionId: string): Promise<HomeworkSession> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getSessions(parentId: string): Promise<HomeworkSession[]> {
    return this.sessionModel
      .find({ parentId: new Types.ObjectId(parentId) })
      .sort({ createdAt: -1 })
      .select('-imageBase64') // don't return full base64 in list
      .lean<HomeworkSession[]>();
  }

  async getChatHistory(sessionId: string): Promise<HomeworkChat[]> {
    return this.chatModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .lean<HomeworkChat[]>();
  }

  async saveMessage(
    sessionId: string,
    role: 'user' | 'ai',
    content: string,
  ): Promise<HomeworkChat> {
    return this.chatModel.create({
      sessionId: new Types.ObjectId(sessionId),
      role,
      content,
    });
  }

  async linkMatch(sessionId: string, matchId: string): Promise<void> {
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      linkedMatchId: new Types.ObjectId(matchId),
      quizTaken: true,
      $addToSet: { linkedMatchIds: new Types.ObjectId(matchId) },
    });
  }
}
