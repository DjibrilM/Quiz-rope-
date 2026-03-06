export interface SubjectStats {
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  avgResponseTime: number;
  matchesPlayed: number;
}

export interface ChildPerformance {
  childId: string;
  displayName: string;
  totalMatches: number;
  totalQuestions: number;
  overallAccuracy: number;
  subjectStats: SubjectStats[];
  bestSubject: string | null;
  weakestSubject: string | null;
}

export interface ChildMatchSummary {
  matchId: string;
  subject: string;
  difficulty: string;
  date: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  winner: string;
  childTeamSide: string;
  didWin: boolean;
}

export interface AnswerDetail {
  questionText: string;
  options: string[];
  correctIndex: number;
  childAnswerIndex: number;
  isCorrect: boolean;
  responseTime: number;
  explanation: string;
}
