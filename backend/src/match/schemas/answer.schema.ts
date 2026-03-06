import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Answer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true })
  matchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ required: true })
  playerId: string;

  @Prop({ required: true, enum: ['LEFT', 'RIGHT'] })
  teamSide: string;

  @Prop({ required: true, min: 0, max: 3 })
  answerIndex: number;

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ default: 0 })
  responseTime: number;

  @Prop({ default: 0 })
  round: number;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
