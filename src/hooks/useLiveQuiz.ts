'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { LiveQuizEvent } from '@/types/user';
import type { QuestionWithStatus, LeaderboardEntry } from '@/types/quiz';

export function useLiveQuiz() {
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<LiveQuizEvent[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<LiveQuizEvent | null>(null);
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemainingMs, setTimeRemainingMs] = useState(30000);
  const [marksEarned, setMarksEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalLatencyMs, setTotalLatencyMs] = useState(0);
  const [joinedLate, setJoinedLate] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<'waiting' | 'active' | 'reviewing' | 'ended'>('waiting');
  const user = useAuthStore((s) => s.user);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUpcoming = useCallback(async (examId?: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('live_quiz_events')
        .select('id, exam_id, title, description, status, starts_at, duration_min, question_set_id, scoring_profile_id, current_q_index, timezone')
        .in('status', ['scheduled', 'live'])
        .order('starts_at', { ascending: true });
      if (examId) query = query.eq('exam_id', examId);
      const { data } = await query;
      setUpcomingQuizzes((data ?? []) as LiveQuizEvent[]);
    } catch (err) {
      console.error('Failed to fetch live quizzes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const joinQuiz = useCallback(async (quizEventId: number) => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data: quiz } = await supabase
        .from('live_quiz_events')
        .select('id, exam_id, title, description, status, starts_at, duration_min, question_set_id, scoring_profile_id, current_q_index, timezone')
        .eq('id', quizEventId)
        .single();
      if (!quiz) throw new Error('Quiz not found');
      setActiveQuiz(quiz as LiveQuizEvent);

      await supabase
        .from('quiz_results')
        .upsert({
          quiz_event_id: quizEventId,
          user_id: user.id,
          marks_earned: 0,
          correct_count: 0,
          joined_at_index: (quiz as LiveQuizEvent).current_q_index,
          disconnection_flag: false,
        }, { onConflict: 'quiz_event_id, user_id' });

      if ((quiz as LiveQuizEvent).current_q_index > 0) {
        setJoinedLate(true);
      }

      if ((quiz as LiveQuizEvent).status === 'live') {
        setQuizState('active');
        setCurrentIndex((quiz as LiveQuizEvent).current_q_index);
      } else {
        setQuizState('waiting');
      }
    } catch (err) {
      console.error('Failed to join quiz:', err);
    }
  }, [user]);

  const submitAnswer = useCallback(async (selected: string, questionIndex: number) => {
    if (!user || !activeQuiz || !canSubmit) return;
    const q = questions[questionIndex];
    if (!q) return;

    const isCorrect = q.correctAnswers.includes(selected);
    const qMarks = q.category === 'I' ? 1 : 2;
    const marksDelta = isCorrect ? qMarks : (q.category === 'I' ? -0.25 : 0);

    try {
      const supabase = createClient();
      await supabase
        .from('quiz_answers')
        .upsert({
          quiz_event_id: activeQuiz.id,
          user_id: user.id,
          question_index: questionIndex,
          selected_option: selected,
          is_correct: isCorrect,
        }, { onConflict: 'user_id, quiz_event_id, question_index' });

      if (isCorrect) {
        setMarksEarned(s => s + marksDelta);
        setCorrectCount(c => c + 1);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  }, [user, activeQuiz, canSubmit, questions]);

  const fetchLeaderboard = useCallback(async (quizEventId: number) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('quiz_results')
        .select('user_id, marks_earned, correct_count, profiles(displayName, photoURL)')
        .eq('quiz_event_id', quizEventId)
        .order('marks_earned', { ascending: false })
        .order('correct_count', { ascending: false })
        .limit(10);
      if (data) {
        setLeaderboard(data.map((r: Record<string, unknown>, i: number) => ({
          userId: r.user_id as string,
          name: ((r.profiles as Record<string, unknown>)?.displayName as string) ?? 'Unknown',
          avatar: (r.profiles as Record<string, unknown>)?.photoURL as string | undefined,
          marksEarned: r.marks_earned as number,
          percentage: 0,
          wrong: 0,
          rank: i + 1,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  useEffect(() => {
    if (quizState === 'active' && activeQuiz) {
      const interval = setInterval(() => {
        fetchLeaderboard(activeQuiz.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [quizState, activeQuiz, fetchLeaderboard]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    upcomingQuizzes,
    activeQuiz,
    questions,
    currentIndex,
    timeRemainingMs,
    marksEarned,
    correctCount,
    totalLatencyMs,
    joinedLate,
    canSubmit,
    leaderboard,
    loading,
    quizState,
    fetchUpcoming,
    joinQuiz,
    submitAnswer,
    setCurrentIndex,
    setTimeRemainingMs,
    setCanSubmit,
    setQuizState,
    setQuestions,
    setJoinedLate,
  };
}
