import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ErrorLog extends Document {
  @Prop({ required: true })
  context: string; // e.g. "auth", "game", "homework"

  @Prop({ required: true })
  message: string;

  @Prop()
  stack?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  userId?: string;

  @Prop()
  deviceInfo?: string;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
