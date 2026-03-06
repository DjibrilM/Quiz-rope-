import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { Parent } from './schemas/parent.schema';
import { isFirebaseConfigured, getFirebaseApp } from '../config/firebase.config';

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(@InjectModel(Parent.name) private parentModel: Model<Parent>) {}

  signToken(payload: {
    sub: string;
    role: 'parent' | 'child';
    email?: string;
    parentId?: string;
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
    if (!isFirebaseConfigured) {
      this.logger.warn(
        'Firebase not configured — password reset email simulated',
      );
      return;
    }

    try {
      const admin = require('firebase-admin');
      // Firebase Admin doesn't directly send reset emails,
      // but we can generate a password reset link
      const link = await admin.auth().generatePasswordResetLink(email);
      this.logger.log(`Password reset link generated for ${email}: ${link}`);
      // In production, send this link via your email service
    } catch (error) {
      this.logger.error('Password reset failed:', error.message);
      throw error;
    }
  }
}
