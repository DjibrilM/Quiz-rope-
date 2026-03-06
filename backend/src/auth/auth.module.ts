import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { Parent, ParentSchema } from './schemas/parent.schema';
import { Otp, OtpSchema } from './schemas/otp.schema';
import {
  DeviceSession,
  DeviceSessionSchema,
} from '../children/schemas/device-session.schema';
import { initializeFirebase } from '../config/firebase.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Parent.name, schema: ParentSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: DeviceSession.name, schema: DeviceSessionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);

  onModuleInit() {
    initializeFirebase();
    this.logger.log('Auth module initialized');
  }
}
