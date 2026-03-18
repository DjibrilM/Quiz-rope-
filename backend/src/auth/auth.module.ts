import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { GhostAuthGuard } from './guards/ghost-auth.guard';
import { Parent, ParentSchema } from './schemas/parent.schema';
import {
  DeviceSession,
  DeviceSessionSchema,
} from '../children/schemas/device-session.schema';
import {
  GuestLink,
  GuestLinkSchema,
} from '../children/schemas/guest-link.schema';
import { Match, MatchSchema } from '../match/schemas/match.schema';
import { Answer, AnswerSchema } from '../match/schemas/answer.schema';
import {
  HomeworkSession,
  HomeworkSessionSchema,
} from '../homework/schemas/homework-session.schema';
import { initializeFirebase } from '../config/firebase.config';
import { EmailService } from '../email/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Parent.name, schema: ParentSchema },
      { name: DeviceSession.name, schema: DeviceSessionSchema },
      { name: GuestLink.name, schema: GuestLinkSchema },
      { name: Match.name, schema: MatchSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: HomeworkSession.name, schema: HomeworkSessionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard, GhostAuthGuard, EmailService],
  exports: [AuthService, FirebaseAuthGuard, GhostAuthGuard, EmailService],
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);

  onModuleInit() {
    initializeFirebase();
    this.logger.log('Auth module initialized');
  }
}
