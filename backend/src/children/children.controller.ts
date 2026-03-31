import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ChildrenService } from './children.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller('children')
export class ChildrenController {
  constructor(
    private readonly childrenService: ChildrenService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createChild(
    @Req() req,
    @Body() body: { displayName: string; grade: string; avatarUrl?: string },
  ) {
    if (req.user.role !== 'parent') throw new ForbiddenException('Parents only');
    return this.childrenService.createChild(req.user._id, body);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getChildren(@Req() req) {
    if (req.user.role !== 'parent') throw new ForbiddenException('Parents only');
    return this.childrenService.getChildrenByParent(req.user._id);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async deleteChild(@Req() req, @Param('id') id: string) {
    if (req.user.role !== 'parent') throw new ForbiddenException('Parents only');
    const child = await this.childrenService.deleteChild(req.user._id, id);
    if (!child) {
      throw new NotFoundException('Child not found');
    }
    return { success: true };
  }

  @Post('qr-session')
  @UseGuards(FirebaseAuthGuard)
  async createQRSession(@Req() req) {
    return this.childrenService.createQRSession(req.user._id);
  }

  @Post('link')
  async linkChild(@Body() body: { sessionToken: string; childId: string }) {
    return this.childrenService.linkChildToSession(
      body.sessionToken,
      body.childId,
    );
  }

  @Get('session/:token')
  async validateSession(@Param('token') token: string) {
    const session = await this.childrenService.validateSession(token);
    return { valid: !!session, session };
  }

  // --- Child-initiated session endpoints ---

  @Post('session')
  async createChildSession() {
    const session = await this.childrenService.createUnauthenticatedSession();
    return {
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    };
  }

  @Get('session/:token/status')
  async getSessionStatus(@Param('token') token: string) {
    return this.childrenService.getSessionStatus(token);
  }

  @Post('session/authorize')
  @UseGuards(FirebaseAuthGuard)
  async authorizeSession(
    @Req() req,
    @Body() body: { sessionToken: string; childId?: string },
  ) {
    if (req.user.role !== 'parent') throw new ForbiddenException('Parents only');
    const session = await this.childrenService.authorizeSession(
      body.sessionToken,
      req.user._id.toString(),
      body.childId,
    );

    if (!session) {
      throw new NotFoundException('Session not found or already authorized');
    }

    // Emit real-time event to the child's device
    this.realtimeGateway.emitSessionAuthorized(body.sessionToken, {
      parentId: req.user._id.toString(),
      childId: body.childId || null,
    });

    return { success: true, session };
  }

  // --- Guest link code endpoints ---

  /**
   * Parent calls this to generate a short code for a specific child.
   * The kid enters this code in the app to link their guest profile.
   */
  @Post('guest-link')
  @UseGuards(FirebaseAuthGuard)
  async generateGuestLinkCode(
    @Req() req,
    @Body() body: { childId: string },
  ) {
    if (req.user.role !== 'parent') throw new ForbiddenException('Parents only');
    if (!body.childId) {
      throw new NotFoundException('childId is required');
    }
    return this.childrenService.generateGuestLinkCode(
      req.user._id.toString(),
      body.childId,
    );
  }

  @Post(':id/active')
  @UseGuards(FirebaseAuthGuard)
  async updateActive(@Param('id') id: string) {
    return this.childrenService.updateLastActive(id);
  }

  @Get(':id/inactivity-message')
  @UseGuards(FirebaseAuthGuard)
  async getInactivityMessage(@Param('id') id: string) {
    const message = await this.childrenService.getInactivityMessage(id);
    return { message };
  }
}
