import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Res,
  Query,
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
      req.user.role === 'child' ? req.user.parentId : req.user._id,
      body.imageBase64,
      body.mimeType || 'image/jpeg',
      req.user.role === 'child' ? req.user._id : body.childId,
    );

  }

  /** Stateless: analyze homework synchronously — no DB writes, no auth. For guest mode. */
  @Post('analyze-guest')
  async analyzeGuest(
    @Body() body: { imageBase64: string; mimeType?: string },
  ) {
    if (!body.imageBase64) throw new BadRequestException('imageBase64 is required');
    return this.homeworkService.analyzeGuestStateless(
      body.imageBase64,
      body.mimeType || 'image/jpeg',
    );
  }

  /** Stateless: single-turn chat — no DB writes, no auth. For guest mode. */
  @Post('guest-chat')
  async guestChat(
    @Body() body: { sessionContext: string; history: { role: 'user' | 'model'; content: string }[]; message: string },
  ) {
    if (!body.message) throw new BadRequestException('message is required');
    return this.homeworkService.guestChatStateless(
      body.sessionContext || '',
      body.history || [],
      body.message,
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
    return this.homeworkService.getSessions(req.user._id, req.user.role);
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
    return this.homeworkService.getSession(id, req.user._id, req.user.role);
  }


  /** Get a single ghost homework session. */
  @Get('ghost-session/:id')
  @UseGuards(GhostAuthGuard)
  async getGhostSession(@Param('id') id: string, @Req() req) {
    return this.homeworkService.getGhostSession(id, req.ghost.guestId);
  }

  @Get('session/:id/chat')
  @UseGuards(FirebaseAuthGuard)
  async getChatHistory(
    @Param('id') id: string,
    @Req() req,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    const skipVal = skip ? parseInt(skip, 10) : 0;
    const limitVal = limit ? parseInt(limit, 10) : 500;
    return this.homeworkService.getPaginatedChatHistory(id, req.user._id.toString(), skipVal, limitVal, req.user.role);

  }

  @Post('session/:id/link-match')
  @UseGuards(FirebaseAuthGuard)
  async linkMatch(
    @Param('id') id: string,
    @Body() body: { matchId: string },
    @Req() req,
  ) {
    if (!body.matchId) throw new BadRequestException('matchId is required');
    // Verify the user owns this session before linking
    await this.homeworkService.getSession(id, req.user._id.toString(), req.user.role);
    await this.homeworkService.linkMatch(id, body.matchId);

    return { success: true };
  }

  /** Stateless: streaming guest chat — returns tokens as SSE events. No auth, no DB writes. */
  @Post('guest-chat-stream')
  async guestChatStream(
    @Body() body: { sessionContext: string; history: { role: 'user' | 'model'; content: string }[]; message: string },
    @Res() res: any,
  ) {
    if (!body.message) {
      res.status(400).json({ message: 'message is required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = this.homeworkService.guestChatStream(
        body.sessionContext || '',
        body.history || [],
        body.message,
      );
      for await (const token of stream) {
        if (!res.writable) break;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      if (res.writable) res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err: any) {
      if (res.writable) res.write(`data: ${JSON.stringify({ error: err.message || 'Unknown error' })}\n\n`);
    } finally {
      res.end();
    }
  }
}
