import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match } from './schemas/match.schema';
import { Answer } from './schemas/answer.schema';
import { Child } from '../children/schemas/child.schema';
import { QuestionProviderService } from '../question/question.service';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(Child.name) private childModel: Model<Child>,
    private questionProvider: QuestionProviderService,
  ) {}

  async createMatch(
    hostParentId: string,
    subject: string,
    difficulty: string,
    maxRounds: number,
    teams: { name: string; color: string; side: string; players?: string[] }[],
  ): Promise<Match> {
    // Create match first so we have its _id as the conversation threadId
    const match = await this.matchModel.create({
      hostParentId: new Types.ObjectId(hostParentId),
      subject,
      difficulty,
      maxRounds,
      teams: teams.map((t) => ({
        name: t.name,
        color: t.color,
        side: t.side,
        players: (t.players || []).map((p) => new Types.ObjectId(p)),
      })),
      questions: [],
    });

    // Generate questions with match ID as threadId for conversation persistence
    const questions = await this.questionProvider.getQuestions(
      subject,
      difficulty,
      maxRounds,
      match._id.toString(),
    );

    match.questions = questions.map((q) => q._id) as any;
    await match.save();

    this.logger.log(`Match created: ${match._id}`);
    return match;
  }

  async getMatch(matchId: string): Promise<Match | null> {
    return this.matchModel.findById(matchId).populate('questions');
  }

  async getMatchesByParent(parentId: string): Promise<Match[]> {
    return this.matchModel
      .find({ hostParentId: new Types.ObjectId(parentId) })
      .sort({ createdAt: -1 });
  }

  async submitAnswer(
    matchId: string,
    playerId: string,
    teamSide: string,
    answerIndex: number,
    responseTime: number,
  ): Promise<{
    isCorrect: boolean;
    correctIndex: number;
    ropeMovement: number;
    newRopePosition: number;
    teamScores: { left: number; right: number };
    gameOver: boolean;
    winner?: string;
  }> {
    const match = await this.matchModel
      .findById(matchId)
      .populate('questions');
    if (!match) throw new Error('Match not found');

    const currentQuestion = match.questions[
      match.currentQuestionIndex
    ] as any;
    if (!currentQuestion) throw new Error('No current question');

    const isCorrect = answerIndex === currentQuestion.correctIndex;

    // Rope physics (kept for backward compat)
    let ropeMovement = 0;
    if (isCorrect) {
      ropeMovement = teamSide === 'LEFT' ? -1 : 1;
    } else {
      ropeMovement = teamSide === 'LEFT' ? 0.5 : -0.5;
    }

    const newRopePosition = Math.max(
      -5,
      Math.min(5, match.ropePosition + ropeMovement),
    );

    // Points-based scoring: +10 for correct answer
    if (isCorrect) {
      if (teamSide === 'LEFT') {
        match.teamScoreLeft += 10;
      } else {
        match.teamScoreRight += 10;
      }
    }

    // Save answer
    await this.answerModel.create({
      matchId: match._id,
      questionId: currentQuestion._id,
      playerId,
      teamSide,
      answerIndex,
      isCorrect,
      responseTime,
      round: match.currentQuestionIndex,
    });

    // Update match
    match.ropePosition = newRopePosition;

    // No early termination — game ends only when all rounds are done
    await match.save();

    return {
      isCorrect,
      correctIndex: currentQuestion.correctIndex,
      ropeMovement,
      newRopePosition,
      teamScores: { left: match.teamScoreLeft, right: match.teamScoreRight },
      gameOver: false,
    };
  }

  async advanceQuestion(matchId: string): Promise<any> {
    const match = await this.matchModel
      .findById(matchId)
      .populate('questions');
    if (!match) return null;

    match.currentQuestionIndex += 1;
    match.rounds = match.currentQuestionIndex;

    // Check if we've run out of questions
    if (match.currentQuestionIndex >= match.questions.length) {
      match.status = 'COMPLETED';
      // Winner = team with higher score (fall back to rope position for ties)
      match.winner =
        match.teamScoreLeft > match.teamScoreRight
          ? 'LEFT'
          : match.teamScoreRight > match.teamScoreLeft
            ? 'RIGHT'
            : match.ropePosition <= 0
              ? 'LEFT'
              : 'RIGHT';
      await match.save();
      return {
        gameOver: true,
        winner: match.winner,
        teamScores: { left: match.teamScoreLeft, right: match.teamScoreRight },
      };
    }

    await match.save();

    const question = match.questions[match.currentQuestionIndex] as any;
    return {
      gameOver: false,
      question: {
        id: question._id,
        text: question.text,
        options: question.options,
        subject: question.subject,
      },
      round: match.currentQuestionIndex,
      maxRounds: match.maxRounds,
      teamScores: { left: match.teamScoreLeft, right: match.teamScoreRight },
    };
  }

  async getCurrentQuestion(matchId: string): Promise<any> {
    const match = await this.matchModel
      .findById(matchId)
      .populate('questions');
    if (!match) return null;

    const question = match.questions[match.currentQuestionIndex] as any;
    if (!question) return null;

    return {
      id: question._id,
      text: question.text,
      options: question.options,
      subject: question.subject,
    };
  }

  async getMatchStats(matchId: string) {
    const answers = await this.answerModel.find({
      matchId: new Types.ObjectId(matchId),
    });

    const playerMap = new Map<
      string,
      { correct: number; total: number; totalTime: number }
    >();

    for (const answer of answers) {
      const stats = playerMap.get(answer.playerId) || {
        correct: 0,
        total: 0,
        totalTime: 0,
      };
      stats.total += 1;
      stats.totalTime += answer.responseTime;
      if (answer.isCorrect) stats.correct += 1;
      playerMap.set(answer.playerId, stats);
    }

    return Array.from(playerMap.entries()).map(([playerId, stats]) => ({
      playerId,
      correctAnswers: stats.correct,
      totalAnswers: stats.total,
      avgResponseTime:
        stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
    }));
  }

  async getLeaderboard(parentId: string) {
    // Get all match IDs for this parent
    const matches = await this.matchModel
      .find({ hostParentId: new Types.ObjectId(parentId) })
      .select('_id');
    const matchIds = matches.map((m) => m._id);

    if (matchIds.length === 0) return [];

    const pipeline = [
      { $match: { matchId: { $in: matchIds } } },
      {
        $group: {
          _id: '$playerId',
          correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          totalAnswers: { $sum: 1 },
          totalTime: { $sum: '$responseTime' },
          matchIds: { $addToSet: '$matchId' },
        },
      },
      {
        $project: {
          playerId: '$_id',
          correctAnswers: 1,
          totalAnswers: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalAnswers', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$correctAnswers', '$totalAnswers'] }, 100] },
                  0,
                ],
              },
              0,
            ],
          },
          gamesPlayed: { $size: '$matchIds' },
        },
      },
      { $sort: { correctAnswers: -1 as const } },
    ];

    return this.answerModel.aggregate(pipeline);
  }

  async getChildPerformance(parentId: string, childId: string) {
    const matches = await this.matchModel
      .find({ hostParentId: new Types.ObjectId(parentId) })
      .select('_id');
    const matchIds = matches.map((m) => m._id);

    const child = await this.childModel
      .findById(childId)
      .select('displayName');

    if (matchIds.length === 0) {
      return {
        childId,
        displayName: child?.displayName || '',
        totalMatches: 0,
        totalQuestions: 0,
        overallAccuracy: 0,
        subjectStats: [],
        bestSubject: null,
        weakestSubject: null,
      };
    }

    const [subjectStats, childMatchIds] = await Promise.all([
      this.answerModel.aggregate([
        {
          $match: {
            matchId: { $in: matchIds },
            playerId: childId,
          },
        },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: '$question' },
        {
          $group: {
            _id: '$question.subject',
            totalQuestions: { $sum: 1 },
            correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            totalTime: { $sum: '$responseTime' },
            matchIds: { $addToSet: '$matchId' },
          },
        },
        {
          $project: {
            subject: '$_id',
            totalQuestions: 1,
            correctAnswers: 1,
            accuracy: {
              $cond: [
                { $gt: ['$totalQuestions', 0] },
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$correctAnswers', '$totalQuestions'] },
                        100,
                      ],
                    },
                    0,
                  ],
                },
                0,
              ],
            },
            avgResponseTime: {
              $cond: [
                { $gt: ['$totalQuestions', 0] },
                {
                  $round: [
                    { $divide: ['$totalTime', '$totalQuestions'] },
                    0,
                  ],
                },
                0,
              ],
            },
            matchesPlayed: { $size: '$matchIds' },
          },
        },
        { $sort: { accuracy: -1 as const } },
      ]),
      this.answerModel.distinct('matchId', {
        matchId: { $in: matchIds },
        playerId: childId,
      }),
    ]);

    const totalQuestions = subjectStats.reduce(
      (sum, s) => sum + s.totalQuestions,
      0,
    );
    const totalCorrect = subjectStats.reduce(
      (sum, s) => sum + s.correctAnswers,
      0,
    );
    const best = subjectStats.length > 0 ? subjectStats[0] : null;
    const weakest =
      subjectStats.length > 1
        ? subjectStats[subjectStats.length - 1]
        : null;

    return {
      childId,
      displayName: child?.displayName || '',
      totalMatches: childMatchIds.length,
      totalQuestions,
      overallAccuracy:
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0,
      subjectStats: subjectStats.map((s) => ({
        subject: s.subject,
        totalQuestions: s.totalQuestions,
        correctAnswers: s.correctAnswers,
        accuracy: s.accuracy,
        avgResponseTime: s.avgResponseTime,
        matchesPlayed: s.matchesPlayed,
      })),
      bestSubject: best?.subject || null,
      weakestSubject: weakest?.subject || null,
    };
  }

  async getChildMatches(parentId: string, childId: string) {
    const matches = await this.matchModel
      .find({
        hostParentId: new Types.ObjectId(parentId),
        status: 'COMPLETED',
      })
      .sort({ createdAt: -1 });

    if (matches.length === 0) return [];

    const matchIds = matches.map((m) => m._id);

    const answerStats = await this.answerModel.aggregate([
      {
        $match: {
          matchId: { $in: matchIds },
          playerId: childId,
        },
      },
      {
        $group: {
          _id: '$matchId',
          correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          totalQuestions: { $sum: 1 },
          teamSide: { $first: '$teamSide' },
        },
      },
    ]);

    const statsMap = new Map(
      answerStats.map((s) => [s._id.toString(), s]),
    );

    return matches
      .filter((m) => statsMap.has(m._id.toString()))
      .map((m) => {
        const stats = statsMap.get(m._id.toString())!;
        const accuracy =
          stats.totalQuestions > 0
            ? Math.round(
                (stats.correctAnswers / stats.totalQuestions) * 100,
              )
            : 0;
        return {
          matchId: m._id.toString(),
          subject: m.subject,
          difficulty: m.difficulty,
          date: (m as any).createdAt?.toISOString() || '',
          correctAnswers: stats.correctAnswers,
          totalQuestions: stats.totalQuestions,
          accuracy,
          winner: m.winner,
          childTeamSide: stats.teamSide,
          didWin: m.winner === stats.teamSide,
        };
      });
  }

  async getMatchAnswerReview(matchId: string, childId: string) {
    return this.answerModel.aggregate([
      {
        $match: {
          matchId: new Types.ObjectId(matchId),
          playerId: childId,
        },
      },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      { $sort: { round: 1 } },
      {
        $project: {
          questionText: '$question.text',
          options: '$question.options',
          correctIndex: '$question.correctIndex',
          childAnswerIndex: '$answerIndex',
          isCorrect: 1,
          responseTime: 1,
          explanation: { $ifNull: ['$question.explanation', ''] },
        },
      },
    ]);
  }
}
