import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/user';

const PROFILE_FIELDS = 'id, name, displayName, email, photoURL, phone, avatar_url, xp, level, streak, streakDays, longest_streak, is_admin, targetExams, jemasSubCourse, currentStage, institution, district, selected_exam_id, active_exam_id, totalMarksEarned, totalQuestionsAttempted, totalCorrect, totalWrong, totalSkipped, bestMockScore, rapidFireUnlockedTier, profileCompletePct, lastLoginAt, last_active_date, joinedAt, created_at';

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== userId) {
    throw new Error('Unauthorized');
  }
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(updates: Partial<Profile>) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', authUser.id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function checkAndUpdateStreak(userId: string) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== userId) {
    throw new Error('Unauthorized');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('streakDays, lastLoginAt')
    .eq('id', userId)
    .single();
  if (!profile) return null;

  const today = new Date().toISOString().split('T')[0];
  const lastLogin = profile.lastLoginAt;
  let newStreak = profile.streakDays ?? 0;

  if (lastLogin === today) return profile;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (lastLogin === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      streakDays: newStreak,
      lastLoginAt: today,
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function manageUser(userId: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', authUser.id)
    .single();
  if (!profile?.is_admin) throw new Error('Forbidden: admin-only action');
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchAllUsers(limit = 1000, offset = 0) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, displayName, email, is_admin, targetExams, currentStage, institution, district, totalMarksEarned, totalQuestionsAttempted, lastLoginAt, joinedAt, created_at')
    .range(offset, offset + limit - 1)
    .limit(limit);
  if (error) throw error;
  return data as Profile[];
}
