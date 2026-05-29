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

      const merged = missionData.map((m: Mission) => {
        const um = userMissionData?.find((u: UserMission) => u.mission_id === m.id);
        return {
          ...m,
          progress: um?.progress ?? 0,
          completed: um?.completed ?? false,
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
