import { createClient } from '@/lib/supabase/client';
import type { Question } from '@/types/exam';
import type { AdminStats } from '@/types/leaderboard';

export async function bulkUploadQuestions(questions: Omit<Question, 'id' | 'created_at' | 'createdAt'>[]) {
  const supabase = createClient();
  const uploaded: Question[] = [];
  const skipped: { row: Omit<Question, 'id' | 'created_at' | 'createdAt'>; reason: string }[] = [];
  const failed: { row: Omit<Question, 'id' | 'created_at' | 'createdAt'>; reason: string }[] = [];

  const BATCH_SIZE = 50;
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('questions')
      .insert(batch)
      .select();

    if (error) {
      for (const row of batch) {
        if (error.code === '23505') {
          skipped.push({ row, reason: 'Duplicate question' });
        } else {
          failed.push({ row, reason: error.message });
        }
      }
    } else if (data) {
      uploaded.push(...(data as Question[]));
    }
  }

  return { uploaded, skipped, failed, total: questions.length };
}

export async function fetchDuplicateQuestions(examId?: string) {
  const supabase = createClient();
  let query = supabase
    .from('questions')
    .select('content_hash, id')
    .not('content_hash', 'is', null);

  if (examId) query = query.eq('exam_id', examId);

  const { data } = await query;
  if (!data?.length) return [];

  const hashCounts = new Map<string, number>();
  const hashIds = new Map<string, string[]>();
  for (const row of data as { content_hash: string; id: string }[]) {
    const h = row.content_hash;
    hashCounts.set(h, (hashCounts.get(h) ?? 0) + 1);
    const ids = hashIds.get(h) ?? [];
    ids.push(row.id);
    hashIds.set(h, ids);
  }

  const duplicates: { content_hash: string; count: number; ids: string[] }[] = [];
  for (const [hash, count] of hashCounts) {
    if (count > 1) {
      duplicates.push({ content_hash: hash, count, ids: hashIds.get(hash) ?? [] });
    }
  }

  return duplicates;
}

export async function validateQuestionRow(row: Record<string, unknown>) {
  const errors: string[] = [];
  if (!row.question_text) errors.push('question_text is required');
  if (!row.option_a) errors.push('option_a is required');
  if (!row.option_b) errors.push('option_b is required');
  if (!row.option_c) errors.push('option_c is required');
  if (!row.option_d) errors.push('option_d is required');
  if (!row.correct_answer || !['a', 'b', 'c', 'd'].includes(String(row.correct_answer).toLowerCase())) {
    errors.push('correct_answer must be a/b/c/d');
  }
  if (row.difficulty && !['Easy', 'Medium', 'Hard'].includes(String(row.difficulty))) {
    errors.push('difficulty must be Easy/Medium/Hard');
  }
  if (!row.exam_id) errors.push('exam_id is required');
  return errors;
}

export async function createQuestion(question: Omit<Question, 'id' | 'created_at' | 'createdAt'>) {
  const supabase = createClient();
  const { data, error } = await supabase.from('questions').insert(question).select().single();
  if (error) throw error;
  return data as Question;
}

export async function updateQuestion(id: string, updates: Partial<Question>) {
  const supabase = createClient();
  const { data, error } = await supabase.from('questions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Question;
}

export async function softDeleteQuestion(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('questions').update({ archived: true }).eq('id', id);
  if (error) throw error;
}

const ADMIN_QUESTION_FIELDS = 'id, exam_id, subject_id, topic_id, question, option_a, option_b, option_c, option_d, correct, difficulty, explanation, is_pyq, pyq_year, tag_id, mock_test_id, source, quiz_pool_status, content_hash, archived, created_at';

export async function fetchQuestionsAdmin(filters?: { exam_id?: string; difficulty?: string; search?: string }, limit = 50, offset = 0) {
  const supabase = createClient();
  let query = supabase.from('questions').select(ADMIN_QUESTION_FIELDS).eq('archived', false).range(offset, offset + limit - 1).limit(limit);
  if (filters?.exam_id) query = query.eq('exam_id', filters.exam_id);
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters?.search) query = query.ilike('question', `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = createClient();
  const { data: users } = await supabase.from('profiles').select('id, targetexams').limit(5000);
  const { data: attempts } = await supabase
    .from('attempts')
    .select('attempted_at')
    .gte('attempted_at', new Date(Date.now() - 30 * 86400000).toISOString())
    .limit(10000);

  const totalUsers = (users as unknown[])?.length ?? 0;

  const perExam: Record<string, number> = {};
  (users as Record<string, unknown>[] ?? []).forEach((u) => {
    const id = String(u.targetexams ?? 'none');
    perExam[id] = (perExam[id] ?? 0) + 1;
  });

  const dailyMap: Record<string, number> = {};
  (attempts as { attempted_at: string }[] ?? []).forEach(a => {
    const day = new Date(a.attempted_at).toISOString().split('T')[0];
    dailyMap[day] = (dailyMap[day] ?? 0) + 1;
  });

  return {
    totalRegisteredUsers: totalUsers,
    totalUsersPerExam: Object.entries(perExam).map(([exam, count]) => ({ exam, count })),
    dailyActiveUsers: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
    averageScores: [],
    marksDistribution: [],
    topWrongQuestions: [],
  };
}
