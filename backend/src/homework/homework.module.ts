import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';
import {
  HomeworkSession,
  HomeworkSessionSchema,
} from './schemas/homework-session.schema';
import {
  HomeworkChat,
  HomeworkChatSchema,
} from './schemas/homework-chat.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HomeworkSession.name, schema: HomeworkSessionSchema },
      { name: HomeworkChat.name, schema: HomeworkChatSchema },
    ]),
    AuthModule,
  ],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}
