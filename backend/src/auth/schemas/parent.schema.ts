import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
    },
  },
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
    },
  },
})
export class Parent extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ default: '' })
  firebaseUid: string;

  @Prop({ type: [Types.ObjectId], ref: 'Child', default: [] })
  children: Types.ObjectId[];

  @Prop({ default: 'none', enum: ['none', 'active', 'cancelled', 'expired', 'past_due'] })
  subscriptionStatus: string;

  @Prop({ type: Date })
  subscriptionExpiresAt: Date;
}

export const ParentSchema = SchemaFactory.createForClass(Parent);
