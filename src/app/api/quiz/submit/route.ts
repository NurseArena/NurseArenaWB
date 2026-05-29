import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const submitSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.string().nullable(),
  isCorrect: z.boolean(),
  timeTakenMs: z.number().int().positive(),
  sessionId: z.string().uuid().optional(),
  orderIndex: z.number().int().optional(),
  marksAwarded: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { questionId, selectedOption, isCorrect, timeTakenMs, sessionId, orderIndex, marksAwarded } = parsed.data;

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: attempt, error } = await supabase.from('attempts').insert({
      user_id: user.id,
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
    }).select().single();

    if (error) throw error;

    if (sessionId) {
      await supabase.from('session_answers').insert({
        session_id: sessionId,
        question_id: questionId,
        order_index: orderIndex ?? 0,
        selected_option: selectedOption,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        time_taken_ms: timeTakenMs,
        answered_at: new Date().toISOString(),
      });
    }

    let marksDelta = 0;
    if (isCorrect) {
      marksDelta = marksAwarded ?? 1.0;
      const { data: profile } = await supabase
        .from('profiles')
        .select('totalMarksEarned, totalCorrect, totalQuestionsAttempted')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            totalMarksEarned: (profile.totalMarksEarned ?? 0) + marksDelta,
            totalCorrect: (profile.totalCorrect ?? 0) + 1,
            totalQuestionsAttempted: (profile.totalQuestionsAttempted ?? 0) + 1,
          })
          .eq('id', user.id);
      }
    } else if (selectedOption) {
      marksDelta = marksAwarded ?? -0.25;
      const { data: profile } = await supabase
        .from('profiles')
        .select('totalMarksEarned, totalWrong, totalQuestionsAttempted')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            totalMarksEarned: Math.max(0, (profile.totalMarksEarned ?? 0) + marksDelta),
            totalWrong: (profile.totalWrong ?? 0) + 1,
            totalQuestionsAttempted: (profile.totalQuestionsAttempted ?? 0) + 1,
          })
          .eq('id', user.id);
      }
    }

    return NextResponse.json({ attempt, marksDelta });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
