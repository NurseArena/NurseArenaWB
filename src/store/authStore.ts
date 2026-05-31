import { create } from 'zustand';
import type { Profile } from '@/types/user';

export function normalizeProfile(user: any): Profile | null {
  if (!user) return null;
  return {
    id: user.id ?? user.uid ?? '',
    uid: user.uid ?? user.id ?? '',
    email: user.email ?? '',
    displayName: user.displayName ?? user.displayname ?? user.name ?? user.email?.split('@')[0] ?? 'Student',
    photoURL: user.photoURL ?? user.photourl ?? user.avatar_url ?? null,
    phone: user.phone ?? '',
    targetExams: user.targetExams ?? user.targetexams ?? [],
    jemasSubCourse: user.jemasSubCourse ?? user.jemassubcourse ?? '',
    currentStage: user.currentStage ?? user.currentstage ?? 'Student',
    institution: user.institution ?? '',
    district: user.district ?? '',
    joinedAt: user.joinedAt ?? user.joinedat ?? null,
    totalMarksEarned: Number(user.totalMarksEarned ?? user.totalmarksearned ?? 0),
    totalQuestionsAttempted: Number(user.totalQuestionsAttempted ?? user.totalquestionsattempted ?? 0),
    totalCorrect: Number(user.totalCorrect ?? user.totalcorrect ?? 0),
    totalWrong: Number(user.totalWrong ?? user.totalwrong ?? 0),
    totalSkipped: Number(user.totalSkipped ?? user.totalskipped ?? 0),
    bestMockScore: Number(user.bestMockScore ?? user.bestmockscore ?? 0),
    rapidFireUnlockedTier: Number(user.rapidFireUnlockedTier ?? user.rapidfireunlockedtier ?? 1),
    streakDays: Number(user.streakDays ?? user.streakdays ?? 0),
    lastLoginAt: user.lastLoginAt ?? user.lastloginat ?? null,
    profileCompletePct: Number(user.profileCompletePct ?? user.profilecompletepct ?? 0),
    isAdmin: user.isAdmin ?? user.is_admin ?? false,
  };
}

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  setUser: (user: any) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user: normalizeProfile(user), isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ user: null, isLoading: false }),
}));

