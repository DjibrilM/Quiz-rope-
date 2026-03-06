import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Child } from './schemas/child.schema';
import { DeviceSession } from './schemas/device-session.schema';

@Injectable()
export class ChildrenService {
  private readonly logger = new Logger(ChildrenService.name);

  constructor(
    @InjectModel(Child.name) private childModel: Model<Child>,
    @InjectModel(DeviceSession.name)
    private sessionModel: Model<DeviceSession>,
  ) {}

  async createChild(
    parentId: string,
    data: { displayName: string; age: number; grade: string },
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
    const child = await this.childModel.findOneAndDelete({
      _id: new Types.ObjectId(childId),
      parentId: new Types.ObjectId(parentId),
    });
    if (child) {
      this.logger.log(`Child deleted: ${child.displayName}`);
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
}
