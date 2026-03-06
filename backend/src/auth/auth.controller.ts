import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceSession } from '../children/schemas/device-session.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel('DeviceSession')
    private readonly sessionModel: Model<DeviceSession>,
  ) {}

  @Post('login')
  async login(@Body() body: { token: string }) {
    const decoded = await this.authService.validateFirebaseToken(
      body.token || '',
    );
    const parent = await this.authService.findOrCreateParent({
      email: decoded.email,
      displayName: decoded.name || decoded.email,
      firebaseUid: decoded.uid,
    });

    const token = this.authService.signToken({
      sub: parent._id.toString(),
      role: 'parent',
      email: parent.email,
    });

    return {
      user: parent,
      token,
      mockMode: !this.authService.isFirebaseReady(),
    };
  }

  @Post('refresh')
  @UseGuards(FirebaseAuthGuard)
  async refresh(@Req() req) {
    const parent = req.user;
    if (!parent?._id) {
      throw new UnauthorizedException('Invalid session');
    }

    const token = this.authService.signToken({
      sub: parent._id.toString(),
      role: 'parent',
      email: parent.email,
    });

    return { user: parent, token };
  }

  @Post('child-token')
  async getChildToken(@Body() body: { sessionToken: string }) {
    const session = await this.sessionModel.findOne({
      sessionToken: body.sessionToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session || !session.parentId) {
      throw new UnauthorizedException('Session not authorized');
    }

    const childId = session.childId?.toString() || null;

    const token = this.authService.signToken({
      sub: body.sessionToken,
      role: 'child',
      parentId: session.parentId.toString(),
      ...(childId && { childId }),
    });

    return { token, parentId: session.parentId.toString(), childId };
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@Req() req) {
    return req.user;
  }

  @Get('status')
  getStatus() {
    return {
      firebaseConfigured: this.authService.isFirebaseReady(),
      mockMode: !this.authService.isFirebaseReady(),
    };
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    try {
      await this.authService.sendOtp(body.email);
      return { success: true, message: 'OTP sent to your email.' };
    } catch (error) {
      if (error?.message === 'User not found') {
        throw new BadRequestException('User not found');
      }
      throw error;
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; code: string; newPassword: string },
  ) {
    if (!body.email || !body.code || !body.newPassword) {
      throw new BadRequestException('Email, code, and new password are required');
    }

    if (body.newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    await this.authService.resetPassword(body.email, body.code, body.newPassword);
    return { success: true, message: 'Password has been reset successfully.' };
  }
}
