import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Otp extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ default: Date.now, expires: 300 }) // TTL: 5 minutes
  createdAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ email: 1 });
