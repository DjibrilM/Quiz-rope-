import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class HomeworkSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parentId: Types.ObjectId;

  @Prop()
  imageBase64: string;

  @Prop({ default: 'image/jpeg' })
  imageMimeType: string;

  @Prop()
  title: string;

  @Prop()
  subject: string;

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop()
  answersMarkdown: string;

  @Prop({
    type: String,
    enum: ['PROCESSING', 'READY', 'FAILED'],
    default: 'PROCESSING',
  })
  status: 'PROCESSING' | 'READY' | 'FAILED';

  @Prop()
  errorMessage: string;

  @Prop({ type: Types.ObjectId, ref: 'Match' })
  linkedMatchId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Match' }], default: [] })
  linkedMatchIds: Types.ObjectId[];

  @Prop({ default: false })
  quizTaken: boolean;
}

export const HomeworkSessionSchema =
  SchemaFactory.createForClass(HomeworkSession);
HomeworkSessionSchema.index({ parentId: 1, createdAt: -1 });
