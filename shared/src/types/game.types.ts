import { TeamSide } from './match.types';

export interface GameState {
  matchId: string;
  ropePosition: number;
  currentQuestion: {
    id: string;
    text: string;
    options: string[];
    subject: string;
  } | null;
  timeRemaining: number;
  teams: {
    name: string;
    players: string[];
    color: string;
    side: TeamSide;
    score: number;
  }[];
  status: string;
  round: number;
  maxRounds: number;
}

export interface PlayerAnswer {
  playerId: string;
  questionId: string;
  answerIndex: number;
  timestamp: number;
}

export interface RoundResult {
  questionId: string;
  correctIndex: number;
  teamAnswers: {
    teamSide: TeamSide;
    answers: { playerId: string; answerIndex: number; isCorrect: boolean }[];
  }[];
  ropeMovement: number;
  newRopePosition: number;
}

export interface GameEndResult {
  matchId: string;
  winnerTeamId: string;
  finalRopePosition: number;
  teamScores: { left: number; right: number };
  stats: PlayerStats[];
}

export interface PlayerStats {
  playerId: string;
  displayName: string;
  correctAnswers: number;
  totalAnswers: number;
  avgResponseTime: number;
}
