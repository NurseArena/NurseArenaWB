'use client';
import { useAuthStore } from '@/store/authStore';
import { getRapidFireTier, getNextTier, marksToXp } from '@/lib/xp';

export function useXP() {
  const user = useAuthStore((s) => s.user);
  const totalMarks = user?.totalMarksEarned ?? 0;
  const currentTier = getRapidFireTier(totalMarks);
  const nextTier = getNextTier(totalMarks);

  const nextMilestone = nextTier ? nextTier.marksMilestone - totalMarks : 0;
  const progress = nextTier
    ? Math.floor(((totalMarks - currentTier.marksMilestone) / (nextTier.marksMilestone - currentTier.marksMilestone)) * 100)
    : 100;

  return {
    marks: totalMarks,
    xp: marksToXp(totalMarks),
    currentTier,
    nextTier,
    nextMilestone,
    progress,
  };
}
