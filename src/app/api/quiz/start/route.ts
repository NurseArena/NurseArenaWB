import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const startQuizSchema = z.object({
  quizId: z.string().uuid(),
  subjectId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = startQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { quizId, subjectId } = parsed.data;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id, title, type, exam_id, subject_id, topic_id, scoring_profile_id, duration_seconds, per_question_seconds, question_count, pyq_year, live_at, created_at')
      .eq('id', quizId)
      .single();

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const { data: quizQuestions } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_id, order_index, questions(id, question, option_a, option_b, option_c, option_d, difficulty, topic, subject_id)')
      .eq('quiz_id', quizId)
      .order('order_index');

    let questions = quizQuestions ?? [];

    if (!questions.length) {
      let baseQuery = supabase
        .from('questions')
        .select('id, question, option_a, option_b, option_c, option_d, explanation, difficulty, topic, subject_id')
        .eq('archived', false);

      const quizType = quiz.type as string;

      if (quizType === 'mock') {
        return NextResponse.json({ error: 'Mock tests require pre-assigned questions' }, { status: 400 });
      } else if (quizType === 'pyq') {
        baseQuery = baseQuery.eq('is_pyq', true).is('mock_test_id', null);
        if (quiz.pyq_year) baseQuery = baseQuery.eq('pyq_year', quiz.pyq_year);
      } else if (['quiz', 'topicwise', 'rapid_fire', 'daily'].includes(quizType)) {
        baseQuery = baseQuery.is('mock_test_id', null).eq('is_pyq', false).eq('quiz_pool_status', 'available');
      } else {
        baseQuery = baseQuery.is('mock_test_id', null).eq('is_pyq', false);
      }

      if (quiz.exam_id) baseQuery = baseQuery.eq('exam_id', quiz.exam_id);
      if (subjectId) baseQuery = baseQuery.eq('subject_id', subjectId);
      if (quiz.subject_id) baseQuery = baseQuery.eq('subject_id', quiz.subject_id);
      if (quiz.topic_id) baseQuery = baseQuery.eq('topic_id', quiz.topic_id);

      const count = (quiz.question_count as number) || 10;
      const { data: randomQ } = await baseQuery.limit(200);

      if (randomQ?.length) {
        const shuffled = [...randomQ].sort(() => Math.random() - 0.5);
        questions = shuffled.slice(0, count).map((q) => ({ questions: q }));
      }
    }

    const questionCount = questions.length;
    const scoringProfileId = quiz.scoring_profile_id as string | null;
    let maxScore = questionCount;

    if (scoringProfileId) {
      const { data: profile } = await supabase
        .from('quiz_scoring_profiles')
        .select('marks_correct')
        .eq('id', scoringProfileId)
        .single();
      if (profile) {
        maxScore = questionCount * Number(profile.marks_correct);
      }
    }

    const { data: session } = await supabase
      .from('quiz_sessions')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        total_questions: questionCount,
        max_score: maxScore,
      })
      .select()
      .single();

    return NextResponse.json({ questions: questions ?? [], session });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
