import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const createQuizSchema = z.object({
  exam_id: z.string().uuid(),
  type: z.enum(['mock','quiz','topicwise','rapid_fire','live','daily','pyq']),
  title: z.string().min(1),
  question_count: z.number().int().positive(),
  duration_seconds: z.number().int().positive().optional(),
  subject_id: z.string().uuid().optional(),
  topic_id: z.string().uuid().optional(),
});

async function requireAdmin() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { supabase: null as never, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return { supabase: null as never, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { supabase, error: null };
}

export async function POST(request: Request) {
  try {
    const { supabase, error: authError } = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const parsed = createQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { data, error } = await supabase.from('quizzes').insert(parsed.data).select();
    if (error) throw error;

    return NextResponse.json({ quiz: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { supabase, error: authError } = await requireAdmin();
    if (authError) return authError;

    const { data, error } = await supabase
      .from('quizzes')
      .select('id, title, type, exam_id, subject_id, topic_id, scoring_profile_id, duration_seconds, per_question_seconds, question_count, pyq_year, live_at, status, created_at, exams(code)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ quizzes: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
