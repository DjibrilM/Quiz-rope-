import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import { Parent } from './schemas/parent.schema';
import { Otp } from './schemas/otp.schema';
import { isFirebaseConfigured, getFirebaseApp } from '../config/firebase.config';

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

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

  async sendOtp(email: string): Promise<void> {
    // Verify user exists in Firebase
    if (isFirebaseConfigured) {
      try {
        const admin = require('firebase-admin');
        await admin.auth().getUserByEmail(email);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          throw new BadRequestException('User not found');
        }
        throw error;
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert: replace any existing OTP for this email
    await this.otpModel.findOneAndUpdate(
      { email },
      { email, code, createdAt: new Date() },
      { upsert: true },
    );

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your Password Reset Code - QuizRope',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #6C3FC5;">QuizRope Password Reset</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6C3FC5; padding: 16px; background: #F3F0FF; border-radius: 8px; text-align: center; margin: 16px 0;">
            ${code}
          </div>
          <p>This code expires in <strong>5 minutes</strong>.</p>
          <p style="color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    this.logger.log(`OTP sent to ${email}`);
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const otp = await this.otpModel.findOne({ email, code });
    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Delete OTP after successful verification
    await this.otpModel.deleteOne({ _id: otp._id });

    if (!isFirebaseConfigured) {
      this.logger.warn('Firebase not configured — password reset simulated');
      return;
    }

    try {
      const admin = require('firebase-admin');
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(user.uid, { password: newPassword });
      this.logger.log(`Password updated for ${email}`);
    } catch (error) {
      this.logger.error('Password update failed:', error.message);
      throw error;
    }
  }
}
