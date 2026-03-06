import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Child extends Document {
  @Prop({ required: true })
  displayName: string;

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parentId: Types.ObjectId;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: 8 })
  age: number;

  @Prop({ default: '3rd' })
  grade: string;
}

export const ChildSchema = SchemaFactory.createForClass(Child);
