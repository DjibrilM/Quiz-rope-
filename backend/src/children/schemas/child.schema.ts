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
export class Child extends Document {
  @Prop({ required: true })
  displayName: string;

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parentId: Types.ObjectId;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '3rd' })
  grade: string;

  @Prop({ default: Date.now })
  lastActiveAt: Date;
}

export const ChildSchema = SchemaFactory.createForClass(Child);
