'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useQuizStore } from '@/store/quizStore';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { calculateMarks as calculateMarksV2 } from '@/lib/xp';
import { calculateMarks as calculateScoring, calculateSessionScore } from '@/lib/scoring';
import type { QuestionWithStatus, ScoringProfile } from '@/types/quiz';

export function useQuiz() {
  const store = useQuizStore();
  const user = useAuthStore((s) => s.user);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const perQuestionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSubmittedRef = useRef(false);
  const responsesRef = useRef<{ selected: string | string[] | null; category: 'I' | 'II' }[]>([]);
  const scoringProfileRef = useRef<ScoringProfile | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (perQuestionTimerRef.current) {
      clearInterval(perQuestionTimerRef.current);
      perQuestionTimerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((duration: number) => {
    clearTimer();
    store.setTimeRemaining(duration);
    timerRef.current = setInterval(() => {
      const current = useQuizStore.getState().timeRemaining;
      if (current <= 1) {
        clearTimer();
        store.setTimeRemaining(0);
        store.setState('finished');
        return;
      }
      store.setTimeRemaining(current - 1);
    }, 1000);
  }, [clearTimer, store]);

  const startPerQuestionTimer = useCallback((seconds: number) => {
    store.setTimeRemaining(seconds);
    store.setQuestionStartTime(Date.now());
    perQuestionTimerRef.current = setInterval(() => {
      const current = useQuizStore.getState().timeRemaining;
      if (current <= 1) {
        clearTimer();
        store.setTimeRemaining(0);
        const { questions, currentIndex } = useQuizStore.getState();
        if (currentIndex < questions.length - 1) {
          store.setCurrentIndex(currentIndex + 1);
          store.setTimeRemaining(seconds);
          store.setQuestionStartTime(Date.now());
          startPerQuestionTimer(seconds);
        } else {
          store.setState('finished');
        }
        return;
      }
      store.setTimeRemaining(current - 1);
    }, 1000);
  }, [clearTimer, store]);

  const startQuiz = useCallback(async (quizId: string, subjectId?: string) => {
    store.reset();
    responsesRef.current = [];
    scoringProfileRef.current = null;
    sessionIdRef.current = null;
    hasSubmittedRef.current = false;
    store.setState('loading');
    try {
      const supabase = createClient();

      const { data: quiz } = await supabase
        .from('quizzes')
      .select('id, title, type, exam_id, subject_id, topic_id, scoring_profile_id, duration_seconds, per_question_seconds, question_count, pyq_year, live_at, created_at, scoring_profile:quiz_scoring_profiles(*)')
      .eq('id', quizId)
        .single();

      if (quiz?.scoring_profile) {
        scoringProfileRef.current = quiz.scoring_profile as unknown as ScoringProfile;
      }

      const { data: quizQuestions } = await supabase
        .from('quiz_questions')
        .select('id, quiz_id, question_id, order_index, questions(id, questionText, question, option_a, option_b, option_c, option_d, difficulty, topic, category, correctAnswers, options, subject_id, exam_id)')
        .eq('quiz_id', quizId)
        .order('order_index');

      let rawQuestions: Record<string, unknown>[] = [];

      if (quizQuestions?.length) {
        const qs = quizQuestions as unknown as { questions: Record<string, unknown> }[];
        rawQuestions = qs.map((qq) => qq.questions);
      } else if (quiz) {
        const examId = quiz.exam_id as string;
        const count = (quiz.question_count as number) || 10;
        let baseQuery = supabase
          .from('questions')
          .select('id, questionText, question, option_a, option_b, option_c, option_d, difficulty, topic, category, correctAnswers, options, subject_id, exam_id')
          .eq('archived', false);

        if (quiz.type === 'pyq') {
          baseQuery = baseQuery.eq('is_pyq', true).is('mock_test_id', null);
          if (quiz.pyq_year) baseQuery = baseQuery.eq('pyq_year', quiz.pyq_year);
        } else if (['quiz', 'topicwise', 'rapid_fire', 'daily'].includes(quiz.type as string)) {
          baseQuery = baseQuery.is('mock_test_id', null).eq('is_pyq', false).eq('quiz_pool_status', 'available');
        } else {
          baseQuery = baseQuery.is('mock_test_id', null).eq('is_pyq', false);
        }

        baseQuery = baseQuery.eq('exam_id', examId).limit(count);
        if (subjectId) baseQuery = baseQuery.eq('subject_id', subjectId);
        if (quiz.subject_id) baseQuery = baseQuery.eq('subject_id', quiz.subject_id);
        if (quiz.topic_id) baseQuery = baseQuery.eq('topic_id', quiz.topic_id);

        const { data: randomQ } = await baseQuery;
        if (randomQ?.length) {
          const shuffled = [...randomQ].sort(() => Math.random() - 0.5);
          rawQuestions = shuffled.slice(0, count) as Record<string, unknown>[];
        }
      }

      if (!rawQuestions.length) {
        store.setState('idle');
        return;
      }

      const questions: QuestionWithStatus[] = rawQuestions.map((q) => {
        const correctAnswers = (q.correctAnswers as string[]) ?? [String(q.correct)];
        const category = (q.category as 'I' | 'II') ?? 'I';
        return {
          id: String(q.id),
          question: String(q.questionText ?? q.question),
          options: [
            { label: 'A', text: String((q.options as Record<string, string>)?.A ?? q.option_a ?? '') },
            { label: 'B', text: String((q.options as Record<string, string>)?.B ?? q.option_b ?? '') },
            { label: 'C', text: String((q.options as Record<string, string>)?.C ?? q.option_c ?? '') },
            { label: 'D', text: String((q.options as Record<string, string>)?.D ?? q.option_d ?? '') },
          ],
          correctAnswers,
          category,
          explanation: String(q.explanation ?? ''),
          difficulty: String(q.difficulty ?? '') as 'easy' | 'medium' | 'hard',
          topic: String(q.topic ?? ''),
        };
      });

      const totalDuration = (quiz?.duration_seconds as number) || 600;
      const perQuestionSeconds = quiz?.per_question_seconds as number | null;
      const timePerQ = perQuestionSeconds ?? Math.max(15, Math.floor(totalDuration / questions.length));

      store.setQuestions(questions);
      store.setTimePerQuestion(timePerQ);
      store.setPerQuestionSeconds(perQuestionSeconds);
      store.setStartTime(Date.now());
      store.setQuestionStartTime(Date.now());
      store.setState('active');

      if (user) {
        const maxScore = scoringProfileRef.current
          ? questions.length * Number(scoringProfileRef.current.marks_correct)
          : questions.length;
        const { data: session } = await supabase
          .from('quiz_sessions')
          .insert({
            quiz_id: quizId,
            user_id: user.id,
            total_questions: questions.length,
            max_score: maxScore,
          })
          .select()
          .single();
        if (session) {
          sessionIdRef.current = session.id;
        }
      }

      if (perQuestionSeconds) {
        startPerQuestionTimer(perQuestionSeconds);
      } else {
        startTimer(totalDuration);
      }
    } catch (err) {
      console.error('Failed to start quiz:', err);
      store.setState('idle');
    }
  }, [store, startTimer, startPerQuestionTimer]);

  const submitAnswer = useCallback(async (selected: string | string[] | null) => {
    if (hasSubmittedRef.current) return;
    const { questions, currentIndex, questionStartTime } = useQuizStore.getState();
    const q = questions[currentIndex];
    if (!q || q.answered) return;

    hasSubmittedRef.current = true;
    const timeMs = Date.now() - (questionStartTime || useQuizStore.getState().startTime);

    let isCorrect = false;
    if (q.category === 'I') {
      isCorrect = selected === q.correctAnswers[0];
    } else if (q.category === 'II') {
      const selArr = selected as string[];
      isCorrect = selArr?.length > 0 && !selArr.some(s => !q.correctAnswers.includes(s));
    }

    store.addAnswer(q.id, { selected, isCorrect, timeMs });
    responsesRef.current.push({ selected, category: q.category });

    const updated = [...useQuizStore.getState().questions];
    const safeSelected = selected ?? undefined;
    updated[currentIndex] = { ...updated[currentIndex], answered: true, selected: safeSelected, isCorrect };
    store.setQuestions(updated);

    if (user) {
      try {
        const supabase = createClient();
        let marksAwarded: number | undefined;

        if (scoringProfileRef.current) {
          marksAwarded = calculateScoring(isCorrect, scoringProfileRef.current);
        } else {
          marksAwarded = isCorrect ? 1.0 : -0.25;
        }

        await supabase.from('attempts').insert({
          user_id: user.id,
          question_id: q.id,
          selected_option: Array.isArray(selected) ? selected.join(',') : selected,
          is_correct: isCorrect,
          time_taken_ms: timeMs,
        });

        if (sessionIdRef.current) {
          await supabase.from('session_answers').insert({
            session_id: sessionIdRef.current,
            question_id: q.id,
            order_index: currentIndex,
            selected_option: Array.isArray(selected) ? selected.join(',') : selected,
            is_correct: isCorrect,
            marks_awarded: marksAwarded,
            time_taken_ms: timeMs,
            answered_at: new Date().toISOString(),
          });
        }

        const { data: explanationData } = await supabase
          .from('questions')
          .select('explanation')
          .eq('id', q.id)
          .single();
        if (explanationData?.explanation) {
          const questionsWithExplanation = [...useQuizStore.getState().questions];
          questionsWithExplanation[currentIndex] = {
            ...questionsWithExplanation[currentIndex],
            explanation: explanationData.explanation,
          };
          store.setQuestions(questionsWithExplanation);
        }
      } catch {}
    }

    hasSubmittedRef.current = false;
  }, [store, user]);

  const nextQuestion = useCallback(() => {
    const { questions, currentIndex, perQuestionSeconds } = useQuizStore.getState();
    if (currentIndex < questions.length - 1) {
      store.setCurrentIndex(currentIndex + 1);
      store.setQuestionStartTime(Date.now());
      hasSubmittedRef.current = false;

      if (perQuestionSeconds) {
        startPerQuestionTimer(perQuestionSeconds);
      }
    } else {
      const { questions: qs, answers } = useQuizStore.getState();
      const catQ = qs.map(q => ({ category: q.category, correctAnswers: q.correctAnswers }));
      const respItems = qs.map(q => {
        const a = answers[q.id];
        return { selected: a?.selected ?? null, category: q.category };
      });
      const marksData = calculateMarksV2(respItems, catQ);
      store.setMarksData(marksData);

      if (sessionIdRef.current) {
        const { marksEarned, correct, wrong, skipped } = marksData;
        const supabase = createClient();
        supabase.from('quiz_sessions').update({
          submitted_at: new Date().toISOString(),
          time_taken_ms: Date.now() - useQuizStore.getState().startTime,
          score: marksEarned,
          correct_count: correct,
          wrong_count: wrong,
          attempted_count: correct + wrong,
          status: 'submitted',
        }).eq('id', sessionIdRef.current).then(() => {}, () => {});
      }

      store.setState('finished');
    }
  }, [store, startPerQuestionTimer]);

  const finishQuiz = useCallback(async () => {
    clearTimer();
    const { questions, answers } = useQuizStore.getState();
    const catQ = questions.map(q => ({ category: q.category, correctAnswers: q.correctAnswers }));
    const respItems = questions.map(q => {
      const a = answers[q.id];
      return { selected: a?.selected ?? null, category: q.category };
    });
    const marksData = calculateMarksV2(respItems, catQ);
    store.setMarksData(marksData);

    if (sessionIdRef.current) {
      const supabase = createClient();
      await supabase.from('quiz_sessions').update({
        submitted_at: new Date().toISOString(),
        time_taken_ms: Date.now() - useQuizStore.getState().startTime,
        score: marksData.marksEarned,
        correct_count: marksData.correct,
        wrong_count: marksData.wrong,
        attempted_count: marksData.correct + marksData.wrong,
        status: 'submitted',
      }).eq('id', sessionIdRef.current);
    }

    store.setState('finished');

    if (user) {
      try {
        const { marksEarned, totalMarks } = useQuizStore.getState();
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('totalmarksearned, totalquestionsattempted, totalcorrect, totalwrong, totalskipped')
          .eq('id', user.id)
          .single();
        if (profile) {
          const p = profile as Record<string, number>;
          await supabase
            .from('profiles')
            .update({
              totalmarksearned: (p.totalmarksearned ?? 0) + marksEarned,
              totalquestionsattempted: (p.totalquestionsattempted ?? 0) + totalMarks,
              totalcorrect: (p.totalcorrect ?? 0) + marksData.correct,
              totalwrong: (p.totalwrong ?? 0) + marksData.wrong,
              totalskipped: (p.totalskipped ?? 0) + marksData.skipped,
            })
            .eq('id', user.id);
        }
      } catch {}
    }
  }, [clearTimer, store, user]);

  useEffect(() => {
    return () => {
      clearTimer();
      hasSubmittedRef.current = false;
    };
  }, [clearTimer]);

  return {
    ...store,
    startQuiz,
    startTimer,
    submitAnswer,
    nextQuestion,
    finishQuiz,
    scoringProfile: scoringProfileRef.current,
    sessionId: sessionIdRef.current,
    currentQuestion: store.questions[store.currentIndex],
  };
}
