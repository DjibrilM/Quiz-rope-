import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { Parent } from './schemas/parent.schema';
import { isFirebaseConfigured } from '../config/firebase.config';
import { EmailService } from '../email/email.service';
import { Match } from '../match/schemas/match.schema';
import { Answer } from '../match/schemas/answer.schema';
import { HomeworkSession } from '../homework/schemas/homework-session.schema';

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
    @InjectModel(Match.name) private matchModel: Model<Match>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(HomeworkSession.name) private homeworkModel: Model<HomeworkSession>,
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
      this.logger.warn('Firebase not configured — returning mock user');
      return this.getMockUser();
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

  getMockUser() {
    return {
      uid: 'mock-uid-001',
      email: 'parent@test.com',
      name: 'Test Parent',
    };
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
}
