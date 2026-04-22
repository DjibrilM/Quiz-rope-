import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ErrorLogsController } from './error-logs.controller';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLog, ErrorLogSchema } from './schemas/error-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ErrorLog.name, schema: ErrorLogSchema }]),
  ],
  controllers: [ErrorLogsController],
  providers: [ErrorLogsService],
  exports: [ErrorLogsService],
})
export class ErrorLogsModule {}
