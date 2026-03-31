import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import type { ParentUser, Child } from '@shared/types/user.types';
import type { Match } from '@shared/types/match.types';
import type { GameEndResult } from '@shared/types/game.types';
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

interface StoreQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  subject: string;
  explanation?: string;
}

interface CorrectionItem {
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userAnswerIndex: number; // -1 = timeout/skipped
  isCorrect: boolean;
}

interface StoreRoundResult {
  isCorrect: boolean;
  correctIndex: number;
  ropeMovement: number;
  newRopePosition: number;
}

interface ChildSession {
  sessionToken: string;
  parentId: string;
  childId: string | null;
  jwtToken: string | null;
}

interface ChildProfile {
  displayName: string;
  avatarUrl: string;
  grade: string;
}

interface GuestProfile {
  /** Locally generated ID so we can reference the profile across sessions. */
  guestId: string;
  displayName: string;
  avatarId: string;
}

interface GameState {
  isAuthenticated: boolean;
  parentUser: ParentUser | null;
  authToken: string | null;
  isMockMode: boolean;
  userRole: 'parent' | 'child' | 'guest' | null;
  childSession: ChildSession | null;
  /** Persisted local guest profile — survives logouts and app restarts. */
  guestProfile: GuestProfile | null;
  /** Fresh profile for the currently logged-in child, fetched on startup. */
  childProfile: ChildProfile | null;
  /** JWT for ghost (guest) API access. Persisted alongside guestProfile. */
  ghostToken: string | null;
  currentMatch: Match | null;
  ropePosition: number;
  teamScores: { left: number; right: number };
  currentQuestion: StoreQuestion | null;
  timeRemaining: number;
  roundResult: StoreRoundResult | null;
  gameEndResult: GameEndResult | null;
  streak: number;
  bestStreak: number;
  lastMatchCorrection: CorrectionItem[];
  children: Child[];
  locale: SupportedLanguage;
  subscriptionStatus: 'none' | 'active' | 'cancelled' | 'expired' | 'past_due' | 'checking';
  subscriptionExpiresAt: string | null;
  _hasHydrated: boolean;

  incrementStreak: () => void;
  resetStreak: () => void;
  setAuth: (user: ParentUser & Record<string, unknown>, mockMode: boolean, token: string) => void;
  updateParentUser: (user: Partial<ParentUser>) => void;
  setChildProfile: (profile: ChildProfile | null) => void;
  setChildSession: (session: ChildSession) => void;
  /** Set the persistent guest profile and mark the user as authenticated. */
  setGuestProfile: (profile: GuestProfile) => void;
  /** Re-authenticate an existing guest profile without changing it. */
  loginAsGuest: () => void;
  /** Set the ghost JWT received from POST /auth/ghost-token. */
  setGhostToken: (token: string | null) => void;
  /** Clear guest identity entirely (used when the guest links to a real account). */
  clearGuestProfile: () => void;
  setLocale: (locale: SupportedLanguage) => void;
  setSubscriptionStatus: (status: GameState['subscriptionStatus'], expiresAt?: string | null) => void;
  logout: () => void;
  setCurrentMatch: (match: Match | null) => void;
  setRopePosition: (position: number) => void;
  setTeamScores: (scores: { left: number; right: number }) => void;
  updateTeamScore: (side: 'left' | 'right', points: number) => void;
  setCurrentQuestion: (question: StoreQuestion | null) => void;
  setTimeRemaining: (time: number) => void;
  setRoundResult: (result: StoreRoundResult | null) => void;
  setGameEndResult: (result: GameEndResult | null) => void;
  setChildren: (children: Child[]) => void;
  pushCorrection: (item: CorrectionItem) => void;
  setCorrections: (items: CorrectionItem[]) => void;
  clearCorrection: () => void;
  resetGame: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export type { StoreQuestion, StoreRoundResult, CorrectionItem, ChildSession, GuestProfile, ChildProfile };

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      parentUser: null,
      authToken: null,
      isMockMode: true,
      locale: (i18n.language as SupportedLanguage) || 'en',
      userRole: null,
      childSession: null,
      guestProfile: null,
      childProfile: null,
      ghostToken: null,
      currentMatch: null,
      ropePosition: 0,
      teamScores: { left: 0, right: 0 },
      currentQuestion: null,
      timeRemaining: 30,
      roundResult: null,
      gameEndResult: null,
      streak: 0,
      bestStreak: 0,
      lastMatchCorrection: [],
      children: [],
      subscriptionStatus: 'active',
      subscriptionExpiresAt: null,
      _hasHydrated: false,

      setAuth: (user, mockMode, token) =>
        set({
          isAuthenticated: true,
          parentUser: user,
          authToken: token,
          isMockMode: mockMode,
          userRole: 'parent',
          subscriptionStatus: 'active',
          subscriptionExpiresAt: null,
        }),

      updateParentUser: (user) =>
        set((state) => ({
          parentUser: state.parentUser ? { ...state.parentUser, ...user } : (user as ParentUser),
        })),

      setChildProfile: (profile) => set({ childProfile: profile }),

      setChildSession: (session) =>
        set({ childSession: session, userRole: 'child', isAuthenticated: true, authToken: session.jwtToken }),

      setGuestProfile: (profile) =>
        set({ guestProfile: profile, userRole: 'guest', isAuthenticated: true }),

      loginAsGuest: () =>
        set({ userRole: 'guest', isAuthenticated: true }),

      setGhostToken: (token) =>
        set({ ghostToken: token }),

      clearGuestProfile: () =>
        set({ guestProfile: null, ghostToken: null }),

      setLocale: (locale) => {
        i18n.changeLanguage(locale);
        const isRtl = SUPPORTED_LANGUAGES[locale].rtl;
        if (I18nManager.isRTL !== isRtl) {
          I18nManager.forceRTL(isRtl);
          I18nManager.allowRTL(isRtl);
        }
        set({ locale });
      },

      setSubscriptionStatus: (status, expiresAt) =>
        set({ subscriptionStatus: status, subscriptionExpiresAt: expiresAt ?? null }),

      logout: () =>
        set({
          isAuthenticated: false,
          parentUser: null,
          authToken: null,
          userRole: null,
          childSession: null,
          guestProfile: null,
          childProfile: null,
          ghostToken: null,
          subscriptionStatus: 'active',
          subscriptionExpiresAt: null,
          isMockMode: false,
        }),

      setCurrentMatch: (match) => set({ currentMatch: match }),
      setRopePosition: (position) => set({ ropePosition: position }),
      setTeamScores: (scores) => set({ teamScores: scores }),
      updateTeamScore: (side, points) =>
        set((state) => ({
          teamScores: {
            ...state.teamScores,
            [side]: state.teamScores[side] + points,
          },
        })),
      setCurrentQuestion: (question) =>
        set({ currentQuestion: question, roundResult: null }),
      setTimeRemaining: (time) => set({ timeRemaining: time }),
      setRoundResult: (result) => set({ roundResult: result }),
      setGameEndResult: (result) => set({ gameEndResult: result }),
      setChildren: (children) => set({ children }),
      pushCorrection: (item) =>
        set((state) => ({ lastMatchCorrection: [...state.lastMatchCorrection, item] })),
      setCorrections: (items) => set({ lastMatchCorrection: items }),
      clearCorrection: () => set({ lastMatchCorrection: [] }),
      incrementStreak: () =>
        set((state) => ({
          streak: state.streak + 1,
          bestStreak: Math.max(state.bestStreak, state.streak + 1),
        })),
      resetStreak: () => set({ streak: 0 }),
      resetGame: () =>
        set({
          currentMatch: null,
          ropePosition: 0,
          teamScores: { left: 0, right: 0 },
          currentQuestion: null,
          timeRemaining: 30,
          roundResult: null,
          gameEndResult: null,
          streak: 0,
          bestStreak: 0,
        }),
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'quizrope-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        parentUser: state.parentUser,
        authToken: state.authToken,
        isMockMode: state.isMockMode,
        userRole: state.userRole,
        childSession: state.childSession,
        guestProfile: state.guestProfile,
        ghostToken: state.ghostToken,
        locale: state.locale,
        subscriptionStatus: state.subscriptionStatus,
        subscriptionExpiresAt: state.subscriptionExpiresAt,
        children: state.children,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
