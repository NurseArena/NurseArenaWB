'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard, getUserRank } from '@/services/leaderboard';
import type { PeriodType, LeaderboardEntry } from '@/types/leaderboard';

export function useLeaderboard(examId: string) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<PeriodType>('all_time');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLeaderboard(examId, period);
      setData(result as unknown as LeaderboardEntry[]);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [examId, period]);

  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      try { if (!cancelled) await load(); } catch {}
    };
    doLoad();
    return () => { cancelled = true; };
  }, [load]);

  return { data, period, setPeriod, loading, refresh: load };
}

export function useUserRank(userId: string, examId: string) {
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getUserRank(userId, examId).then((r) => {
      if (!cancelled && r) setRank(r.rank);
    });
    return () => { cancelled = true; };
  }, [userId, examId]);

  return rank;
}
