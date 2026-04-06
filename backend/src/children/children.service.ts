import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Child } from './schemas/child.schema';
import { DeviceSession } from './schemas/device-session.schema';
import { GuestLink } from './schemas/guest-link.schema';
import { MatchService } from '../match/match.service';
import { HomeworkService } from '../homework/homework.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationAiService } from './notification-ai.service';

@Injectable()
export class ChildrenService {
  private readonly logger = new Logger(ChildrenService.name);

  constructor(
    @InjectModel(Child.name) private childModel: Model<Child>,
    @InjectModel(DeviceSession.name)
    private sessionModel: Model<DeviceSession>,
    @InjectModel(GuestLink.name)
    private guestLinkModel: Model<GuestLink>,
    @Inject(forwardRef(() => MatchService))
    private matchService: MatchService,
    @Inject(forwardRef(() => HomeworkService))
    private homeworkService: HomeworkService,
    private realtimeGateway: RealtimeGateway,
    private notificationAiService: NotificationAiService,
  ) {}

  async createChild(
    parentId: string,
    data: { displayName: string; grade: string; avatarUrl?: string },
  ): Promise<Child> {
    const child = await this.childModel.create({
      ...data,
      parentId: new Types.ObjectId(parentId),
    });
    this.logger.log(`Child created: ${child.displayName}`);
    return child;
  }

  async getChildrenByParent(parentId: string): Promise<Child[]> {
    return this.childModel.find({ parentId: new Types.ObjectId(parentId) });
  }

  async getChildById(id: string): Promise<Child | null> {
    return this.childModel.findById(id);
  }

  async deleteChild(parentId: string, childId: string): Promise<Child | null> {
    const oid = new Types.ObjectId(childId);
    const poid = new Types.ObjectId(parentId);

    const child = await this.childModel.findOneAndDelete({
      _id: oid,
      parentId: poid,
    });

    if (child) {
      this.logger.log(`Child deleted: ${child.displayName}. Starting data erasure...`);

      // 1. Erase matches and answers
      await this.matchService.deleteAllByChild(childId);

      // 2. Erase homework and chats
      await this.homeworkService.deleteAllByChild(childId);

      // 3. Delete guest links
      await this.guestLinkModel.deleteMany({ childId: oid });

      // 4. Handle active sessions/logout
      const activeSessions = await this.sessionModel.find({
        childId: oid,
        isActive: true,
      });

      for (const session of activeSessions) {
        // Emit real-time "logout" event to the kid's device
        this.realtimeGateway.emitChildDeleted(session.sessionToken, childId);

        // Deactivate the session
        session.isActive = false;
        await session.save();
      }

      this.logger.log(`Child ${childId} cleanup complete.`);
    }

    return child;
  }

  async createQRSession(parentId: string): Promise<DeviceSession> {
    const sessionToken = uuidv4().slice(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const session = await this.sessionModel.create({
      parentId: new Types.ObjectId(parentId),
      sessionToken,
      qrData: JSON.stringify({ token: sessionToken, parentId }),
      expiresAt,
    });

    this.logger.log(`QR session created: ${sessionToken}`);
    return session;
  }

  async linkChildToSession(
    sessionToken: string,
    childId: string,
  ): Promise<DeviceSession | null> {
    const session = await this.sessionModel.findOneAndUpdate(
      { sessionToken, isActive: true, expiresAt: { $gt: new Date() } },
      { childId: new Types.ObjectId(childId) },
      { new: true },
    );
    if (session) {
      this.logger.log(`Child ${childId} linked to session ${sessionToken}`);
    }
    return session;
  }

  async validateSession(sessionToken: string): Promise<DeviceSession | null> {
    return this.sessionModel.findOne({
      sessionToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  async createUnauthenticatedSession(): Promise<DeviceSession> {
    const sessionToken = uuidv4().slice(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const session = await this.sessionModel.create({
      sessionToken,
      qrData: JSON.stringify({ token: sessionToken }),
      expiresAt,
    });

    this.logger.log(`Unauthenticated session created: ${sessionToken}`);
    return session;
  }

  async authorizeSession(
    sessionToken: string,
    parentId: string,
    childId?: string,
  ): Promise<DeviceSession | null> {
    const updateData: any = { parentId: new Types.ObjectId(parentId) };
    if (childId) {
      updateData.childId = new Types.ObjectId(childId);
    }

    const session = await this.sessionModel.findOneAndUpdate(
      {
        sessionToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
        parentId: null,
      },
      updateData,
      { new: true },
    );

    if (session) {
      this.logger.log(
        `Session ${sessionToken} authorized by parent ${parentId}${childId ? ` with child ${childId}` : ''}`,
      );
    }
    return session;
  }

  async getSessionStatus(
    sessionToken: string,
  ): Promise<{ authorized: boolean; parentId?: string; childId?: string }> {
    const session = await this.sessionModel.findOne({
      sessionToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return { authorized: false };
    }

    return {
      authorized: !!session.parentId,
      ...(session.parentId && { parentId: session.parentId.toString() }),
      ...(session.childId && { childId: session.childId.toString() }),
    };
  }

  // ─── Guest link codes ───────────────────────────────────────────────────────

  /**
   * Parent generates a short code that a guest kid can enter to link their
   * local guest profile to an existing child account.
   */
  async generateGuestLinkCode(
    parentId: string,
    childId: string,
  ): Promise<{ code: string; expiresAt: Date }> {
    // Invalidate any prior unused code for this child
    await this.guestLinkModel.deleteMany({
      childId: new Types.ObjectId(childId),
      used: false,
    });

    const child = await this.childModel.findById(childId);
    const prefix = child ? child.displayName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() : 'KID';
    const randomPart = Math.floor(100 + Math.random() * 899).toString();
    const code = `${prefix}${randomPart}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.guestLinkModel.create({
      code,
      parentId: new Types.ObjectId(parentId),
      childId: new Types.ObjectId(childId),
      expiresAt,
    });

    this.logger.log(
      `Guest link code ${code} generated for child ${childId} (${child?.displayName})`,
    );
    return { code, expiresAt };
  }

  /**
   * Validates a guest link code and marks it as used.
   * Returns the resolved parentId and childId on success.
   */
  async validateAndConsumeGuestCode(
    code: string,
  ): Promise<{ parentId: string; childId: string } | null> {
    const link = await this.guestLinkModel.findOneAndUpdate(
      {
        code: code.toUpperCase(),
        used: false,
        expiresAt: { $gt: new Date() },
      },
      { used: true },
      { new: true },
    );

    if (!link) return null;

    this.logger.log(
      `Guest link code ${code} consumed — child ${link.childId}`,
    );

    return {
      parentId: link.parentId.toString(),
      childId: link.childId.toString(),
    };
  }

  /**
   * Returns child profile info for a given link code.
   * Does not mark the code as used.
   */
  async getLinkInfo(code: string) {
    const link = await this.guestLinkModel.findOne({
      code: code.toUpperCase(),
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!link) return null;

    const child = await this.childModel.findById(link.childId);
    if (!child) return null;

    return {
      displayName: child.displayName,
      avatarUrl: child.avatarUrl,
      parentId: link.parentId.toString(),
      childId: link.childId.toString(),
    };
  }

  async updateLastActive(childId: string): Promise<void> {
    if (!Types.ObjectId.isValid(childId)) return;
    await this.childModel.findByIdAndUpdate(childId, {
      lastActiveAt: new Date(),
    });
  }

  async getInactivityMessage(childId: string): Promise<string> {
    const child = await this.childModel.findById(childId);
    if (!child) return 'We miss you! Come back and play! 🚀';

    // Fetch performance stats for personalization
    let stats: any = undefined;
    try {
      stats = await this.matchService.getChildPerformance(
        child.parentId.toString(),
        childId,
      );
    } catch (e) {
      this.logger.warn(`Failed to fetch stats for child ${childId}: ${e.message}`);
    }

    return this.notificationAiService.generateInactivityMessage(
      child.displayName,
      child.grade,
      stats,
    );
  }
}
