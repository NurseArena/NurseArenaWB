import { createClient } from '@/lib/supabase/client';

export async function awardMarks(userId: string, delta: number) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('totalMarksEarned')
    .eq('id', userId)
    .single();
  if (profile) {
    const newMarks = Math.max(0, (profile.totalMarksEarned ?? 0) + delta);
    await supabase
      .from('profiles')
      .update({ totalMarksEarned: newMarks })
      .eq('id', userId);
  }
}
