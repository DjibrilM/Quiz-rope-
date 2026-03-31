import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HomeworkSession } from './schemas/homework-session.schema';
import { HomeworkChat } from './schemas/homework-chat.schema';
import { Child } from '../children/schemas/child.schema';
import { GEMINI_MODEL } from '../constants';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Surgical extraction of the first well-formed JSON object from a string.
 */
function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') { 
      depth--; 
      if (depth === 0) return text.slice(start, i + 1); 
    }
  }
  return null;
}

/**
 * Fixes common JSON escape errors in AI-generated LaTeX strings.
 * AI models often emit single backslashes (e.g. \frac, \(, \[) inside JSON strings,
 * which are invalid JSON. This utility doubles lone backslashes while leaving
 * already-valid escape sequences (\\, \", \/, \b, \f, \n, \r, \t, \uXXXX) untouched.
 *
 * The previous regex approach had a bug: it processed backslashes one at a time, so
 * an already-valid \\section* would be corrupted to \\\section* (the second \ gets
 * doubled because it's followed by 's'). The character-by-character approach below
 * consumes valid escape sequences as atomic units, avoiding that pitfall.
 */
function fixJsonEscapes(jsonStr: string): string {
  let result = '';
  let i = 0;
  while (i < jsonStr.length) {
    if (jsonStr[i] !== '\\') {
      result += jsonStr[i++];
      continue;
    }
    const next = jsonStr[i + 1];
    if (next === '\\' || next === '"' || next === '/' ||
        next === 'b' || next === 'f' || next === 'n' || next === 'r' || next === 't') {
      // Valid 2-char escape — keep both chars and advance past them
      result += jsonStr[i] + next;
      i += 2;
    } else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(jsonStr.slice(i + 2, i + 6))) {
      // Valid \uXXXX unicode escape — keep all 6 chars
      result += jsonStr.slice(i, i + 6);
      i += 6;
    } else {
      // Lone (invalid) backslash — double it so JSON.parse accepts it
      result += '\\\\';
      i += 1; // consume only the backslash; the next char is processed on the next iteration
    }
  }
  return result;
}

const HOMEWORK_PROMPT = `You are an encouraging K-12 homework tutor at QuizRope.
Your task is to analyze the student's homework image and generate a clear, helpful explanation.

STRICT JSON OUTPUT:
Return ONLY a valid JSON object inside markdown fences.

{
  "title": "Descriptive title",
  "subject": "MATH|SCIENCE|ENGLISH|HISTORY|GEOGRAPHY",
  "topics": ["topic1", "topic2"],
  "answers_markdown": "Full educational explanation here."
}

RULES for answers_markdown:
1. **Clear Explanations**: Provide a step-by-step guide that makes sense to a K-12 student.
2. **MATH RENDERING**:
   - Use $ ... $ for ALL inline math.
   - Use $$ ... $$ for ALL display/block math.
   - Ensure square roots, fractions, and symbols are clearly written in standard LaTeX.
3. **Tone**: Warm, encouraging, and simple. Explain concepts clearly before showing the math.`;

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
    @InjectModel(Child.name)
    private childModel: Model<Child>,
  ) {}

  async analyze(
    parentId: string,
    imageBase64: string,
    mimeType: string,
    childId?: string,
  ): Promise<HomeworkSession> {
    // Validate the childId belongs to this parent before associating
    if (childId && Types.ObjectId.isValid(childId)) {
      const child = await this.childModel.findOne({
        _id: new Types.ObjectId(childId),
        parentId: new Types.ObjectId(parentId),
      });
      if (!child) {
        throw new ForbiddenException('Child does not belong to this parent');
      }
    }

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

    this.logger.log(`[Gemini] Invoking homework analysis for session=${sessionId} model=${GEMINI_MODEL}`);

    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey,
      maxOutputTokens: 8192,
      temperature: 0.1,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    let response: Awaited<ReturnType<typeof model.invoke>>;
    try {
      response = await model.invoke([
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
    } catch (err: any) {
      this.logger.error(`[Gemini] Homework analysis invoke failed session=${sessionId}: ${err.message}`, err.stack);
      throw err;
    }

    const text =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    const extracted = extractJsonObject(text);
    if (!extracted) {
      this.logger.error(`[Gemini] No JSON object in response session=${sessionId}: ${text.slice(0, 200)}`);
      throw new Error(`Gemini returned invalid response: ${text.slice(0, 200)}`);
    }

    let result: GeminiHomeworkResult;
    try {
      const sanitized = fixJsonEscapes(extracted);
      result = JSON.parse(sanitized);
    } catch (err: any) {
      this.logger.error(`[Gemini] Invalid JSON parse session=${sessionId}: ${extracted.slice(0, 200)}`);
      throw new Error(`Invalid JSON format: ${err.message}`);
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

    this.logger.log(`[Gemini] Homework session=${sessionId} analyzed OK subject=${subject} topics=${result.topics?.length ?? 0}`);
  }

  async getSession(sessionId: string, userId: string, role: 'parent' | 'child' = 'parent'): Promise<HomeworkSession> {
    if (!Types.ObjectId.isValid(sessionId)) throw new NotFoundException();
    
    const query: any = { _id: sessionId };
    if (role === 'child') {
      query.childId = new Types.ObjectId(userId);
    } else {
      query.parentId = new Types.ObjectId(userId);
    }

    const session = await this.sessionModel.findOne(query);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getSessionRaw(sessionId: string): Promise<HomeworkSession> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getSessions(userId: string, role: 'parent' | 'child' = 'parent'): Promise<HomeworkSession[]> {
    const query: any = {};
    if (role === 'child') {
      query.childId = new Types.ObjectId(userId);
    } else {
      query.parentId = new Types.ObjectId(userId);
    }

    return this.sessionModel
      .find(query)
      .sort({ createdAt: -1 })
      .select('-imageBase64') // don't return full base64 in list
      .lean<HomeworkSession[]>();
  }

  async fetchChatHistory(sessionId: string): Promise<HomeworkChat[]> {
    return this.chatModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .lean<HomeworkChat[]>();
  }

  async getChatHistory(sessionId: string, userId: string, role: 'parent' | 'child' = 'parent'): Promise<HomeworkChat[]> {
    await this.getSession(sessionId, userId, role);
    return this.fetchChatHistory(sessionId);
  }

  async getPaginatedChatHistory(
    sessionId: string,
    userId: string,
    skip: number,
    limit: number,
    role: 'parent' | 'child' = 'parent',
  ): Promise<HomeworkChat[]> {
    await this.getSession(sessionId, userId, role);

    return this.chatModel
      .find({ sessionId: new Types.ObjectId(sessionId) })

      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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
    const history = await this.fetchChatHistory(sessionId);

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

    let summaryPrompt = `You are a conversation summarizer for QuizRope, a K-12 educational app.
Compress the following exchange between a Student and a Tutor into a dense, factual summary.
Keep absolutely all important facts, concepts discussed, and the student's current level of understanding.
Do NOT output conversational filler, greetings, or any content unrelated to the educational subject matter.
STRICT: Never summarize or retain any content that is off-topic, inappropriate for children, or outside the scope of K-12 homework.`;

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

  /** Stateless: analyze homework synchronously — no DB writes. For guest mode. */
  async analyzeGuestStateless(
    imageBase64: string,
    mimeType: string,
  ): Promise<{ title: string; subject: string; topics: string[]; answersMarkdown: string; status: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    this.logger.log(`[Gemini] Invoking guest stateless analysis model=${GEMINI_MODEL}`);

    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey,
      maxOutputTokens: 8192,
      temperature: 0.1,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    let response: Awaited<ReturnType<typeof model.invoke>>;
    try {
      response = await model.invoke([
        new HumanMessage({
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: 'text', text: HOMEWORK_PROMPT },
          ],
        }),
      ]);
    } catch (err: any) {
      this.logger.error(`[Gemini] Guest stateless analysis invoke failed: ${err.message}`, err.stack);
      throw err;
    }

    const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const extracted = extractJsonObject(text);
    if (!extracted) {
      this.logger.error(`[Gemini] Guest stateless analysis — no JSON object: ${text.slice(0, 200)}`);
      throw new Error(`Gemini returned invalid response: ${text.slice(0, 200)}`);
    }

    let result: GeminiHomeworkResult;
    try {
      const sanitized = fixJsonEscapes(extracted);
      result = JSON.parse(sanitized);
    } catch (err: any) {
      this.logger.error(`[Gemini] Guest stateless analysis — invalid JSON: ${extracted.slice(0, 200)}`);
      throw new Error(`Invalid JSON format: ${err.message}`);
    }

    const validSubjects = ['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY'];
    const subject = validSubjects.includes(result.subject?.toUpperCase()) ? result.subject.toUpperCase() : 'SCIENCE';

    this.logger.log(`[Gemini] Guest stateless analysis OK subject=${subject} topics=${result.topics?.length ?? 0}`);
    return {
      title: result.title || 'Homework',
      subject,
      topics: result.topics || [],
      answersMarkdown: result.answers_markdown || '',
      status: 'READY',
    };
  }

  /** Stateless: single-turn chat with session context — no DB writes. For guest mode. */
  async guestChatStateless(
    sessionContext: string,
    history: { role: 'user' | 'model'; content: string }[],
    message: string,
  ): Promise<{ response: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    this.logger.log(`[Gemini] Guest chat invoke model=${GEMINI_MODEL} historyLen=${history.length} msgLen=${message.length}`);

    const systemInstruction = `You are an encouraging K-12 tutor assistant in QuizRope — an educational tug-of-war quiz app for children.
Your ONLY job is to help the student understand their homework.
Homework content for context:
${sessionContext}

STRICT RULES — follow all of these without exception:
1. ONLY discuss the student's homework and related school subjects. If asked about anything unrelated, politely decline and redirect to the homework.
2. NEVER simply give the final answer — always guide, explain, and scaffold so the student actually learns.
3. NEVER discuss violence, adult content, personal information, politics, religion, or anything inappropriate for children.
4. NEVER impersonate other people, claim to be human, or role-play as a different AI system.
5. Keep all language simple, encouraging, and age-appropriate for K-12 students.
6. If a student mentions personal distress or safety concerns, respond with care and encourage them to talk to a trusted adult.
  - ALWAYS use LaTeX for mathematical expressions.
  - Use \\( ... \\) for inline math and \\[ ... \\] for block math.
  - NEVER use $ or $$ for math.
  - Use academic LaTeX structures like \\section*{...}, \\begin{itemize}, and \\textbf{...} for lesson content.
  - Write thorough, step-by-step educational explanations. Break down fundamental concepts so the child actually learns.`;

    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey,
      maxOutputTokens: 1024,
      temperature: 0.7,
    });

    const msgs = [
      new SystemMessage(systemInstruction),
      ...history.map((m) => m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)),
      new HumanMessage(message),
    ];

    let response: Awaited<ReturnType<typeof model.invoke>>;
    try {
      response = await model.invoke(msgs);
    } catch (err: any) {
      this.logger.error(`[Gemini] Guest chat invoke failed: ${err.message}`, err.stack);
      throw err;
    }

    const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    this.logger.log(`[Gemini] Guest chat OK responseLen=${text.length}`);
    return { response: text };
  }

  /** Stateless: streaming single-turn chat — sends tokens as an async iterable. For guest mode via socket.io. */
  async *guestChatStream(
    sessionContext: string,
    history: { role: 'user' | 'model'; content: string }[],
    message: string,
    signal?: AbortSignal,
    language?: string,
  ): AsyncIterable<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    // Truncate context to avoid bloating every request with the full homework analysis
    const context = sessionContext.length > 3000
      ? sessionContext.slice(0, 3000) + '\n...[truncated]'
      : sessionContext;

    const systemInstruction = `You are an encouraging K-12 tutor assistant in QuizRope — an educational tug-of-war quiz app for children.
Your ONLY job is to help the student understand their homework.
Homework content for context:
${context}

STRICT RULES — follow all of these without exception:
1. ONLY discuss the student's homework and related school subjects. If asked about anything unrelated, politely decline and redirect to the homework.
2. NEVER simply give the final answer — always guide, explain, and scaffold so the student actually learns.
3. NEVER discuss violence, adult content, personal information, politics, religion, or anything inappropriate for children.
4. NEVER impersonate other people, claim to be human, or role-play as a different AI system.
5. Keep all language simple, encouraging, and age-appropriate for K-12 students.
6. If a student mentions personal distress or safety concerns, respond with care and encourage them to talk to a trusted adult.

TEACHING APPROACH:
- Give thorough, step-by-step explanations so the student truly understands the concept, not just the answer.
- Break down every idea into its fundamentals — assume the student needs to learn from scratch.
- Use numbered steps for reasoning, examples, and analogies to make abstract ideas concrete.
- After explaining, ask a follow-up question or give a hint to check that the student understood.
- Be warm, patient, and encouraging throughout.
- **STYLE**: Always keep your questions and explanations extremely CONCISE. NEVER write more than one short sentence for a question you ask the student.
- **MATH RENDERING RULES**:
  - Use $ ... $ for ALL inline math.
  - Use $$ ... $$ for ALL display/block math.
  - Ensure square roots, fractions, and symbols are clearly written in standard LaTeX.
7. Always respond in the language identified by this BCP-47 code: ${language || 'en'}.`;

    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey,
      maxOutputTokens: 1024,
      temperature: 0.7,
    });

    const msgs = [
      new SystemMessage(systemInstruction),
      ...history.map((m) =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
      ),
      new HumanMessage(message),
    ];

    const stream = await model.stream(msgs, signal ? ({ signal } as any) : undefined);
    for await (const chunk of stream) {
      if (signal?.aborted) break;
      const token = typeof chunk.content === 'string' ? chunk.content : '';
      if (token) yield token;
    }
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

  /**
   * Erases all data associated with a child (sessions, chats).
   */
  async deleteAllByChild(childId: string): Promise<void> {
    const oid = new Types.ObjectId(childId);

    // 1. Delete all homework sessions
    await this.sessionModel.deleteMany({ childId: oid });

    // 2. Delete all homework chats related to this child
    await this.chatModel.deleteMany({ childId: oid });

    this.logger.log(`All homework data for child ${childId} erased.`);
  }
}
