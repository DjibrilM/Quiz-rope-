import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class TeamSubDoc {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: 'Child', default: [] })
  players: Types.ObjectId[];

  @Prop({ required: true })
  color: string;

  @Prop({ required: true, enum: ['LEFT', 'RIGHT'] })
  side: string;
}

@Schema({ timestamps: true })
export class Match extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  hostParentId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ type: [TeamSubDoc], default: [] })
  teams: TeamSubDoc[];

  @Prop({ default: 0, min: -5, max: 5 })
  ropePosition: number;

  @Prop({ default: 'splitscreen', enum: ['solo', 'splitscreen'] })
  gameMode: string;

  @Prop({ default: 0 })
  currentQuestionIndex: number;

  @Prop({ type: [Types.ObjectId], ref: 'Question', default: [] })
  questions: Types.ObjectId[];

  @Prop({
    default: 'WAITING',
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  })
  status: string;

  @Prop({ default: 0 })
  rounds: number;

  @Prop({ default: 10 })
  maxRounds: number;

  @Prop({ default: 0 })
  teamScoreLeft: number;

  @Prop({ default: 0 })
  teamScoreRight: number;

  @Prop({ default: '' })
  winner: string;

  @Prop({ type: [Types.ObjectId], ref: 'Child', default: [] })
  childIds: Types.ObjectId[];
}

export const MatchSchema = SchemaFactory.createForClass(Match);
