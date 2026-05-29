import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const createQuestionSchema = z.object({
  exam_id: z.string().uuid(),
  question: z.string().min(1),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().min(1),
  option_d: z.string().min(1),
  correct: z.enum(['A','B','C','D']),
  subject_id: z.string().uuid().optional(),
  topic_id: z.string().uuid().optional(),
  difficulty: z.enum(['easy','medium','hard']).optional(),
  explanation: z.string().optional(),
  is_pyq: z.boolean().optional(),
  pyq_year: z.number().int().optional(),
});

const updateQuestionSchema = z.object({
  question: z.string().min(1).optional(),
  option_a: z.string().min(1).optional(),
  option_b: z.string().min(1).optional(),
  option_c: z.string().min(1).optional(),
  option_d: z.string().min(1).optional(),
  correct: z.enum(['A','B','C','D']).optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy','medium','hard']).optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  difficulty: z.string().optional(),
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
    .single();

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
    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { data, error } = await supabase.from('questions').insert(parsed.data).select();
    if (error) throw error;

    return NextResponse.json({ questions: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, error: authError } = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    let query = supabase
      .from('questions')
      .select('id, exam_id, subject_id, topic_id, question, option_a, option_b, option_c, option_d, correct, difficulty, explanation, is_pyq, pyq_year, tag_id, mock_test_id, source, quiz_pool_status, content_hash, archived, created_at, question_tags(id, tag_id, question_id), subjects(name), exams(code)')
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (parsed.success) {
      if (parsed.data.search) query = query.ilike('question', `%${parsed.data.search}%`);
      if (parsed.data.difficulty) query = query.eq('difficulty', parsed.data.difficulty);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ questions: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, error: authError } = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const idResult = z.string().uuid().safeParse(searchParams.get('id'));
    if (!idResult.success) {
      return NextResponse.json({ error: 'Valid question id is required' }, { status: 400 });
    }
    const id = idResult.data;

    const body = await request.json();
    const parsed = updateQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('questions')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ question: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, error: authError } = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const idResult = z.string().uuid().safeParse(searchParams.get('id'));
    if (!idResult.success) {
      return NextResponse.json({ error: 'Valid question id is required' }, { status: 400 });
    }
    const id = idResult.data;

    const { error } = await supabase
      .from('questions')
      .update({ archived: true })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
