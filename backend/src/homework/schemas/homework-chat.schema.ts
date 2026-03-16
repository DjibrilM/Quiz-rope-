import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class HomeworkChat extends Document {
  @Prop({ type: Types.ObjectId, ref: 'HomeworkSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ enum: ['user', 'ai'], required: true })
  role: 'user' | 'ai';

  @Prop({ required: true })
  content: string;
}

export const HomeworkChatSchema = SchemaFactory.createForClass(HomeworkChat);
HomeworkChatSchema.index({ sessionId: 1, createdAt: 1 });
