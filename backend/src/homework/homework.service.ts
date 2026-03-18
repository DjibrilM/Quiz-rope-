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
- Break down every single concept into an extremely detailed, step-by-step educational explanation
- Assume the student is K-12 and needs to be taught the fundamentals behind the problem
- Make the explanations LONG and thorough. Do not just give the answer; teach the lesson.
- Use numbered lists for step-by-step reasoning
- Use simple, encouraging, and age-appropriate language
- Explain WHY each answer is correct and HOW to solve similar problems in the future`;

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
    childId?: string,
  ): Promise<HomeworkSession> {
    const session = await this.sessionModel.create({
      parentId: new Types.ObjectId(parentId),
      ...(childId && Types.ObjectId.isValid(childId) ? { childId: new Types.ObjectId(childId) } : {}),
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

  /**
   * Summarizes a batch of older messages and appends to the session's chatSummary.
   * This implements "Context Engineering" to prevent linear prompt scaling while
   * retaining infinite memory of the conversation.
   */
  async summarizeConversationContext(sessionId: string): Promise<void> {
    const session = await this.getSessionRaw(sessionId);
    const history = await this.getChatHistory(sessionId);

    const KEEP_UNSUMMARIZED_BUFFER = 6;
    const SUMMARY_BATCH_SIZE = 10;
    
    // Total number of messages that theoretically *can* be summarized right now
    const summarizeableCount = history.length - KEEP_UNSUMMARIZED_BUFFER;
    
    // We only trigger a summary if we have accumulated enough unsummarized messages
    const unsummarizedCount = summarizeableCount - (session.summarizedMessageCount || 0);

    if (unsummarizedCount < SUMMARY_BATCH_SIZE) {
      return; // Not enough new messages to justify a summary pass yet
    }

    // Grab the exact slice of messages to summarize (from last summary point to the buffer)
    const startIndex = session.summarizedMessageCount || 0;
    const endIndex = startIndex + unsummarizedCount;
    const messagesToSummarize = history.slice(startIndex, endIndex);

    if (messagesToSummarize.length === 0) return;

    this.logger.log(`Summarizing ${messagesToSummarize.length} messages for session ${sessionId}...`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('Skipping summarization: GEMINI_API_KEY not configured');
      return;
    }

    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey,
      maxOutputTokens: 1024, // High level abstract summary
      temperature: 0.1, // Keep it deterministic and factual
    });

    const conversationText = messagesToSummarize
      .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
      .join('\n\n');

    let summaryPrompt = `You are a conversation summarizer. 
Compress the following exchange between a Student and a Tutor into a dense, factual summary.
Keep absolutely all important facts, concepts discussed, and the student's current level of understanding.
Do NOT output conversational filler.`;

    if (session.chatSummary) {
      summaryPrompt += `\n\nThere is already an existing summary of previous messages. Update and append to this existing summary based on the new exchange.
      
EXISTING SUMMARY:
${session.chatSummary}`;
    }

    summaryPrompt += `\n\nNEW CONVERSATION TO SUMMARIZE:
${conversationText}`;

    try {
      const response = await model.invoke([new HumanMessage(summaryPrompt)]);
      const newSummaryText = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);

      await this.sessionModel.findByIdAndUpdate(sessionId, {
        chatSummary: newSummaryText.trim(),
        summarizedMessageCount: endIndex,
      });

      this.logger.log(`Successfully updated conversation summary for session ${sessionId} (Count: ${endIndex})`);
    } catch (error) {
      this.logger.error(`Context summarization failed for session ${sessionId}:`, error.message);
    }
  }

  async linkMatch(sessionId: string, matchId: string): Promise<void> {
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      linkedMatchId: new Types.ObjectId(matchId),
      quizTaken: true,
      $addToSet: { linkedMatchIds: new Types.ObjectId(matchId) },
    });
  }

  /** Create a homework session for a ghost (guest) user — no parent account needed. */
  async analyzeForGuest(
    guestId: string,
    imageBase64: string,
    mimeType: string,
  ): Promise<HomeworkSession> {
    const session = await this.sessionModel.create({
      guestId,
      imageBase64,
      imageMimeType: mimeType,
      status: 'PROCESSING',
    });

    this.runAnalysis(session._id.toString(), imageBase64, mimeType).catch(
      async (err) => {
        this.logger.error(`Ghost homework analysis failed for ${session._id}:`, err.message);
        await this.sessionModel.findByIdAndUpdate(session._id, {
          status: 'FAILED',
          errorMessage: err.message,
        });
      },
    );

    return session;
  }

  /** Retrieve homework sessions for a ghost user by guestId. */
  async getGhostSessions(guestId: string): Promise<HomeworkSession[]> {
    return this.sessionModel
      .find({ guestId })
      .sort({ createdAt: -1 })
      .select('-imageBase64')
      .lean<HomeworkSession[]>();
  }

  /** Retrieve a single ghost session (no parentId check). */
  async getGhostSession(sessionId: string, guestId: string): Promise<HomeworkSession> {
    if (!Types.ObjectId.isValid(sessionId)) throw new NotFoundException();
    const session = await this.sessionModel.findOne({ _id: sessionId, guestId });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
