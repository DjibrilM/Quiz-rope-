import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true, index: true })
  parentId: Types.ObjectId;

  @Prop({ required: true })
  flutterwaveRef: string;

  @Prop()
  flutterwaveTransactionId: string;

  @Prop()
  flutterwaveCustomerId: string;

  @Prop({
    default: 'pending',
    enum: ['pending', 'active', 'cancelled', 'expired', 'failed'],
  })
  status: string;

  @Prop({ default: 4.8 })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  planId: string;

  @Prop({ type: Date })
  currentPeriodStart: Date;

  @Prop({ type: Date })
  currentPeriodEnd: Date;

  @Prop({ type: Date })
  cancelledAt: Date;

  @Prop()
  paymentLink: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
