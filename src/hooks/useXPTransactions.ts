'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

export function useMarksHistory() {
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const awardMarks = useCallback(async (delta: number) => {
    if (!user) return;
    try {
      const supabase = createClient();
      const newMarks = Math.max(0, (user.totalMarksEarned ?? 0) + delta);
      await supabase.from('profiles').update({ totalMarksEarned: newMarks }).eq('id', user.id);
      setUser({ ...user, totalMarksEarned: newMarks });
    } catch (err) {
      console.error('Failed to award marks:', err);
    }
  }, [user, setUser]);

  return {
    loading,
    awardMarks,
  };
}
