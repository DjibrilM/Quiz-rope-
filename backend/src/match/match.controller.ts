import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { MatchService } from './match.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';

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
      teams: { name: string; color: string; side: string; players?: string[] }[];
    },
  ) {
    return this.matchService.createMatch(
      req.user._id,
      body.subject,
      body.difficulty,
      body.maxRounds || 10,
      body.teams || [
        { name: 'Red Team', color: '#EF4444', side: 'LEFT' },
        { name: 'Blue Team', color: '#3B82F6', side: 'RIGHT' },
      ],
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

  @Get(':id')
  async getMatch(@Param('id') id: string) {
    return this.matchService.getMatch(id);
  }

  @Get(':id/stats')
  async getMatchStats(@Param('id') id: string) {
    return this.matchService.getMatchStats(id);
  }

  @Get(':matchId/review/:childId')
  @UseGuards(FirebaseAuthGuard)
  async getMatchReview(
    @Param('matchId') matchId: string,
    @Param('childId') childId: string,
  ) {
    return this.matchService.getMatchAnswerReview(matchId, childId);
  }
}
