import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ErrorLogsService } from './error-logs.service';
import { CreateErrorLogDto } from './dto/create-error-log.dto';

@Controller('error-logs')
export class ErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Post()
  async create(@Body() createErrorLogDto: CreateErrorLogDto) {
    return this.errorLogsService.create(createErrorLogDto);
  }

  // Optional: Add basic endpoint for internal debugging (might need protection)
  @Get()
  async findAll() {
    return this.errorLogsService.findAll();
  }
}
