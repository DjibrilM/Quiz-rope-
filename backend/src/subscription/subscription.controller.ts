import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('subscription')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  @Post('initialize')
  @UseGuards(FirebaseAuthGuard)
  async initialize(@Req() req) {
    const parent = req.user;
    return this.subscriptionService.initializePayment(
      parent._id.toString(),
      parent.email,
      parent.displayName,
    );
  }

  @Post('verify')
  @UseGuards(FirebaseAuthGuard)
  async verify(@Body() body: { transactionId: string; txRef: string }) {
    return this.subscriptionService.verifyPayment(
      body.transactionId,
      body.txRef,
    );
  }

  @Get('status')
  @UseGuards(FirebaseAuthGuard)
  async status(@Req() req) {
    const parent = req.user;
    return this.subscriptionService.getSubscriptionStatus(
      parent._id.toString(),
    );
  }

  @Post('cancel')
  @UseGuards(FirebaseAuthGuard)
  async cancel(@Req() req) {
    const parent = req.user;
    return this.subscriptionService.cancelSubscription(
      parent._id.toString(),
    );
  }

  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers('verif-hash') verifHash: string,
  ) {
    const expectedHash =
      this.configService.get<string>('flutterwave.webhookHash') || '';

    if (expectedHash && verifHash !== expectedHash) {
      throw new ForbiddenException('Invalid webhook hash');
    }

    this.logger.log(`Webhook received: ${body.event || 'unknown'}`);
    await this.subscriptionService.processWebhook(body);
    return { status: 'ok' };
  }

  @Post('mock-activate')
  @UseGuards(FirebaseAuthGuard)
  async mockActivate(@Req() req) {
    const parent = req.user;
    const subscription = await this.subscriptionService.mockActivate(
      parent._id.toString(),
    );
    return { activated: true, subscription };
  }
}
