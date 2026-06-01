import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/user';

const PROFILE_FIELDS = 'id, email, displayname, photourl, phone, avatar_url, xp, level, streak, streakdays, longest_streak, is_admin, targetexams, jemassubcourse, currentstage, institution, district, selected_exam_id, active_exam_id, totalmarksearned, totalquestionsattempted, totalcorrect, totalwrong, totalskipped, rapidfireunlockedtier, profilecompletepct, lastloginat, last_active_date, joinedat, created_at';

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
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

/** Maps camelCase Profile fields to their lowercase PostgreSQL column names. */
function mapProfileToDb(updates: Partial<Profile>): Record<string, unknown> {
  const fieldMap: Record<string, string> = {
    displayName: 'displayname',
    photoURL: 'photourl',
    targetExams: 'targetexams',
    jemasSubCourse: 'jemassubcourse',
    currentStage: 'currentstage',
    joinedAt: 'joinedat',
    totalMarksEarned: 'totalmarksearned',
    totalQuestionsAttempted: 'totalquestionsattempted',
    totalCorrect: 'totalcorrect',
    totalWrong: 'totalwrong',
    totalSkipped: 'totalskipped',
    bestMockScore: 'bestmockscore',
    rapidFireUnlockedTier: 'rapidfireunlockedtier',
    streakDays: 'streakdays',
    lastLoginAt: 'lastloginat',
    profileCompletePct: 'profilecompletepct',
    isAdmin: 'is_admin',
  };
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    mapped[fieldMap[key] ?? key] = value;
  }
  return mapped;
}

export async function updateProfile(updates: Partial<Profile>) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: authUser.id, ...mapProfileToDb(updates) }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function checkAndUpdateStreak(userId: string): Promise<Partial<Profile> | null> {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== userId) {
    throw new Error('Unauthorized');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('streakdays, lastloginat')
    .eq('id', userId)
    .maybeSingle();
  if (!profile) return null;

  const today = new Date().toISOString().split('T')[0];
  const lastLogin = profile.lastloginat;
  let newStreak = profile.streakdays ?? 0;

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
      streakdays: newStreak,
      lastloginat: today,
    })
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Partial<Profile>;
}

export async function manageUser(userId: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', authUser.id)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error('Forbidden: admin-only action');
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchAllUsers(limit = 1000, offset = 0) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, displayname, is_admin, targetexams, currentstage, institution, district, totalmarksearned, totalquestionsattempted, lastloginat, joinedat, created_at')
    .range(offset, offset + limit - 1)
    .limit(limit);
  if (error) throw error;
  return data as unknown as Profile[];
}
