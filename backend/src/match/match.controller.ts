import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { MatchService } from './match.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GhostAuthGuard } from '../auth/guards/ghost-auth.guard';

const VALID_SUBJECTS = ['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY'];
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const VALID_GAME_MODES = ['solo', 'splitscreen'];
const VALID_TEAM_SIDES = ['LEFT', 'RIGHT'];

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createMatch(
    @Req() req,
    @Body()
    body: {
      subject: string;
      difficulty: string;
      maxRounds: number;
      gameMode?: string;
      context?: string;
      teams: { name: string; color: string; side: string; players?: string[] }[];
      childIds?: string[];
      language?: string;
    },
  ) {
    if (!body.subject || !VALID_SUBJECTS.includes(body.subject.toUpperCase())) {
      throw new BadRequestException(`subject must be one of: ${VALID_SUBJECTS.join(', ')}`);
    }
    if (!body.difficulty || !VALID_DIFFICULTIES.includes(body.difficulty.toUpperCase())) {
      throw new BadRequestException(`difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
    }
    const maxRounds = body.maxRounds || 10;
    if (maxRounds < 1 || maxRounds > 30) {
      throw new BadRequestException('maxRounds must be between 1 and 30');
    }
    const gameMode = body.gameMode || 'splitscreen';
    if (!VALID_GAME_MODES.includes(gameMode)) {
      throw new BadRequestException(`gameMode must be one of: ${VALID_GAME_MODES.join(', ')}`);
    }

    return this.matchService.createMatch(
      req.user._id,
      body.subject.toUpperCase(),
      body.difficulty.toUpperCase(),
      maxRounds,
      body.teams || [
        { name: 'Red Team', color: '#EF4444', side: 'LEFT' },
        { name: 'Blue Team', color: '#3B82F6', side: 'RIGHT' },
      ],
      gameMode,
      body.context,
      body.childIds,
      body.language,
    );
  }

  /** Ghost (guest) creates a match — no parent account required. */
  @Post('ghost')
  @UseGuards(GhostAuthGuard)
  async createGhostMatch(
    @Req() req,
    @Body()
    body: {
      subject: string;
      difficulty: string;
      maxRounds?: number;
      gameMode?: string;
      context?: string;
      language?: string;
    },
  ) {
    if (!body.subject || !VALID_SUBJECTS.includes(body.subject.toUpperCase())) {
      throw new BadRequestException(`subject must be one of: ${VALID_SUBJECTS.join(', ')}`);
    }
    if (!body.difficulty || !VALID_DIFFICULTIES.includes(body.difficulty.toUpperCase())) {
      throw new BadRequestException(`difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
    }
    const maxRounds = body.maxRounds || 10;
    if (maxRounds < 1 || maxRounds > 30) {
      throw new BadRequestException('maxRounds must be between 1 and 30');
    }
    const gameMode = body.gameMode || 'solo';
    if (!VALID_GAME_MODES.includes(gameMode)) {
      throw new BadRequestException(`gameMode must be one of: ${VALID_GAME_MODES.join(', ')}`);
    }

    return this.matchService.createGhostMatch(
      req.ghost.guestId,
      body.subject.toUpperCase(),
      body.difficulty.toUpperCase(),
      maxRounds,
      gameMode,
      body.context,
      body.language,
    );
  }

  @Get('leaderboard')
  @UseGuards(FirebaseAuthGuard)
  async getLeaderboard(@Req() req) {
    return this.matchService.getLeaderboard(req.user._id);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getMatches(@Req() req) {
    return this.matchService.getMatchesByParent(req.user._id);
  }

  @Get('child/:childId/stats')
  @UseGuards(FirebaseAuthGuard)
  async getChildStats(@Req() req, @Param('childId') childId: string) {
    return this.matchService.getChildPerformance(req.user._id, childId);
  }

  @Get('child/:childId/matches')
  @UseGuards(FirebaseAuthGuard)
  async getChildMatches(@Req() req, @Param('childId') childId: string) {
    return this.matchService.getChildMatches(req.user._id, childId);
  }

  @Post(':id/answer')
  async submitAnswer(
    @Param('id') id: string,
    @Body() body: { playerId: string; teamSide: string; answerIndex: number; responseTime: number; questionId?: string; isCorrect?: boolean },
  ) {
    if (!body.playerId || typeof body.playerId !== 'string') {
      throw new BadRequestException('playerId is required');
    }
    if (!VALID_TEAM_SIDES.includes(body.teamSide)) {
      throw new BadRequestException('teamSide must be LEFT or RIGHT');
    }
    if (typeof body.answerIndex !== 'number' || body.answerIndex < 0) {
      throw new BadRequestException('answerIndex must be a non-negative number');
    }
    return this.matchService.submitAnswer(
      id,
      body.playerId,
      body.teamSide,
      body.answerIndex,
      body.responseTime ?? 0,
      body.questionId,
      body.isCorrect,
    );
  }

  @Patch(':id/complete')
  async completeMatch(
    @Param('id') id: string,
    @Body() body: { winner: string; rounds: number },
  ) {
    return this.matchService.completeMatch(id, body);
  }

  @Get(':id')
  async getMatch(@Param('id') id: string) {
    return this.matchService.getMatch(id);
  }

  @Get(':id/stats')
  async getMatchStats(@Param('id') id: string) {
    return this.matchService.getMatchStats(id);
  }

  @Get(':id/solo-correction')
  async getSoloCorrection(@Param('id') id: string) {
    return this.matchService.getSoloCorrection(id);
  }

  @Get(':matchId/review/:childId')
  @UseGuards(FirebaseAuthGuard)
  async getMatchReview(
    @Param('matchId') matchId: string,
    @Param('childId') childId: string,
  ) {
    return this.matchService.getMatchAnswerReview(matchId, childId);
  }

  /** Guest kids use this to look up a match by the 6-char lobby code. */
  @Get('join/:code')
  async joinByCode(@Param('code') code: string) {
    const match = await this.matchService.findByCode(code);
    if (!match) {
      return { found: false };
    }
    return {
      found: true,
      matchId: match._id.toString(),
      subject: (match as any).subject,
      difficulty: (match as any).difficulty,
      maxRounds: (match as any).maxRounds,
      status: (match as any).status,
    };
  }
}
