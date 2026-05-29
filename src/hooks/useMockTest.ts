'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MockTestEvent } from '@/types/user';

export function useMockTest() {
  const [upcomingTests, setUpcomingTests] = useState<(MockTestEvent & { exams?: { name: string; code: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(async (examId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from('mock_test_events')
        .select('*, exams(name, code)')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });
      if (examId) query = query.eq('exam_id', examId);
      const { data } = await query;
      setUpcomingTests((data ?? []) as (MockTestEvent & { exams?: { name: string; code: string } })[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  }, []);

  const isWithinWindow = (scheduledAt: string, durationMin: number) => {
    const now = Date.now();
    const start = new Date(scheduledAt).getTime();
    const end = start + durationMin * 60000;
    return now >= start && now <= end;
  };

  const getCountdown = (scheduledAt: string) => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  return {
    upcomingTests,
    loading,
    error,
    fetchUpcoming,
    isWithinWindow,
    getCountdown,
  };
}
