import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Question extends Document {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true, min: 0, max: 3 })
  correctIndex: number;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ required: true, default: '' })
  explanation: string;

  @Prop({ default: 'mock' })
  generatedBy: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
