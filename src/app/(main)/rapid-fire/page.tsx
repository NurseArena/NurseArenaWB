'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useExam } from '@/hooks/useExam';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Zap, SkipForward, Home, Lock, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getRapidFireTier, RAPID_FIRE_TIERS } from '@/lib/xp';
import type { Question } from '@/types/exam';
import type { QuestionWithStatus } from '@/types/quiz';

export default function RapidFirePage() {
  const [phase, setPhase] = useState<'start' | 'active' | 'result'>('start');
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answers, setAnswers] = useState<Record<string, { selected: string; isCorrect: boolean }>>({});
  const router = useRouter();
  const { activeExam } = useExam();
  const user = useAuthStore((s) => s.user);
  const handleNextRef = useRef<() => void>(() => {});

  const totalMarks = user?.totalMarksEarned ?? 0;
  const currentTier = getRapidFireTier(totalMarks);
  const currentTimer = currentTier.timerSeconds;

  const q = questions[currentIndex];
  const answered = answers[q?.id];

  const startGame = useCallback(async () => {
    const supabase = createClient();
    const { data: exam } = await supabase.from('exams').select('id').eq('code', activeExam).single();
    if (!exam) return;

    const { data: raw } = await supabase
      .from('questions')
      .select('id, question, option_a, option_b, option_c, option_d, difficulty, topic')
      .eq('exam_id', exam.id);

    if (!raw) return;

    const shuffled = [...raw].sort(() => Math.random() - 0.5).slice(0, 10);
    const mapped: QuestionWithStatus[] = (shuffled as Record<string, unknown>[]).map((rq) => ({
      id: rq.id as string,
      question: rq.question as string,
      options: [
        { label: 'A', text: rq.option_a as string },
        { label: 'B', text: rq.option_b as string },
        { label: 'C', text: rq.option_c as string },
        { label: 'D', text: rq.option_d as string },
      ],
      correctAnswers: [] as string[],
      category: 'I',
      explanation: '',
      difficulty: rq.difficulty as string,
      topic: rq.topic as string,
    }));

    setQuestions(mapped);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(currentTimer);
    setPhase('active');
  }, [activeExam, currentTimer]);

  const handleAnswer = useCallback(async (selected: string) => {
    if (!q || answered) return;
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: q.id,
          selectedOption: selected,
          isCorrect: false,
          timeTakenMs: currentTimer * 1000 - timeLeft * 1000,
        }),
      });
      const data = await res.json();
      if (data.attempt) {
        setAnswers((a) => ({ ...a, [q.id]: { selected, isCorrect: data.attempt.is_correct } }));
      }
    } catch {
      setAnswers((a) => ({ ...a, [q.id]: { selected, isCorrect: false } }));
    }
  }, [q, answered, currentTimer, timeLeft]);

  const handleNext = useCallback(() => {
    if (!q) return;
    if (!answered) {
      setAnswers((a) => ({ ...a, [q.id]: { selected: '', isCorrect: false } }));
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(currentTimer);
    } else {
      setPhase('result');
    }
  }, [q, answered, currentIndex, questions.length, currentTimer]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    if (phase !== 'active') return;
    if (timeLeft <= 0) {
      handleNextRef.current();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== 'active' || answered) return;
      const keyMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      if (e.key === 'Enter' && answered) handleNextRef.current();
      if (keyMap[e.key]) handleAnswer(keyMap[e.key]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, answered, handleAnswer]);

  const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
  const marksEarned = correctCount * 1.0;
  const totalPossible = questions.length;
  const percentage = totalPossible > 0 ? Math.round((correctCount / totalPossible) * 100) : 0;

  if (phase === 'start') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-warning/10 flex items-center justify-center">
          <Zap size={40} className="text-warning" />
        </div>
        <h1 className="text-4xl font-bold text-ink">Rapid Fire</h1>
        <p className="text-ink-muted max-w-sm">
          10 Questions &middot; {currentTimer} Seconds Each
        </p>
        <div className="bg-surface border border-border rounded-2xl p-4 max-w-sm w-full">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3">Tier Progress</p>
          <div className="space-y-2">
            {RAPID_FIRE_TIERS.map((t) => {
              const unlocked = totalMarks >= t.marksMilestone;
              const isCurrent = t.tier === currentTier.tier;
              return (
                <div
                  key={t.tier}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${
                    unlocked ? 'bg-success/10 text-success' : isCurrent ? 'bg-warning/10 text-warning' : 'bg-surface2 text-ink-muted'
                  }`}
                >
                  <span className="font-bold">
                    {unlocked ? '✓' : isCurrent ? '►' : <Lock size={12} className="inline" />} Tier {t.tier}: {t.name}
                  </span>
                  <span className="text-xs">{t.timerSeconds}s</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-muted mt-2">Total marks earned: {totalMarks}</p>
        </div>
        <p className="text-xs text-ink-muted">Use keys 1-4 to answer, Enter to confirm</p>
        <Button size="lg" onClick={startGame}>
          <Zap size={18} />
          Start Rapid Fire
        </Button>
      </div>
    );
  }

  if (phase === 'active' && q) {
    return (
      <div className="fixed inset-0 bg-bg z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="text-sm font-bold text-ink-muted">
            {currentIndex + 1} / {questions.length}
          </span>
          <span className={`text-2xl font-bold tabular-nums ${timeLeft <= 5 ? 'text-danger animate-pulse' : 'text-ink'}`}>
            {timeLeft}s
          </span>
          <Button variant="ghost" size="sm" onClick={handleNext}>
            Skip <SkipForward size={16} />
          </Button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-6"
            >
              <p className="text-2xl font-semibold text-ink leading-relaxed">{q.question}</p>

              <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt) => {
                  const isSelected = answered?.selected === opt.label;
                  const isCorrect = answered && opt.label === q.correctAnswers[0];
                  const isWrong = answered && isSelected && opt.label !== q.correctAnswers[0];

                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleAnswer(opt.label)}
                      disabled={!!answered}
                      className={`p-4 rounded-xl border-2 text-left font-medium transition-all
                        ${
                          isCorrect
                            ? 'border-success bg-success/5 text-success'
                            : isWrong
                              ? 'border-danger bg-danger/5 text-danger'
                              : isSelected
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border bg-surface text-ink-muted hover:border-primary/50'
                        }
                      `}
                    >
                      <span className="mr-3 font-bold">{opt.label}.</span> {opt.text}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <Button className="w-full" onClick={handleNext}>
                  {currentIndex < questions.length - 1 ? 'Next' : 'See Results'}
                  <SkipForward size={16} />
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t border-border text-center">
          <span className="text-xs text-ink-muted">
            Keys: <kbd className="px-1.5 py-0.5 rounded bg-surface2 text-[10px] font-mono">1</kbd>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-surface2 text-[10px] font-mono">2</kbd>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-surface2 text-[10px] font-mono">3</kbd>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-surface2 text-[10px] font-mono">4</kbd>{' '}
            answer ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-surface2 text-[10px] font-mono">Enter</kbd>{' '}
            confirm
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 pt-20">
      <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${correctCount >= 8 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
        <Zap size={40} />
      </div>
      <h1 className="text-3xl font-bold text-ink">Rapid Fire Complete!</h1>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-3xl font-bold text-ink">{correctCount}/{totalPossible}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Correct</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">{percentage}%</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Accuracy</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-success">+{marksEarned}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Marks</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => router.push('/dashboard')}>
          <Home size={18} /> Dashboard
        </Button>
        <Button className="flex-1" onClick={startGame}>
          <Zap size={18} /> Play Again
        </Button>
      </div>
    </div>
  );
}
