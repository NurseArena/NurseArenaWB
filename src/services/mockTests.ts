import { createClient } from '@/lib/supabase/client';
import type { MockTestEvent } from '@/types/user';

export async function fetchUpcomingMockTests(examId?: string) {
  const supabase = createClient();
  let query = supabase
    .from('mock_test_events')
    .select('id, exam_id, title, description, status, scheduled_at, duration_min, scoring_profile_id, exams(name, code)')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });
  if (examId) query = query.eq('exam_id', examId);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as (MockTestEvent & { exams?: { name: string; code: string } })[];
}

export async function getMockTestCountdown(eventId: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('mock_test_events')
    .select('id, exam_id, title, description, status, scheduled_at, duration_min, scoring_profile_id')
    .eq('id', eventId)
    .maybeSingle();
  if (error) throw error;
  return data as MockTestEvent | null;
}

export function getTimeUntilEvent(scheduledAt: string) {
  const now = Date.now();
  const event = new Date(scheduledAt).getTime();
  const diff = event - now;
  if (diff <= 0) return { isActive: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    isActive: false,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function isWithinWindow(scheduledAt: string, durationMin: number) {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const end = start + durationMin * 60000;
  return now >= start && now <= end;
}

const CLIENT_QUESTION_FIELDS = 'id, question, option_a, option_b, option_c, option_d, difficulty, topic, subject_id, exam_id';

export async function startMockTest(eventId: number, _userId: string) {
  const supabase = createClient();
  const event = await getMockTestCountdown(eventId);
  if (!event) throw new Error('Mock test not found');
  if (!isWithinWindow(event.scheduled_at, event.duration_min)) {
    throw new Error('Mock test is not currently active');
  }
  const questions = await supabase
    .from('questions')
    .select(CLIENT_QUESTION_FIELDS)
    .eq('exam_id', event.exam_id)
    .limit(50);
  return questions.data ?? [];
}
const MAX_RESPONSES = 200;

export async function submitMockTestResponses(eventId: number, userId: string, responses: { question_id: string; selected_option: string; time_taken_ms: number; is_correct: boolean }[]) {
  if (responses.length > MAX_RESPONSES) {
    throw new Error(`Too many responses (max ${MAX_RESPONSES})`);
  }

  const supabase = createClient();
  const attempts = responses.map(r => ({
    user_id: userId,
    question_id: r.question_id,
    selected_option: r.selected_option,
    is_correct: r.is_correct,
    time_taken_ms: r.time_taken_ms,
  }));

  const { data, error } = await supabase.from('attempts').insert(attempts).select();
  if (error) throw error;
  return data;
}
