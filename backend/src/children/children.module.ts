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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: DeviceSession.name, schema: DeviceSessionSchema },
      { name: GuestLink.name, schema: GuestLinkSchema },
    ]),
    AuthModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [ChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
