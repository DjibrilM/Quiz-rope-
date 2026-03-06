export enum MatchStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type TeamSide = 'LEFT' | 'RIGHT';

export interface Team {
  id: string;
  name: string;
  players: string[];
  color: string;
  side: TeamSide;
}

export type RopePosition = number; // -5 to 5, 0 is center

export type GameMode = 'solo' | 'splitscreen';

export interface Match {
  id: string;
  hostParentId: string;
  subject: string;
  difficulty: string;
  gameMode: GameMode;
  teams: Team[];
  ropePosition: RopePosition;
  currentQuestionIndex: number;
  status: MatchStatus;
  rounds: number;
  maxRounds: number;
  winner?: string;
  createdAt: Date;
}
