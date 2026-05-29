import { createClient } from '@/lib/supabase/client';
import type { Attempt } from '@/types/quiz';
import type { QuizAttempt } from '@/types/user';

export async function logAttempt(attempt: Omit<Attempt, 'id' | 'attempted_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('attempts')
    .insert(attempt)
    .select()
    .single();
  if (error) throw error;
  return data as Attempt;
}

export async function fetchUserAttempts(userId: string, limit = 100) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('attempts')
    .select('id, user_id, question_id, selected_option, is_correct, time_taken_ms, attempted_at, questions(id, question, option_a, option_b, option_c, option_d, difficulty, topic, subject_id)')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getUserStats(userId: string) {
  const supabase = createClient();
  const { count: totalCount } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: correctCount } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_correct', true);

  const total = totalCount ?? 0;
  const correct = correctCount ?? 0;

  return {
    totalAttempts: total,
    correctAnswers: correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

export async function saveQuizAttempt(attempt: Omit<QuizAttempt, 'id'>) {
  const supabase = createClient();
  const dbRow = {
    uid: attempt.uid,
    quiz_id: attempt.quizId,
    attempt_number: attempt.attemptNumber,
    exam_id: attempt.examId,
    started_at: attempt.startedAt,
    completed_at: attempt.completedAt,
    total_marks: attempt.totalMarks,
    marks_earned: attempt.marksEarned,
    percentage: attempt.percentage,
    correct: attempt.correct,
    wrong: attempt.wrong,
    skipped: attempt.skipped,
    negative_penalty: attempt.negativePenalty,
    category_i_attempts: attempt.categoryIAttempts,
    category_ii_attempts: attempt.categoryIIAttempts,
    subject_breakdown: attempt.subjectBreakdown,
    is_live_attempt: attempt.isLiveAttempt,
  };
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert(dbRow)
    .select()
    .single();
  if (error) throw error;
  return data as QuizAttempt;
}

export async function fetchQuizAttempts(userId: string, examId?: string, limit = 20) {
  const supabase = createClient();
  let query = supabase
    .from('quiz_attempts')
    .select('id, uid, quiz_id, attempt_number, exam_id, started_at, completed_at, total_marks, marks_earned, percentage, correct, wrong, skipped')
    .eq('uid', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);
  if (examId) query = query.eq('exam_id', examId);
  const { data, error } = await query;
  if (error) throw error;
  return data as QuizAttempt[];
}
