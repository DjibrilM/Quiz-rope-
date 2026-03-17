import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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
    gameMode: string = 'splitscreen',
    context?: string,
    childIds?: string[],
    language?: string,
  ): Promise<Match> {
    // Create match first so we have its _id as the conversation threadId
    const match = await this.matchModel.create({
      hostParentId: new Types.ObjectId(hostParentId),
      subject,
      difficulty,
      maxRounds,
      gameMode,
      // Solo and splitscreen are local games — start immediately
      status: (gameMode === 'solo' || gameMode === 'splitscreen') ? 'IN_PROGRESS' : 'WAITING',
      teams: teams.map((t) => ({
        name: t.name,
        color: t.color,
        side: t.side,
        players: (t.players || []).map((p) => new Types.ObjectId(p)),
      })),
      questions: [],
      childIds: (childIds || [])
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id)),
    });

    // Generate questions with match ID as threadId for conversation persistence
    const questions = await this.questionProvider.getQuestions(
      subject,
      difficulty,
      maxRounds,
      match._id.toString(),
      context,
      language,
    );

    match.questions = questions.map((q) => q._id) as any;
    await match.save();

    this.logger.log(`Match created: ${match._id}`);
    return match;
  }

  async getMatch(matchId: string): Promise<Match> {
    if (!Types.ObjectId.isValid(matchId)) {
      throw new BadRequestException('Invalid match ID');
    }
    const match = await this.matchModel.findById(matchId).populate('questions');
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  async getMatchesByParent(parentId: string): Promise<Match[]> {
    return this.matchModel
      .find({ hostParentId: new Types.ObjectId(parentId) })
      .sort({ createdAt: -1 });
  }

  async completeMatch(
    matchId: string,
    data: { winner: string; rounds: number },
  ): Promise<Match> {
    if (!Types.ObjectId.isValid(matchId)) {
      throw new BadRequestException('Invalid match ID');
    }
    const match = await this.matchModel.findByIdAndUpdate(
      matchId,
      {
        status: 'COMPLETED',
        winner: data.winner,
        rounds: data.rounds,
      },
      { new: true },
    );
    if (!match) throw new NotFoundException('Match not found');
    this.logger.log(`Match completed: ${matchId} | winner=${data.winner}`);
    return match;
  }

  /**
   * Finds an active match by the 6-character display code shown in the lobby.
   * The code is the last 6 hex characters of the match's MongoDB ObjectId.
   */
  async findByCode(code: string): Promise<Match | null> {
    const upper = code.toUpperCase();
    // Search recent non-completed matches to keep the scan small
    const recent = await this.matchModel
      .find({ status: { $ne: 'COMPLETED' } })
      .sort({ createdAt: -1 })
      .limit(200)
      .exec();
    return (
      recent.find(
        (m) => m._id.toString().slice(-6).toUpperCase() === upper,
      ) ?? null
    );
  }

  async submitAnswer(
    matchId: string,
    playerId: string,
    teamSide: string,
    answerIndex: number,
    responseTime: number,
    questionId?: string,
    isCorrectOverride?: boolean,
  ): Promise<{
    isCorrect: boolean;
    correctIndex: number;
    ropeMovement: number;
    newRopePosition: number;
    teamScores: { left: number; right: number };
    gameOver: boolean;
    winner?: string;
  }> {
    if (!Types.ObjectId.isValid(matchId)) {
      throw new BadRequestException('Invalid match ID');
    }
    const match = await this.matchModel
      .findById(matchId)
      .populate('questions');
    if (!match) throw new NotFoundException('Match not found');

    // Prefer questionId from client (local mode); fall back to currentQuestionIndex
    let currentQuestion: any;
    if (questionId) {
      currentQuestion = (match.questions as any[]).find(
        (q: any) => q._id?.toString() === questionId,
      );
    } else {
      currentQuestion = match.questions[match.currentQuestionIndex] as any;
    }
    if (!currentQuestion) {
      this.logger.warn(`submitAnswer: question not found for match ${matchId} (questionId=${questionId ?? 'none'})`);
      throw new NotFoundException('Question not found');
    }

    // Trust the client's isCorrect when provided — the frontend shuffles options
    // and has the correct shuffled correctIndex; the DB stores the original index.
    const isCorrect = isCorrectOverride !== undefined
      ? isCorrectOverride
      : answerIndex === currentQuestion.correctIndex;

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
    this.logger.debug(`submitAnswer saved: matchId=${match._id} playerId=${playerId} teamSide=${teamSide} isCorrect=${isCorrect}`);

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
        correctIndex: question.correctIndex,
        explanation: question.explanation || '',
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
      correctIndex: question.correctIndex,
      explanation: question.explanation || '',
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
    const [parentMatchDocs, child] = await Promise.all([
      this.matchModel
        .find({ hostParentId: new Types.ObjectId(parentId) })
        .select('_id')
        .lean(),
      this.childModel.findById(childId).select('displayName').lean(),
    ]);

    const matchIds = parentMatchDocs.map((m) => m._id);

    if (matchIds.length === 0) {
      return {
        childId,
        displayName: (child as any)?.displayName || '',
        totalMatches: 0,
        totalQuestions: 0,
        overallAccuracy: 0,
        subjectStats: [],
        bestSubject: null,
        weakestSubject: null,
      };
    }

    // Include display name in player ID filter to catch games played without
    // selecting the child chip (where name string was used as playerId).
    const playerIds: string[] = [childId];
    if ((child as any)?.displayName) playerIds.push((child as any).displayName);

    // Run all three aggregations in parallel for performance
    const [rawTotals, childMatchIds, subjectStats] = await Promise.all([
      // Step 1: exact totals straight from answers — no question lookup,
      // so no rows are silently dropped by $unwind
      this.answerModel.aggregate([
        { $match: { matchId: { $in: matchIds }, playerId: { $in: playerIds } } },
        {
          $group: {
            _id: null,
            totalQuestions: { $sum: 1 },
            totalCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          },
        },
      ]),

      // Step 2: distinct match count
      this.answerModel.distinct('matchId', {
        matchId: { $in: matchIds },
        playerId: { $in: playerIds },
      }),

      // Step 3: per-subject breakdown (requires question lookup for subject name).
      // Use preserveNullAndEmptyArrays so unresolved questions don't vanish;
      // group them under a temporary "__unknown" bucket which we strip at the end.
      this.answerModel.aggregate([
        { $match: { matchId: { $in: matchIds }, playerId: { $in: playerIds } } },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        {
          $unwind: {
            path: '$question',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$question.subject', '__unknown'] },
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
                  $round: [{ $divide: ['$totalTime', '$totalQuestions'] }, 0],
                },
                0,
              ],
            },
            matchesPlayed: { $size: '$matchIds' },
          },
        },
        { $sort: { accuracy: -1 as const } },
      ]),
    ]);

    // Use the direct counts — not the subject aggregate — for global totals
    const totalQuestions = rawTotals[0]?.totalQuestions ?? 0;
    const totalCorrect = rawTotals[0]?.totalCorrect ?? 0;

    // Strip the __unknown bucket from the public list
    const validStats = subjectStats.filter((s) => s.subject !== '__unknown');
    const best = validStats.length > 0 ? validStats[0] : null;
    const weakest = validStats.length > 1 ? validStats[validStats.length - 1] : null;

    return {
      childId,
      displayName: (child as any)?.displayName || '',
      totalMatches: childMatchIds.length,
      totalQuestions,
      overallAccuracy:
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0,
      subjectStats: validStats.map((s) => ({
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
    if (!Types.ObjectId.isValid(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    // Step 1: all matches owned by this parent + child's display name for fuzzy matching
    const [parentMatches, childDoc] = await Promise.all([
      this.matchModel
        .find({ hostParentId: new Types.ObjectId(parentId) })
        .select('_id subject difficulty gameMode maxRounds winner createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      this.childModel.findById(childId).select('displayName').lean(),
    ]);

    if (parentMatches.length === 0) return [];

    const parentMatchIds = parentMatches.map((m) => m._id);

    // Match by both the child's MongoDB ID AND their display name — catches games
    // where the parent typed the name instead of selecting the child chip.
    const playerIds: string[] = [childId];
    if (childDoc?.displayName) playerIds.push(childDoc.displayName);

    // Step 2: find matches where the child actually has recorded answers
    const [childMatchIdDocs, answerStats] = await Promise.all([
      this.answerModel.distinct('matchId', {
        matchId: { $in: parentMatchIds },
        playerId: { $in: playerIds },
      }),
      this.answerModel.aggregate([
        {
          $match: {
            matchId: { $in: parentMatchIds },
            playerId: { $in: playerIds },
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
      ]),
    ]);

    if (childMatchIdDocs.length === 0) return [];

    const childMatchIdSet = new Set(
      childMatchIdDocs.map((id) => id.toString()),
    );

    const statsMap = new Map(
      answerStats.map((s) => [s._id.toString(), s]),
    );

    // Step 3: filter + map, preserving createdAt desc order from the initial sort
    return parentMatches
      .filter((m) => childMatchIdSet.has(m._id.toString()))
      .map((m) => {
        const stats = statsMap.get(m._id.toString());
        const correctAnswers = stats?.correctAnswers ?? 0;
        const totalQuestions = stats?.totalQuestions ?? (m as any).maxRounds;
        const accuracy =
          totalQuestions > 0
            ? Math.round((correctAnswers / totalQuestions) * 100)
            : 0;
        return {
          matchId: m._id.toString(),
          subject: (m as any).subject,
          difficulty: (m as any).difficulty,
          gameMode: (m as any).gameMode,
          date: (m as any).createdAt?.toISOString() || '',
          correctAnswers,
          totalQuestions,
          accuracy,
          winner: (m as any).winner,
          childTeamSide: stats?.teamSide ?? null,
          didWin:
            !!(m as any).winner && (m as any).winner === stats?.teamSide,
        };
      });
  }

  async getSoloCorrection(matchId: string) {
    if (!Types.ObjectId.isValid(matchId)) {
      throw new BadRequestException('Invalid match ID');
    }

    const match = await this.matchModel.findById(matchId).populate('questions');
    if (!match) throw new NotFoundException('Match not found');

    const questions = match.questions as any[];
    if (questions.length === 0) return [];

    const answers = await this.answerModel
      .find({ matchId: new Types.ObjectId(matchId), playerId: 'mock-player' })
      .sort({ round: 1 });

    const answerByQuestionId = new Map(
      answers.map((a) => [a.questionId.toString(), a]),
    );

    return questions.map((q: any) => {
      const answer = answerByQuestionId.get(q._id.toString());
      return {
        questionText: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        userAnswerIndex: answer?.answerIndex ?? -1,
        isCorrect: answer?.isCorrect ?? false,
      };
    });
  }

  async getMatchAnswerReview(matchId: string, childId: string) {
    if (!Types.ObjectId.isValid(matchId)) {
      throw new BadRequestException('Invalid match ID');
    }

    const match = await this.matchModel.findById(matchId).populate('questions');
    if (!match) throw new NotFoundException('Match not found');

    const questions = match.questions as any[];
    if (questions.length === 0) return [];

    // Fetch recorded answers for this player (may be empty — that's fine)
    const answers = await this.answerModel
      .find({ matchId: new Types.ObjectId(matchId), playerId: childId })
      .sort({ round: 1 });

    // Index answers by questionId for O(1) lookup
    const answerByQuestionId = new Map(
      answers.map((a) => [a.questionId.toString(), a]),
    );

    // Merge: every question gets returned, enriched with answer data if available
    return questions.map((q: any) => {
      const answer = answerByQuestionId.get(q._id.toString());
      return {
        questionText: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        childAnswerIndex: answer?.answerIndex ?? -1,
        isCorrect: answer?.isCorrect ?? false,
        responseTime: answer?.responseTime ?? 0,
      };
    });
  }
}
