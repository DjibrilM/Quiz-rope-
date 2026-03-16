import { Module, forwardRef } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { MatchModule } from '../match/match.module';
import { ChildrenModule } from '../children/children.module';
import { HomeworkModule } from '../homework/homework.module';

@Module({
  imports: [MatchModule, forwardRef(() => ChildrenModule), HomeworkModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
