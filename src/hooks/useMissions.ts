'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { Mission, UserMission } from '@/types/user';

export function useMissions() {
  const [missions, setMissions] = useState<(Mission & { progress?: number; completed?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const loadMissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: missionData } = await supabase
        .from('missions')
        .select('id, title, description, type, target, xp_reward, exam_id, created_at')
        .limit(5);

      if (!missionData) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: userMissionData } = await supabase
        .from('user_missions')
        .select('id, mission_id, progress, completed')
        .eq('user_id', user.id)
        .eq('assigned_date', today);

      const merged = missionData.map((m: Record<string, unknown>) => {
        const um = userMissionData?.find((u: Record<string, unknown>) => u.mission_id === m.id);
        return {
          id: m.id as string,
          exam_id: m.exam_id as string | undefined,
          title: m.title as string,
          description: m.description as string | undefined,
          xp_reward: m.xp_reward as number,
          condition_type: m.type as string,
          condition_value: m.target as number,
          is_daily: false,
          progress: um?.progress as number ?? 0,
          completed: um?.completed as boolean ?? false,
        };
      });

      setMissions(merged);
    } catch (err) {
      console.error('Failed to load missions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProgress = useCallback(async (missionId: string, progress: number) => {
    if (!user) return;
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('user_missions').upsert({
      user_id: user.id,
      mission_id: missionId,
      progress,
      completed: false,
      assigned_date: today,
    });

    loadMissions();
  }, [user, loadMissions]);

  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      try { if (!cancelled) await loadMissions(); } catch {}
    };
    doLoad();
    return () => { cancelled = true; };
  }, [loadMissions]);

  return { missions, loading, refresh: loadMissions, updateProgress };
}
