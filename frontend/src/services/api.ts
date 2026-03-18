import axios, { AxiosInstance } from 'axios';
import type { Child, ParentUser } from '@shared/types/user.types';
import type { Match } from '@shared/types/match.types';
import type { GameEndResult, PlayerStats } from '@shared/types/game.types';
import type { ChildPerformance, ChildMatchSummary, AnswerDetail } from '@shared/types/analytics.types';

const API_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  gamesPlayed: number;
}

type LogoutCallback = () => void;
type ApiErrorInfo = { type: 'error' | 'warning'; title: string; message: string; duration?: number };
type ApiErrorCallback = (info: ApiErrorInfo) => void;

class ApiService {
  private client: AxiosInstance;
  private onUnauthorized: LogoutCallback | null = null;
  private onApiError: ApiErrorCallback | null = null;
  private ghostToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status: number | undefined = error.response?.status;
        const message: string =
          error.response?.data?.message ||
          error.message ||
          'Something went wrong';

        if (status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }

        if (this.onApiError) {
          const isNetworkError =
            !error.response ||
            error.code === 'ERR_NETWORK' ||
            error.code === 'ECONNABORTED';
          const isServerError = status !== undefined && status >= 500;

          if (isNetworkError) {
            this.onApiError({
              type: 'error',
              title: 'No Connection',
              message: 'Check your internet connection and try again.',
              duration: 5000,
            });
          } else if (isServerError) {
            this.onApiError({
              type: 'error',
              title: 'Server Error',
              message: 'Something went wrong on our end. Please try again.',
            });
          }
        }

        return Promise.reject(new Error(message));
      },
    );
  }

  setOnUnauthorized(callback: LogoutCallback) {
    this.onUnauthorized = callback;
  }

  setOnApiError(callback: ApiErrorCallback | null) {
    this.onApiError = callback;
  }

  setToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  clearToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  hasToken(): boolean {
    return !!this.client.defaults.headers.common['Authorization'];
  }

  private async request<T>(path: string, options: { method?: string; data?: Record<string, unknown> | unknown[]; timeout?: number } = {}): Promise<T> {
    const response = await this.client.request({
      url: path,
      method: options.method || 'GET',
      data: options.data,
      timeout: options.timeout,
    });
    return response.data;
  }

  // Auth
  async login(firebaseToken: string): Promise<{ token: string; user: ParentUser; mockMode?: boolean }> {
    return this.request('/auth/login', {
      method: 'POST',
      data: { token: firebaseToken },
    });
  }

  async refreshToken(): Promise<{ token: string; user: ParentUser }> {
    return this.request('/auth/refresh', { method: 'POST' });
  }

  async getAuthStatus(): Promise<{ firebaseConfigured: boolean; mockMode: boolean }> {
    return this.request('/auth/status');
  }

  async getMe(): Promise<ParentUser> {
    return this.request('/auth/me');
  }

  // Children
  async getChildren(): Promise<Child[]> {
    return this.request('/children');
  }

  async createChild(data: { displayName: string; age: number; grade: string; avatarUrl?: string }): Promise<Child & { _id: string }> {
    return this.request('/children', {
      method: 'POST',
      data: data as unknown as Record<string, unknown>,
    });
  }

  async deleteChild(id: string): Promise<{ success: boolean }> {
    return this.request(`/children/${id}`, { method: 'DELETE' });
  }

  async createQRSession(): Promise<{ sessionToken: string; qrData: string }> {
    return this.request('/children/qr-session', { method: 'POST' });
  }

  // Matches
  async createMatch(data: {
    subject: string;
    difficulty: string;
    maxRounds: number;
    gameMode?: string;
    context?: string;
    teams: { name: string; color: string; side: string; players?: string[] }[];
    childIds?: string[];
    language?: string;
  }): Promise<Match> {
    return this.request('/matches', {
      method: 'POST',
      data: data as unknown as Record<string, unknown>,
      timeout: 60000, // Gemini question generation can take up to ~30s
    });
  }

  async getMatches(): Promise<Match[]> {
    return this.request('/matches');
  }

  async getMatch(id: string): Promise<Match> {
    return this.request(`/matches/${id}`);
  }

  async submitAnswer(matchId: string, data: { playerId: string; teamSide: string; answerIndex: number; responseTime: number; questionId?: string; isCorrect?: boolean }): Promise<void> {
    return this.request(`/matches/${matchId}/answer`, {
      method: 'POST',
      data: data as unknown as Record<string, unknown>,
    });
  }

  async completeMatch(id: string, data: { winner: string; rounds: number }): Promise<Match> {
    return this.request(`/matches/${id}/complete`, {
      method: 'PATCH',
      data: data as unknown as Record<string, unknown>,
    });
  }

  async getMatchStats(id: string): Promise<PlayerStats[]> {
    return this.request(`/matches/${id}/stats`);
  }

  // Analytics
  async getChildStats(childId: string): Promise<ChildPerformance> {
    return this.request(`/matches/child/${childId}/stats`);
  }

  async getChildMatchHistory(childId: string): Promise<ChildMatchSummary[]> {
    return this.request(`/matches/child/${childId}/matches`);
  }

  async getMatchReview(matchId: string, childId: string): Promise<AnswerDetail[]> {
    return this.request(`/matches/${matchId}/review/${childId}`);
  }

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.request('/matches/leaderboard');
  }

  // Child sessions
  async createChildSession(): Promise<{ sessionToken: string; code: string }> {
    return this.request('/children/session', { method: 'POST' });
  }

  async getSessionStatus(token: string): Promise<{ status: string; authorized?: boolean; parentId?: string; childId?: string }> {
    return this.request(`/children/session/${token}/status`);
  }

  async authorizeChildSession(sessionToken: string, childId?: string): Promise<{ success: boolean }> {
    return this.request('/children/session/authorize', {
      method: 'POST',
      data: { sessionToken, ...(childId && { childId }) },
    });
  }

  async getChildToken(sessionToken: string): Promise<{ token: string; childId?: string }> {
    return this.request('/auth/child-token', {
      method: 'POST',
      data: { sessionToken },
    });
  }

  // Subscriptions
  async getSubscriptionStatus(): Promise<{ status: string; expiresAt?: string }> {
    return this.request('/subscription/status');
  }

  async initializeSubscription(): Promise<{ paymentLink: string; txRef: string }> {
    return this.request('/subscription/initialize', { method: 'POST' });
  }

  async verifySubscription(transactionId: string, txRef: string): Promise<{ status: string; verified?: boolean; subscription?: { currentPeriodEnd?: string } }> {
    return this.request('/subscription/verify', {
      method: 'POST',
      data: { transactionId, txRef },
    });
  }

  async cancelSubscription(): Promise<{ success: boolean }> {
    return this.request('/subscription/cancel', { method: 'POST' });
  }

  async mockActivateSubscription(): Promise<{ status: string; activated?: boolean; subscription?: { currentPeriodEnd?: string } }> {
    return this.request('/subscription/mock-activate', { method: 'POST' });
  }

  // Guest mode

  /** Parent generates a short code for a specific child to enter on their device. */
  async generateGuestLinkCode(childId: string): Promise<{ code: string; expiresAt: string }> {
    return this.request('/children/guest-link', {
      method: 'POST',
      data: { childId },
    });
  }

  /**
   * Guest kid enters the parent-generated code.
   * Returns a child JWT if valid, used to transition from guest → child.
   */
  async redeemGuestCode(code: string): Promise<{ token: string; parentId: string; childId: string }> {
    return this.request('/auth/guest-token', {
      method: 'POST',
      data: { code },
    });
  }

  /** Look up an active match by its 6-character lobby code. */
  async findMatchByCode(code: string): Promise<{
    found: boolean;
    matchId?: string;
    subject?: string;
    difficulty?: string;
    maxRounds?: number;
    status?: string;
  }> {
    return this.request(`/matches/join/${code.toUpperCase()}`);
  }

  // Homework Assist
  async analyzeHomework(imageBase64: string, mimeType = 'image/jpeg', childId?: string): Promise<any> {
    return this.request('/homework/analyze', {
      method: 'POST',
      data: { imageBase64, mimeType, ...(childId ? { childId } : {}) },
      timeout: 8000,
    });
  }

  async getHomeworkSession(id: string): Promise<any> {
    return this.request(`/homework/session/${id}`);
  }

  async getHomeworkChatHistory(sessionId: string): Promise<any[]> {
    return this.request(`/homework/session/${sessionId}/chat`);
  }

  async getHomeworkSessions(): Promise<any[]> {
    return this.request('/homework/sessions');
  }

  async linkHomeworkMatch(sessionId: string, matchId: string): Promise<void> {
    return this.request(`/homework/session/${sessionId}/link-match`, {
      method: 'POST',
      data: { matchId },
    });
  }

  async getSoloMatchCorrection(matchId: string): Promise<{ questionText: string; options: string[]; correctIndex: number; explanation: string; userAnswerIndex: number; isCorrect: boolean }[]> {
    return this.request(`/matches/${matchId}/solo-correction`);
  }

  getAuthToken(): string | null {
    const header = this.client.defaults.headers.common['Authorization'];
    return typeof header === 'string' ? header.replace('Bearer ', '') : null;
  }

  /** Store the ghost JWT for use with ghost-only endpoints. */
  setGhostToken(token: string | null) {
    this.ghostToken = token;
  }

  /** Register a ghost profile and get a ghost JWT. */
  async registerGhost(guestId: string, displayName: string): Promise<{ token: string }> {
    return this.request('/auth/ghost-token', {
      method: 'POST',
      data: { guestId, displayName },
    });
  }

  /**
   * Migrate all ghost data to the linked child account.
   * Must be called AFTER setToken(childJwt) so the child JWT is in the header.
   */
  async migrateGuestData(guestId: string): Promise<{ answersMigrated: number; matchesMigrated: number; homeworkMigrated: number }> {
    return this.request('/auth/ghost-migrate', {
      method: 'POST',
      data: { guestId },
    });
  }

  /** Create a match as a ghost user (uses ghost JWT). */
  async createGhostMatch(data: {
    subject: string;
    difficulty: string;
    maxRounds?: number;
    gameMode?: string;
    context?: string;
    language?: string;
  }): Promise<Match> {
    if (!this.ghostToken) throw new Error('Ghost token not set');
    const savedToken = this.client.defaults.headers.common['Authorization'];
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.ghostToken}`;
    try {
      return await this.request('/matches/ghost', {
        method: 'POST',
        data: data as unknown as Record<string, unknown>,
        timeout: 60000,
      });
    } finally {
      if (savedToken) {
        this.client.defaults.headers.common['Authorization'] = savedToken;
      } else {
        delete this.client.defaults.headers.common['Authorization'];
      }
    }
  }

  /** Analyze homework as a ghost user (uses ghost JWT). */
  async analyzeGhostHomework(imageBase64: string, mimeType = 'image/jpeg'): Promise<any> {
    if (!this.ghostToken) throw new Error('Ghost token not set');
    const savedToken = this.client.defaults.headers.common['Authorization'];
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.ghostToken}`;
    try {
      return await this.request('/homework/ghost-analyze', {
        method: 'POST',
        data: { imageBase64, mimeType },
        timeout: 8000,
      });
    } finally {
      if (savedToken) {
        this.client.defaults.headers.common['Authorization'] = savedToken;
      } else {
        delete this.client.defaults.headers.common['Authorization'];
      }
    }
  }

  /** List homework sessions for a ghost user (uses ghost JWT). */
  async getGhostHomeworkSessions(): Promise<any[]> {
    if (!this.ghostToken) return [];
    const savedToken = this.client.defaults.headers.common['Authorization'];
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.ghostToken}`;
    try {
      return await this.request('/homework/ghost-sessions');
    } finally {
      if (savedToken) {
        this.client.defaults.headers.common['Authorization'] = savedToken;
      } else {
        delete this.client.defaults.headers.common['Authorization'];
      }
    }
  }
}

export const apiService = new ApiService();
