import { createClient } from '@/lib/supabase/client';
import type { PeriodType } from '@/types/leaderboard';

export async function fetchLeaderboard(examId: string, period: PeriodType = 'all_time') {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, user_id, exam_id, marksEarned, rank, correct_count, period_type, profiles(displayName, photoURL, totalMarksEarned)')
    .eq('period_type', period)
    .eq('exam_id', examId)
    .order('rank', { ascending: true })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function getUserRank(userId: string, examId: string, period: PeriodType = 'all_time') {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leaderboard')
    .select('rank, user_id, marksEarned, exam_id')
    .eq('period_type', period)
    .eq('exam_id', examId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}
