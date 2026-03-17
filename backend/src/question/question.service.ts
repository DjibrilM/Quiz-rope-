import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from './schemas/question.schema';
import { isGeminiConfigured } from '../config/gemini.config';
import { invokeQuestionGraph, validateContext } from './question.graph';
import { MOCK_QUESTIONS } from './mock-questions';

@Injectable()
export class QuestionProviderService {
  private readonly logger = new Logger(QuestionProviderService.name);

  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
  ) {}

  /**
   * @param threadId  Unique ID per match/session — the graph uses this to
   *                  persist conversation history so Gemini never repeats questions.
   */
  async getQuestions(
    subject: string,
    difficulty: string,
    count: number = 10,
    threadId?: string,
    context?: string,
    language?: string,
  ): Promise<Question[]> {
    if (context?.trim() && isGeminiConfigured) {
      const verdict = await validateContext(subject, context.trim());
      if (verdict === 'not_related') {
        throw new BadRequestException('CONTEXT_NOT_RELATED');
      }
    }

    if (isGeminiConfigured) {
      try {
        return await this.generateWithGraph(subject, difficulty, count, threadId, context, language);
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        this.logger.error(
          'LangGraph/Gemini failed, falling back to mock:',
          error.message,
        );
      }
    }

    this.logger.log('Using mock questions');
    return this.getMockQuestions(subject, difficulty, count);
  }

  private async generateWithGraph(
    subject: string,
    difficulty: string,
    count: number,
    threadId?: string,
    context?: string,
    language?: string,
  ): Promise<Question[]> {
    // Use match ID as thread, or generate a one-off thread
    const thread = threadId || `oneoff-${Date.now()}`;

    const parsed = await invokeQuestionGraph(subject, difficulty, count, thread, context, language);

    const questions = await Promise.all(
      parsed.map((q: any) =>
        this.questionModel.create({
          ...q,
          subject,
          difficulty,
          generatedBy: 'langchain-gemini',
        }),
      ),
    );

    this.logger.log(
      `Generated ${questions.length} questions via LangGraph/Gemini (thread: ${thread})`,
    );
    return questions;
  }

  private async getMockQuestions(
    subject: string,
    difficulty: string,
    count: number,
  ): Promise<Question[]> {
    let filtered = MOCK_QUESTIONS.filter(
      (q) =>
        q.subject === subject.toUpperCase() &&
        q.difficulty === difficulty.toUpperCase(),
    );

    if (filtered.length < count) {
      filtered = MOCK_QUESTIONS.filter(
        (q) => q.subject === subject.toUpperCase(),
      );
    }

    if (filtered.length < count) {
      filtered = [...MOCK_QUESTIONS];
    }

    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, count);

    const questions = await Promise.all(
      shuffled.map((q) =>
        this.questionModel.create({ ...q, generatedBy: 'mock' }),
      ),
    );

    return questions;
  }
}
