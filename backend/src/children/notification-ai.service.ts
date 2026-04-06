import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { GEMINI_MODEL } from '../constants';

@Injectable()
export class NotificationAiService {
  private readonly logger = new Logger(NotificationAiService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateInactivityMessage(
    childName: string,
    grade: string,
    stats?: { bestSubject?: string; weakestSubject?: string; streak?: number },
  ): Promise<string> {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured, using fallback message');
      return `We miss you, ${childName}! Ready for some fun learning today? 🚀`;
    }

    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey,
      maxOutputTokens: 100,
      temperature: 0.8, // Slightly higher for more creative/emotional variety
    });

    const subjectContext = stats?.bestSubject 
      ? `Their favorite subject is ${stats.bestSubject}.` 
      : '';
    const struggleContext = stats?.weakestSubject 
      ? `They've been working hard on ${stats.weakestSubject} lately.` 
      : '';
    const streakContext = stats?.streak && stats.streak > 0 
      ? `They had a ${stats.streak}-day streak going!` 
      : '';

    const systemPrompt = new SystemMessage(
      `You are a warm, encouraging, and slightly emotional virtual tutor for a K-12 educational app called QuizRope.
      Your goal is to write a short push notification (max 120 characters) for a child who hasn't visited the app in 2 days.
      The message should feel personal, caring, and make them feel missed. Use emojis.
      Avoid sounding like a "demand" to do homework. Instead, sound like a friend who misses their curiosity.`
    );

    const humanPrompt = new HumanMessage(
      `Child's Name: ${childName}
      Grade: ${grade}
      ${subjectContext}
      ${struggleContext}
      ${streakContext}
      
      Write a personalized, emotional "we miss you" notification message.`
    );

    try {
      const response = await model.invoke([systemPrompt, humanPrompt]);
      const text = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      
      // Clean up any quotes or extra whitespace
      return text.replace(/^"|"$/g, '').trim();
    } catch (error) {
      this.logger.error(`Failed to generate AI notification: ${error.message}`);
      return `Hey ${childName}, your brain is missing its daily workout! Come back and play! 🧠✨`;
    }
  }
}
