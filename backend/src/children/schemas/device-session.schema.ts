import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DeviceSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Parent', default: null })
  parentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Child', default: null })
  childId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  sessionToken: string;

  @Prop({ required: true })
  qrData: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '' })
  deviceInfo: string;
}

export const DeviceSessionSchema =
  SchemaFactory.createForClass(DeviceSession);
