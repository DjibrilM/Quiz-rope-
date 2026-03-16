import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { Parent, ParentSchema } from './schemas/parent.schema';
import {
  DeviceSession,
  DeviceSessionSchema,
} from '../children/schemas/device-session.schema';
import {
  GuestLink,
  GuestLinkSchema,
} from '../children/schemas/guest-link.schema';
import { initializeFirebase } from '../config/firebase.config';
import { EmailService } from '../email/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Parent.name, schema: ParentSchema },
      { name: DeviceSession.name, schema: DeviceSessionSchema },
      { name: GuestLink.name, schema: GuestLinkSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard, EmailService],
  exports: [AuthService, FirebaseAuthGuard, EmailService],
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);

  onModuleInit() {
    initializeFirebase();
    this.logger.log('Auth module initialized');
  }
}
