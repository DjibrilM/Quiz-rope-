export interface HomeworkSession {
  _id: string;
  parentId: string;
  childId?: string;
  imageBase64?: string;
  imageMimeType?: string;
  title?: string;
  subject?: string;
  topics: string[];
  answersMarkdown?: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  errorMessage?: string;
  linkedMatchId?: string;
  linkedMatchIds?: string[];
  quizTaken: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
  createdAt?: string;
}
