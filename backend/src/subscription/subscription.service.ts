import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import axios from 'axios';
import { Subscription } from './schemas/subscription.schema';
import { Parent } from '../auth/schemas/parent.schema';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly webhookHash: string;
  private readonly redirectUrl: string;
  private readonly planId: string;

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(Parent.name)
    private parentModel: Model<Parent>,
    private configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('flutterwave.secretKey') || '';
    this.publicKey = this.configService.get<string>('flutterwave.publicKey') || '';
    this.webhookHash = this.configService.get<string>('flutterwave.webhookHash') || '';
    this.redirectUrl = this.configService.get<string>('flutterwave.redirectUrl') || '';
    this.planId = this.configService.get<string>('flutterwave.planId') || '';
  }

  isFlutterwaveConfigured(): boolean {
    return !!this.secretKey;
  }

  async initializePayment(
    parentId: string,
    email: string,
    displayName: string,
  ): Promise<{ paymentLink: string; txRef: string }> {
    const txRef = `qr-sub-${parentId}-${Date.now()}`;

    if (!this.isFlutterwaveConfigured()) {
      this.logger.warn('Flutterwave not configured — using mock payment');
      const subscription = await this.subscriptionModel.create({
        parentId,
        flutterwaveRef: txRef,
        status: 'pending',
        amount: 4.8,
        currency: 'USD',
        paymentLink: `mock://payment?tx_ref=${txRef}`,
      });
      return { paymentLink: subscription.paymentLink, txRef };
    }

    try {
      const payload: any = {
        tx_ref: txRef,
        amount: 4.8,
        currency: 'USD',
        redirect_url: this.redirectUrl,
        customer: {
          email,
          name: displayName,
        },
        customizations: {
          title: 'QuizRope - Monthly Subscription',
          description: '$4.80/month subscription for full access',
        },
      };

      if (this.planId) {
        payload.payment_plan = this.planId;
      }

      const response = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const paymentLink = response.data.data.link;

      await this.subscriptionModel.create({
        parentId,
        flutterwaveRef: txRef,
        status: 'pending',
        amount: 4.8,
        currency: 'USD',
        planId: this.planId || undefined,
        paymentLink,
      });

      return { paymentLink, txRef };
    } catch (error) {
      this.logger.error('Flutterwave payment init failed:', error.message);
      throw error;
    }
  }

  async verifyPayment(
    transactionId: string,
    txRef: string,
  ): Promise<{ verified: boolean; subscription?: Subscription }> {
    if (!this.isFlutterwaveConfigured()) {
      this.logger.warn('Mock mode — auto-verifying payment');
      const subscription = await this.activateSubscription(txRef, 'mock-txn-' + Date.now(), 'mock-customer');
      return { verified: true, subscription };
    }

    try {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        },
      );

      const data = response.data.data;

      if (
        data.status === 'successful' &&
        data.amount >= 4.8 &&
        data.currency === 'USD'
      ) {
        const subscription = await this.activateSubscription(
          txRef,
          String(data.id),
          data.customer?.id ? String(data.customer.id) : undefined,
        );
        return { verified: true, subscription };
      }

      await this.subscriptionModel.findOneAndUpdate(
        { flutterwaveRef: txRef },
        { status: 'failed' },
      );
      return { verified: false };
    } catch (error) {
      this.logger.error('Payment verification failed:', error.message);
      throw error;
    }
  }

  private async activateSubscription(
    txRef: string,
    transactionId: string,
    customerId?: string,
  ): Promise<Subscription> {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await this.subscriptionModel.findOneAndUpdate(
      { flutterwaveRef: txRef },
      {
        status: 'active',
        flutterwaveTransactionId: transactionId,
        flutterwaveCustomerId: customerId || undefined,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      { new: true },
    );

    if (subscription) {
      await this.parentModel.findByIdAndUpdate(subscription.parentId, {
        subscriptionStatus: 'active',
        subscriptionExpiresAt: periodEnd,
      });
    }

    return subscription!;
  }

  async getSubscriptionStatus(parentId: string): Promise<{
    hasActiveSubscription: boolean;
    subscription?: Subscription;
    expiresAt?: Date;
  }> {
    const subscription = await this.subscriptionModel.findOne({
      parentId,
      status: 'active',
      currentPeriodEnd: { $gt: new Date() },
    }).sort({ currentPeriodEnd: -1 });

    if (subscription) {
      return {
        hasActiveSubscription: true,
        subscription,
        expiresAt: subscription.currentPeriodEnd,
      };
    }

    return { hasActiveSubscription: false };
  }

  async processWebhook(event: any): Promise<void> {
    const eventType = event.event || event['event.type'];

    if (eventType === 'charge.completed') {
      const data = event.data;
      const txRef = data.tx_ref;

      if (txRef && txRef.startsWith('qr-sub-')) {
        const existing = await this.subscriptionModel.findOne({
          flutterwaveRef: txRef,
        });

        if (existing && existing.status === 'active') {
          // Renewal — extend period
          const newEnd = new Date(
            existing.currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000,
          );
          existing.currentPeriodEnd = newEnd;
          existing.flutterwaveTransactionId = String(data.id);
          await existing.save();

          await this.parentModel.findByIdAndUpdate(existing.parentId, {
            subscriptionExpiresAt: newEnd,
          });
        } else {
          await this.activateSubscription(
            txRef,
            String(data.id),
            data.customer?.id ? String(data.customer.id) : undefined,
          );
        }
      }
    } else if (eventType === 'subscription.cancelled') {
      const data = event.data;
      const customerId = data.customer?.id
        ? String(data.customer.id)
        : undefined;

      if (customerId) {
        const subscription = await this.subscriptionModel.findOne({
          flutterwaveCustomerId: customerId,
          status: 'active',
        });

        if (subscription) {
          subscription.status = 'cancelled';
          subscription.cancelledAt = new Date();
          await subscription.save();

          await this.parentModel.findByIdAndUpdate(subscription.parentId, {
            subscriptionStatus: 'cancelled',
          });
        }
      }
    } else if (eventType === 'charge.failed') {
      const data = event.data;
      const txRef = data.tx_ref;

      if (txRef && txRef.startsWith('qr-sub-')) {
        await this.subscriptionModel.findOneAndUpdate(
          { flutterwaveRef: txRef },
          { status: 'failed' },
        );

        const subscription = await this.subscriptionModel.findOne({
          flutterwaveRef: txRef,
        });

        if (subscription) {
          await this.parentModel.findByIdAndUpdate(subscription.parentId, {
            subscriptionStatus: 'past_due',
          });
        }
      }
    }
  }

  async cancelSubscription(parentId: string): Promise<{ cancelled: boolean }> {
    const subscription = await this.subscriptionModel.findOne({
      parentId,
      status: 'active',
    });

    if (!subscription) {
      return { cancelled: false };
    }

    if (
      this.isFlutterwaveConfigured() &&
      subscription.flutterwaveCustomerId
    ) {
      try {
        await axios.put(
          `https://api.flutterwave.com/v3/subscriptions/${subscription.flutterwaveCustomerId}/cancel`,
          {},
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          },
        );
      } catch (error) {
        this.logger.error('Flutterwave cancel failed:', error.message);
      }
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    await this.parentModel.findByIdAndUpdate(parentId, {
      subscriptionStatus: 'cancelled',
    });

    return { cancelled: true };
  }

  async mockActivate(parentId: string): Promise<Subscription> {
    const txRef = `qr-mock-${parentId}-${Date.now()}`;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await this.subscriptionModel.create({
      parentId,
      flutterwaveRef: txRef,
      flutterwaveTransactionId: 'mock-txn',
      status: 'active',
      amount: 4.8,
      currency: 'USD',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    await this.parentModel.findByIdAndUpdate(parentId, {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: periodEnd,
    });

    return subscription;
  }
}
