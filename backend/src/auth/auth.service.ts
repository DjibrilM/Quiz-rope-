import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { Parent } from './schemas/parent.schema';
import { Child } from '../children/schemas/child.schema';
import { isFirebaseConfigured } from '../config/firebase.config';

import { EmailService } from '../email/email.service';
import { Match } from '../match/schemas/match.schema';
import { Answer } from '../match/schemas/answer.schema';
import { HomeworkSession } from '../homework/schemas/homework-session.schema';
import { HomeworkChat } from '../homework/schemas/homework-chat.schema';
import { Question } from '../question/schemas/question.schema';

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
    @InjectModel('Child') private childModel: Model<Child>,
    @InjectModel(Match.name) private matchModel: Model<Match>,

    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(HomeworkSession.name) private homeworkModel: Model<HomeworkSession>,
    @InjectModel(HomeworkChat.name) private chatModel: Model<HomeworkChat>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    private readonly emailService: EmailService,
  ) {}

  signToken(payload: {
    sub: string;
    role: 'parent' | 'child' | 'ghost';
    email?: string;
    parentId?: string;
    childId?: string;
    guestId?: string;
  }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }

  async validateFirebaseToken(token: string): Promise<any> {
    if (!isFirebaseConfigured) {
      this.logger.error('Firebase is not configured! Refusing to authenticate.');
      throw new BadRequestException('Authentication disabled: Firebase is not configured.');
    }

    try {
      const admin = require('firebase-admin');
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      this.logger.error('Token validation failed:', error.message);
      throw error;
    }
  }

  async findOrCreateParent(userData: {
    email: string;
    displayName: string;
    firebaseUid?: string;
  }): Promise<Parent> {
    let parent = await this.parentModel.findOne({
      $or: [
        { email: userData.email },
        ...(userData.firebaseUid
          ? [{ firebaseUid: userData.firebaseUid }]
          : []),
      ],
    });

    if (!parent) {
      parent = await this.parentModel.create({
        email: userData.email,
        displayName: userData.displayName,
        firebaseUid: userData.firebaseUid || '',
      });
      this.logger.log(`Created new parent: ${parent.email}`);
    }

    return parent;
  }

  async getParentById(id: string): Promise<Parent | null> {
    return this.parentModel.findById(id);
  }

  async getChildById(id: string): Promise<Child | null> {
    return this.childModel.findById(id);
  }


  isFirebaseReady(): boolean {
    return isFirebaseConfigured;
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    if (isFirebaseConfigured) {
      // Admin SDK available: generate link and send branded email via Nodemailer
      const admin = require('firebase-admin');
      let resetLink: string;
      try {
        resetLink = await admin.auth().generatePasswordResetLink(email);
      } catch (error: any) {
        const code = error?.errorInfo?.code ?? error?.code ?? '';
        if (code === 'auth/user-not-found') {
          throw new BadRequestException('User not found');
        }
        throw new BadRequestException(error?.message ?? 'Failed to generate reset link');
      }
      await this.emailService.sendPasswordReset(email, resetLink);
    } else {
      // No Admin SDK: fall back to Firebase Web REST API — Firebase sends its own email
      const apiKey = process.env.FIREBASE_WEB_API_KEY;
      if (!apiKey) {
        this.logger.warn('Neither Firebase Admin nor FIREBASE_WEB_API_KEY configured');
        throw new BadRequestException('Password reset is not configured');
      }
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
        },
      );
      if (!response.ok) {
        const body = await response.json() as any;
        const msg = body?.error?.message ?? 'Failed to send reset email';
        if (msg === 'EMAIL_NOT_FOUND') throw new BadRequestException('User not found');
        throw new BadRequestException(msg);
      }
    }

    this.logger.log(`Password reset email sent to ${email}`);
  }

  /**
   * Migrates all ghost data (answers, matches, homework) to a real child account.
   * Called after a ghost user redeems a parent-generated link code.
   */
  async migrateGuestData(
    guestId: string,
    parentId: string,
    childId: string,
  ): Promise<{ answersMigrated: number; matchesMigrated: number; homeworkMigrated: number }> {
    const parentOid = new Types.ObjectId(parentId);
    const [answersResult, matchesResult, homeworkResult] = await Promise.all([
      this.answerModel.updateMany({ playerId: guestId }, { playerId: childId }),
      this.matchModel.updateMany(
        { guestOwnerId: guestId },
        { hostParentId: parentOid, $unset: { guestOwnerId: 1 } },
      ),
      this.homeworkModel.updateMany(
        { guestId },
        {
          parentId: parentOid,
          childId: new Types.ObjectId(childId),
          $unset: { guestId: 1 },
        },
      ),
    ]);

    this.logger.log(
      `Ghost migration: guestId=${guestId} → childId=${childId} | ` +
        `answers=${answersResult.modifiedCount}, matches=${matchesResult.modifiedCount}, ` +
        `homework=${homeworkResult.modifiedCount}`,
    );

    return {
      answersMigrated: answersResult.modifiedCount,
      matchesMigrated: matchesResult.modifiedCount,
      homeworkMigrated: homeworkResult.modifiedCount,
    };
  }

  /**
   * Migrates SQLite-stored local guest data to MongoDB after the guest links to a child account.
   */
  async migrateLocalData(
    parentId: string,
    childId: string,
    payload: {
      matches: { localId: string; subject: string; difficulty: string; gameMode: string; maxRounds: number; status: string; winner?: string; roundsPlayed: number; createdAt: number }[];
      questions: { localId: string; matchLocalId: string; text: string; options: string[]; correctIndex: number; subject: string; difficulty: string; explanation: string }[];
      answers: { matchLocalId: string; questionLocalId?: string; playerId: string; teamSide: string; answerIndex: number; isCorrect: boolean; responseTime: number; round: number; createdAt: number }[];
      homeworkSessions: {
        localId: string;
        title?: string;
        subject?: string;
        status: string;
        topics: string[];
        answersMarkdown?: string;
        imageBase64?: string;
        imageMimeType?: string;
        linkedMatchIds?: string[];
        createdAt: number;
      }[];
      chats: { sessionLocalId: string; role: string; content: string; createdAt: number }[];
    },
  ): Promise<{ matchesMigrated: number; homeworkMigrated: number; answersMigrated: number }> {
    const parentOid = new Types.ObjectId(parentId);
    const childOid = new Types.ObjectId(childId);

    // localId → MongoDB ObjectId mapping
    const matchIdMap = new Map<string, Types.ObjectId>();
    const questionIdMap = new Map<string, Types.ObjectId>();
    const sessionIdMap = new Map<string, Types.ObjectId>();

    // 1. Create Question documents
    for (const q of payload.questions) {
      const doc = await this.questionModel.create({
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        subject: q.subject,
        difficulty: q.difficulty,
        explanation: q.explanation || '',
        generatedBy: 'migrated-guest',
      });
      questionIdMap.set(q.localId, doc._id as Types.ObjectId);
    }

    // 2. Create Match documents
    for (const m of payload.matches) {
      const matchQuestions = payload.questions
        .filter((q) => q.matchLocalId === m.localId)
        .map((q) => questionIdMap.get(q.localId))
        .filter(Boolean);

      const doc = await this.matchModel.create({
        hostParentId: parentOid,
        childIds: [childOid],
        subject: m.subject,
        difficulty: m.difficulty,
        gameMode: m.gameMode,
        maxRounds: m.maxRounds,
        status: m.status,
        winner: m.winner,
        rounds: m.roundsPlayed,
        teams: [
          { name: 'Red Team', color: '#EF4444', side: 'LEFT', players: [] },
          { name: 'Blue Team', color: '#3B82F6', side: 'RIGHT', players: [] },
        ],
        questions: matchQuestions,
        createdAt: new Date(m.createdAt),
      });
      matchIdMap.set(m.localId, doc._id as Types.ObjectId);
    }

    // 3. Create Answer documents
    let answersMigrated = 0;
    for (const a of payload.answers) {
      const matchOid = matchIdMap.get(a.matchLocalId);
      if (!matchOid) continue;
      const questionOid = a.questionLocalId ? questionIdMap.get(a.questionLocalId) : undefined;
      await this.answerModel.create({
        matchId: matchOid,
        playerId: childId,
        teamSide: a.teamSide,
        answerIndex: a.answerIndex,
        isCorrect: a.isCorrect,
        responseTime: a.responseTime,
        round: a.round,
        ...(questionOid && { questionId: questionOid }),
        createdAt: new Date(a.createdAt),
      });
      answersMigrated++;
    }

    // 4. Create HomeworkSession documents
    for (const s of payload.homeworkSessions) {
      const linkedMatchOids = (s.linkedMatchIds || [])
        .map((lId) => matchIdMap.get(lId))
        .filter(Boolean) as Types.ObjectId[];

      const doc = await this.homeworkModel.create({
        parentId: parentOid,
        childId: childOid,
        title: s.title,
        subject: s.subject,
        status: s.status,
        topics: s.topics || [],
        answersMarkdown: s.answersMarkdown || '',
        imageBase64: s.imageBase64 || '',
        imageMimeType: s.imageMimeType || 'image/jpeg',
        linkedMatchIds: linkedMatchOids,
        linkedMatchId: linkedMatchOids.length > 0 ? linkedMatchOids[0] : undefined,
        createdAt: new Date(s.createdAt),
      });
      sessionIdMap.set(s.localId, doc._id as Types.ObjectId);
    }


    // 5. Create HomeworkChat documents
    for (const c of payload.chats) {
      const sessionOid = sessionIdMap.get(c.sessionLocalId);
      if (!sessionOid) continue;
      await this.chatModel.create({
        sessionId: sessionOid,
        role: c.role === 'model' ? 'ai' : 'user',
        content: c.content,
        createdAt: new Date(c.createdAt),
      });
    }

    this.logger.log(
      `Local migration: parentId=${parentId} childId=${childId} | ` +
      `matches=${matchIdMap.size}, homework=${sessionIdMap.size}, answers=${answersMigrated}`,
    );

    return {
      matchesMigrated: matchIdMap.size,
      homeworkMigrated: sessionIdMap.size,
      answersMigrated,
    };
  }
}
