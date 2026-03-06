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

class ApiService {
  private client: AxiosInstance;
  private onUnauthorized: LogoutCallback | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
        const message =
          error.response?.data?.message ||
          error.message ||
          'Something went wrong';
        return Promise.reject(new Error(message));
      },
    );
  }

  setOnUnauthorized(callback: LogoutCallback) {
    this.onUnauthorized = callback;
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

  private async request<T>(path: string, options: { method?: string; data?: Record<string, unknown> | unknown[] } = {}): Promise<T> {
    const response = await this.client.request({
      url: path,
      method: options.method || 'GET',
      data: options.data,
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

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/password-reset', {
      method: 'POST',
      data: { email },
    });
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
    teams: { name: string; color: string; side: string; players?: string[] }[];
  }): Promise<Match> {
    return this.request('/matches', {
      method: 'POST',
      data: data as unknown as Record<string, unknown>,
    });
  }

  async getMatches(): Promise<Match[]> {
    return this.request('/matches');
  }

  async getMatch(id: string): Promise<Match> {
    return this.request(`/matches/${id}`);
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
}

export const apiService = new ApiService();
