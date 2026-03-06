import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { Match, MatchSchema } from './schemas/match.schema';
import { Answer, AnswerSchema } from './schemas/answer.schema';
import { Child, ChildSchema } from '../children/schemas/child.schema';
import { QuestionModule } from '../question/question.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: Child.name, schema: ChildSchema },
    ]),
    QuestionModule,
    AuthModule,
  ],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
