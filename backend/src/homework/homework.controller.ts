import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';

@Controller('homework')
@UseGuards(FirebaseAuthGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post('analyze')
  async analyze(
    @Body() body: { imageBase64: string; mimeType?: string },
    @Req() req,
  ) {
    if (!body.imageBase64) {
      throw new BadRequestException('imageBase64 is required');
    }
    return this.homeworkService.analyze(
      req.user._id,
      body.imageBase64,
      body.mimeType || 'image/jpeg',
    );
  }

  @Get('sessions')
  async getSessions(@Req() req) {
    return this.homeworkService.getSessions(req.user._id);
  }

  @Get('session/:id')
  async getSession(@Param('id') id: string, @Req() req) {
    return this.homeworkService.getSession(id, req.user._id);
  }

  @Get('session/:id/chat')
  async getChatHistory(@Param('id') id: string) {
    return this.homeworkService.getChatHistory(id);
  }

  @Post('session/:id/link-match')
  async linkMatch(
    @Param('id') id: string,
    @Body() body: { matchId: string },
  ) {
    if (!body.matchId) throw new BadRequestException('matchId is required');
    await this.homeworkService.linkMatch(id, body.matchId);
    return { success: true };
  }
}
