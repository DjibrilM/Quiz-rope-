import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { Parent } from './schemas/parent.schema';
import { isFirebaseConfigured } from '../config/firebase.config';

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
  ) {}

  signToken(payload: {
    sub: string;
    role: 'parent' | 'child';
    email?: string;
    parentId?: string;
    childId?: string;
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
    const apiKey = process.env.FIREBASE_WEB_API_KEY;

    if (!apiKey) {
      this.logger.warn('FIREBASE_WEB_API_KEY not set — password reset unavailable');
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
      if (msg === 'EMAIL_NOT_FOUND') {
        throw new BadRequestException('User not found');
      }
      throw new BadRequestException(msg);
    }

    this.logger.log(`Password reset email sent to ${email}`);
  }
}
