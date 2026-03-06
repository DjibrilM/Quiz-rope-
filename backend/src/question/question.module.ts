import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionProviderService } from './question.service';
import { Question, QuestionSchema } from './schemas/question.schema';
import { initializeGemini } from '../config/gemini.config';
import { initQuestionGraph } from './question.graph';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  providers: [QuestionProviderService],
  exports: [QuestionProviderService],
})
export class QuestionModule implements OnModuleInit {
  private readonly logger = new Logger(QuestionModule.name);

  async onModuleInit() {
    initializeGemini();

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizrope';
    await initQuestionGraph(mongoUri);

    this.logger.log('Question module initialized');
  }
}
