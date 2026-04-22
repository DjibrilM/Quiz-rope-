import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ErrorLog } from './schemas/error-log.schema';
import { CreateErrorLogDto } from './dto/create-error-log.dto';

@Injectable()
export class ErrorLogsService {
  constructor(
    @InjectModel(ErrorLog.name) private errorLogModel: Model<ErrorLog>,
  ) {}

  async create(createErrorLogDto: CreateErrorLogDto): Promise<ErrorLog> {
    const createdLog = new this.errorLogModel(createErrorLogDto);
    return createdLog.save();
  }

  async findAll(): Promise<ErrorLog[]> {
    return this.errorLogModel.find().sort({ createdAt: -1 }).limit(100).exec();
  }
}
