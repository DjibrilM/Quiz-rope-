import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChildrenService } from './children.service';
import { ChildrenController } from './children.controller';
import { Child, ChildSchema } from './schemas/child.schema';
import {
  DeviceSession,
  DeviceSessionSchema,
} from './schemas/device-session.schema';
import { GuestLink, GuestLinkSchema } from './schemas/guest-link.schema';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MatchModule } from '../match/match.module';
import { HomeworkModule } from '../homework/homework.module';
import { NotificationAiService } from './notification-ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: DeviceSession.name, schema: DeviceSessionSchema },
      { name: GuestLink.name, schema: GuestLinkSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => RealtimeModule),
    forwardRef(() => MatchModule),
    forwardRef(() => HomeworkModule),
  ],
  controllers: [ChildrenController],
  providers: [ChildrenService, NotificationAiService],
  exports: [ChildrenService, NotificationAiService],
})
export class ChildrenModule {}
