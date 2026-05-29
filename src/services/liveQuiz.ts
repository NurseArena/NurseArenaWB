import { createClient } from '@/lib/supabase/client';
import type { LiveQuizEvent, QuizResult, QuizAnswer } from '@/types/user';

export async function fetchUpcomingLiveQuizzes(examId?: string) {
  const supabase = createClient();
  let query = supabase
    .from('live_quiz_events')
    .select('id, exam_id, title, description, status, starts_at, duration_min, question_set_id, scoring_profile_id')
    .in('status', ['scheduled', 'live'])
    .order('starts_at', { ascending: true });
  if (examId) query = query.eq('exam_id', examId);
  const { data, error } = await query;
  if (error) throw error;
  return data as LiveQuizEvent[];
}

export async function getLiveQuizState(quizEventId: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('live_quiz_events')
    .select('id, exam_id, title, description, status, starts_at, duration_min, question_set_id, scoring_profile_id')
    .eq('id', quizEventId)
    .single();
  if (error) throw error;
  return data as LiveQuizEvent;
}

export async function joinLiveQuiz(quizEventId: number, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quiz_results')
    .upsert({
      quiz_event_id: quizEventId,
      user_id: userId,
      score: 0,
      correct_count: 0,
      total_latency_ms: 0,
      joined_at_index: 0,
      disconnection_flag: false,
    }, { onConflict: 'quiz_event_id, user_id' })
    .select()
    .single();
  if (error) throw error;
  return data as QuizResult;
}

export async function submitQuizAnswer(answer: Omit<QuizAnswer, 'id' | 'submitted_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quiz_answers')
    .upsert(answer, { onConflict: 'user_id, quiz_event_id, question_index' })
    .select()
    .single();
  if (error) throw error;
  return data as QuizAnswer;
}

export async function fetchQuizLeaderboard(quizEventId: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quiz_results')
    .select('user_id, quiz_event_id, score, correct_count, total_latency_ms, profiles(name, avatar_url)')
    .eq('quiz_event_id', quizEventId)
    .order('score', { ascending: false })
    .order('correct_count', { ascending: false })
    .order('total_latency_ms', { ascending: true })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function fetchQuizQuestions(quizEventId: number) {
  const supabase = createClient();
  const quiz = await supabase
    .from('live_quiz_events')
    .select('question_set_id')
    .eq('id', quizEventId)
    .single();
  if (!quiz.data?.question_set_id) return [];

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, question_id, order_index, questions(id, question, option_a, option_b, option_c, option_d, difficulty, topic, subject_id)')
    .eq('quiz_id', quiz.data.question_set_id)
    .order('order_index');
  if (error) throw error;
  return data;
}
