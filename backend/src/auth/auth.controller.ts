import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { FirebaseAuthGuard } from "./guards/firebase-auth.guard";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DeviceSession } from "../children/schemas/device-session.schema";
import { GuestLink } from "../children/schemas/guest-link.schema";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel("DeviceSession")
    private readonly sessionModel: Model<DeviceSession>,
    @InjectModel("GuestLink")
    private readonly guestLinkModel: Model<GuestLink>,
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
      throw new UnauthorizedException("Invalid or expired link code");
    }

    const parentId = link.parentId.toString();
    const childId = link.childId.toString();

    const token = this.authService.signToken({
      sub: childId,
      role: "child",
      parentId,
      childId,
    });

    return { token, parentId, childId };
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
}
