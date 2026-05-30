'use client';
import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { checkAndUpdateStreak } from '@/services/profiles';

export function useStreak() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const updateStreak = useCallback(async () => {
    if (!user) return null;
    try {
      const updated = await checkAndUpdateStreak(user.id);
      if (updated) setUser({ ...user, ...updated } as any);
      return updated;
    } catch (err) {
      console.error('Failed to update streak:', err);
      return null;
    }
  }, [user, setUser]);

  const daysUntilStreakBreak = useCallback(() => {
    if (!user?.lastLoginAt) return 0;
    const last = new Date(user.lastLoginAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - last.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [user]);

  return {
    streak: user?.streakDays ?? 0,
    updateStreak,
    daysUntilStreakBreak: daysUntilStreakBreak(),
  };
}
