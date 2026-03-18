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
import { GhostAuthGuard } from '../auth/guards/ghost-auth.guard';

@Controller('homework')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post('analyze')
  @UseGuards(FirebaseAuthGuard)
  async analyze(
    @Body() body: { imageBase64: string; mimeType?: string; childId?: string },
    @Req() req,
  ) {
    if (!body.imageBase64) {
      throw new BadRequestException('imageBase64 is required');
    }
    return this.homeworkService.analyze(
      req.user._id,
      body.imageBase64,
      body.mimeType || 'image/jpeg',
      body.childId,
    );
  }

  /** Ghost (guest) submits homework — no parent account required. */
  @Post('ghost-analyze')
  @UseGuards(GhostAuthGuard)
  async ghostAnalyze(
    @Body() body: { imageBase64: string; mimeType?: string },
    @Req() req,
  ) {
    if (!body.imageBase64) {
      throw new BadRequestException('imageBase64 is required');
    }
    return this.homeworkService.analyzeForGuest(
      req.ghost.guestId,
      body.imageBase64,
      body.mimeType || 'image/jpeg',
    );
  }

  @Get('sessions')
  @UseGuards(FirebaseAuthGuard)
  async getSessions(@Req() req) {
    return this.homeworkService.getSessions(req.user._id);
  }

  /** List homework sessions for a ghost user. */
  @Get('ghost-sessions')
  @UseGuards(GhostAuthGuard)
  async getGhostSessions(@Req() req) {
    return this.homeworkService.getGhostSessions(req.ghost.guestId);
  }

  @Get('session/:id')
  @UseGuards(FirebaseAuthGuard)
  async getSession(@Param('id') id: string, @Req() req) {
    return this.homeworkService.getSession(id, req.user._id);
  }

  /** Get a single ghost homework session. */
  @Get('ghost-session/:id')
  @UseGuards(GhostAuthGuard)
  async getGhostSession(@Param('id') id: string, @Req() req) {
    return this.homeworkService.getGhostSession(id, req.ghost.guestId);
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
