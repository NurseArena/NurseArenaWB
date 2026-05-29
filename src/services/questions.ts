import { createClient } from '@/lib/supabase/client';
import type { Question } from '@/types/exam';

const CLIENT_QUESTION_FIELDS = 'id, question, option_a, option_b, option_c, option_d, difficulty, topic, subject_id, exam_id, is_pyq, pyq_year, pyq_exam_name, tag_id, mock_test_id, source';

export async function fetchQuestions(examId: string, subjectId?: string, limit = 20) {
  const supabase = createClient();
  let query = supabase
    .from('questions')
    .select(CLIENT_QUESTION_FIELDS)
    .eq('exam_id', examId)
    .limit(limit);

  if (subjectId) query = query.eq('subject_id', subjectId);

  const { data, error } = await query;
  if (error) throw error;
  return data as Question[];
}

export async function fetchQuestionsByIds(ids: string[]) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('questions')
    .select(CLIENT_QUESTION_FIELDS)
    .in('id', ids);

  if (error) throw error;
  return data as Question[];
}

export async function fetchPYQs(examId: string, year?: number) {
  const supabase = createClient();
  let query = supabase
    .from('questions')
    .select(CLIENT_QUESTION_FIELDS)
    .eq('exam_id', examId)
    .eq('is_pyq', true);

  if (year) query = query.eq('pyq_year', year);

  const { data, error } = await query;
  if (error) throw error;
  return data as Question[];
}
