import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const querySchema = z.object({
  exam_id: z.string().optional(),
  type: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    const { exam_id, type, limit, offset } = parsed.data;

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('quiz_sessions')
      .select('id, quiz_id, user_id, total_questions, max_score, score, correct_count, wrong_count, attempted_count, status, started_at, time_taken_ms, created_at, quiz:quizzes!inner(id, title, type, exam_id, subject_id, topic_id, duration_seconds)')
      .eq('user_id', user.id)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (exam_id) query = query.eq('quiz.exam_id', exam_id);
    if (type) query = query.eq('quiz.type', type);

    const { data: sessions, error } = await query;
    if (error) throw error;

    return NextResponse.json({ sessions: sessions ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
