import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const querySchema = z.object({
  exam_id: z.string().min(1, 'exam_id is required'),
  period: z.enum(['daily', 'weekly', 'all_time']).default('all_time'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid query parameters';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { exam_id, period } = parsed.data;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, user_id, exam_id, marksEarned, rank, correct_count, period_type, profiles(displayName, photoURL, totalMarksEarned)')
      .eq('period_type', period)
      .eq('exam_id', exam_id)
      .order('marksEarned', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ entries: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
