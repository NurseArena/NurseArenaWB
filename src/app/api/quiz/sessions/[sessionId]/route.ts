import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const paramsSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = paramsSchema.parse(await params);
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session } = await supabase
      .from('quiz_sessions')
      .select('id, quiz_id, user_id, total_questions, max_score, score, correct_count, wrong_count, attempted_count, status, started_at, submitted_at, time_taken_ms, created_at, quiz:quizzes(id, title, type, duration_seconds, question_count, exam_id, subject_id, topic_id, scoring_profile_id)')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const isSubmitted = session.status === 'submitted';

    const { data: answers } = await supabase
      .from('session_answers')
      .select(isSubmitted
        ? '*, question:questions(id, question, option_a, option_b, option_c, option_d, correctAnswers, correct, explanation, difficulty, topic, subject_id)'
        : 'id, session_id, question_id, order_index, selected_option, is_correct, marks_awarded, time_taken_ms, answered_at, question:questions(id, question, option_a, option_b, option_c, option_d, difficulty, topic, subject_id)')
      .eq('session_id', sessionId)
      .order('order_index');

    return NextResponse.json({ session, answers: answers ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
