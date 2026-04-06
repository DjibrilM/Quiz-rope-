import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
import { GuestLink } from '../children/schemas/guest-link.schema';
import { ChildrenService } from '../children/children.service';

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel('DeviceSession')
    private readonly sessionModel: Model<DeviceSession>,
    @InjectModel('GuestLink')
    private readonly guestLinkModel: Model<GuestLink>,
    private readonly childrenService: ChildrenService,
  ) {}

  @Post("login")
  async login(@Body() body: { token: string }) {
    const decoded = await this.authService.validateFirebaseToken(
      body.token || "",
    );

    if (this.authService.isFirebaseReady() && decoded.email_verified === false) {
      throw new UnauthorizedException("email_not_verified");
    }

    const parent = await this.authService.findOrCreateParent({
      email: decoded.email,
      displayName: decoded.name || decoded.email,
      firebaseUid: decoded.uid,
    });

    const token = this.authService.signToken({
      sub: parent._id.toString(),
      role: "parent",
      email: parent.email,
    });

    return {
      user: parent,
      token,
      mockMode: !this.authService.isFirebaseReady(),
    };
  }

  @Post("refresh")
  @UseGuards(FirebaseAuthGuard)
  async refresh(@Req() req) {
    const parent = req.user;
    if (!parent?._id) {
      throw new UnauthorizedException("Invalid session");
    }

    const token = this.authService.signToken({
      sub: parent._id.toString(),
      role: "parent",
      email: parent.email,
    });

    return { user: parent, token };
  }

  @Post("child-token")
  async getChildToken(@Body() body: { sessionToken: string }) {
    const session = await this.sessionModel.findOne({
      sessionToken: body.sessionToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session || !session.parentId) {
      throw new UnauthorizedException("Session not authorized");
    }

    const childId = session.childId?.toString() || null;

    const token = this.authService.signToken({
      sub: body.sessionToken,
      role: "child",
      parentId: session.parentId.toString(),
      ...(childId && { childId }),
    });

    return { token, parentId: session.parentId.toString(), childId };
  }

  /**
   * Guest kid enters a code the parent generated → receives a child JWT.
   * No authentication required — the code is the credential.
   */
  @Post("guest-token")
  async getGuestToken(@Body() body: { code: string }) {
    if (!body.code) {
      throw new BadRequestException("code is required");
    }

    const link = await this.guestLinkModel.findOneAndUpdate(
      {
        code: body.code.toUpperCase(),
        used: false,
        expiresAt: { $gt: new Date() },
      },
      { used: true },
      { new: true },
    );

    if (!link) {
      throw new BadRequestException("Invalid or expired link code");
    }

    const parentId = link.parentId.toString();
    const childId = link.childId.toString();

    const token = this.authService.signToken({
      sub: childId,
      role: "child",
      parentId,
      childId,
    });

    const child = await this.childrenService.getChildById(childId);

    return {
      token,
      parentId,
      childId,
      displayName: child?.displayName ?? "",
      avatarUrl: child?.avatarUrl ?? "",
    };
  }

  /**
   * Returns child profile info for a given link code without consuming it.
   */
  @Get('link-info/:code')
  async getLinkInfo(@Param('code') code: string) {
    if (!code) {
      throw new BadRequestException('code is required');
    }
    const info = await this.childrenService.getLinkInfo(code);
    if (!info) {
      throw new BadRequestException('Invalid or expired link code');
    }
    return info;
  }

  @Get("me")
  @UseGuards(FirebaseAuthGuard)
  async getMe(@Req() req) {
    return req.user;
  }

  @Get("status")
  getStatus() {
    return {
      firebaseConfigured: this.authService.isFirebaseReady(),
      mockMode: !this.authService.isFirebaseReady(),
    };
  }

  @Post("send-otp")
  async sendOtp(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException("Email is required");
    }
    await this.authService.sendPasswordResetEmail(body.email);
    return { success: true, message: "Password reset email sent." };
  }

  /**
   * Ghost (guest) device registers its local guestId and gets a ghost JWT.
   * No authentication required — used immediately after guest profile creation.
   */
  @Post("ghost-token")
  ghostToken(@Body() body: { guestId: string; displayName: string }) {
    if (!body.guestId) {
      throw new BadRequestException("guestId is required");
    }
    const token = this.authService.signToken({
      sub: body.guestId,
      role: "ghost" as any,
      guestId: body.guestId,
    } as any);
    return { token };
  }

  /**
   * After a ghost links to a child account, migrate all ghost data to the real child.
   * Requires the child JWT (obtained from guest-token) in the Authorization header.
   */
  @Post("ghost-migrate")
  async ghostMigrate(
    @Body() body: { guestId: string },
    @Req() req,
  ) {
    if (!body.guestId) {
      throw new BadRequestException("guestId is required");
    }

    const authHeader = req.headers.authorization as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Child token required");
    }

    let decoded: any;
    try {
      decoded = this.authService.verifyToken(authHeader.split("Bearer ")[1]);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    if (decoded.role !== "child" || !decoded.parentId || !decoded.childId) {
      throw new UnauthorizedException("Valid child token required");
    }

    const result = await this.authService.migrateGuestData(
      body.guestId,
      decoded.parentId,
      decoded.childId,
    );

    return result;
  }

  /**
   * Migrate local SQLite guest data to MongoDB after the guest links to a child account.
   * Requires the child JWT in the Authorization header.
   */
  @Post("migrate-local")
  async migrateLocal(
    @Body() body: {
      matches: any[];
      questions: any[];
      answers: any[];
      homeworkSessions: any[];
      chats: any[];
    },
    @Req() req,
  ) {
    const authHeader = req.headers.authorization as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Child token required");
    }

    let decoded: any;
    try {
      decoded = this.authService.verifyToken(authHeader.split("Bearer ")[1]);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    if (decoded.role !== "child" || !decoded.parentId || !decoded.childId) {
      throw new UnauthorizedException("Valid child token required");
    }

    return this.authService.migrateLocalData(decoded.parentId, decoded.childId, {
      matches: body.matches || [],
      questions: body.questions || [],
      answers: body.answers || [],
      homeworkSessions: body.homeworkSessions || [],
      chats: body.chats || [],
    });
  }
}
