'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useExam } from '@/hooks/useExam';
import { useLiveQuiz } from '@/hooks/useLiveQuiz';
import { useAuthStore } from '@/store/authStore';
import { LiveQuizRoom } from '@/components/liveQuiz/LiveQuizRoom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Clock, CalendarDays } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';


export default function LiveQuizPage() {
  const { activeExam } = useExam();
  const { upcomingQuizzes, fetchUpcoming, joinQuiz, submitAnswer, leaderboard, quizState, marksEarned, correctCount, joinedLate, canSubmit, activeQuiz } = useLiveQuiz();
  const user = useAuthStore((s) => s.user);
  const [selectedOption, setSelectedOption] = useState<string | undefined>();

  const [examDbId, setExamDbId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('exams')
      .select('id')
      .eq('code', activeExam.replace(/_/g, '-'))
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        if (data?.id) setExamDbId(data.id);
      });
  }, [activeExam]);

  useEffect(() => {
    if (examDbId) fetchUpcoming(examDbId);
  }, [examDbId, fetchUpcoming]);

  const handleJoin = async (quizId: number) => {
    await joinQuiz(quizId);
  };

  const handleSelectAnswer = (option: string) => {
    setSelectedOption(option);
    if (activeQuiz) {
      submitAnswer(option, activeQuiz.current_q_index);
    }
  };

  const myEntry = leaderboard.find(e => e.userId === user?.id);

  if (activeQuiz && quizState !== 'waiting') {
    return (
      <LiveQuizRoom
        currentQuestion={null}
        questionIndex={activeQuiz?.current_q_index ?? 0}
        totalQuestions={20}
        timeRemainingMs={30000}
        marksEarned={myEntry?.marksEarned ?? marksEarned}
        correctCount={correctCount}
        joinedLate={joinedLate}
        canSubmit={canSubmit}
        leaderboard={leaderboard}
        quizState={quizState}
        onSelectAnswer={handleSelectAnswer}
        selectedOption={selectedOption}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Live Quiz</h1>
        <p className="text-sm text-ink-muted mt-1">Compete in real-time at 9 PM</p>
      </div>

      {upcomingQuizzes.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Radio size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-ink">No Live Quiz Now</h1>
          <p className="text-ink-muted">The next live quiz is at 9 PM tonight</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingQuizzes.map((quiz) => {
            const quizCountdown = getCountdown(quiz.starts_at);
            const isLive = !quizCountdown;
            return (
              <Card key={quiz.id} className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {isLive ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest text-danger">LIVE</span>
                    </>
                  ) : (
                    <Badge variant="warning">Scheduled</Badge>
                  )}
                  <Badge variant="default">{quiz.duration_min} min</Badge>
                </div>

                <h2 className="text-xl font-bold text-ink mb-4">
                  {`Live Quiz - ${new Date(quiz.starts_at).toLocaleDateString()}`}
                </h2>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-ink-muted">
                    <CalendarDays size={16} />
                    {new Date(quiz.starts_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-muted">
                    <Clock size={16} />
                    9:00 PM
                  </div>
                </div>

                {!isLive && quizCountdown && (
                  <div className="flex items-center gap-4 mb-6 p-4 bg-surface2 rounded-xl">
                    <div className="text-center">
                      <span className="text-xl font-bold text-ink tabular-nums">{quizCountdown.hours.toString().padStart(2, '0')}</span>
                      <p className="text-[10px] text-ink-muted uppercase">Hrs</p>
                    </div>
                    <span className="text-xl text-ink-muted">:</span>
                    <div className="text-center">
                      <span className="text-xl font-bold text-ink tabular-nums">{quizCountdown.minutes.toString().padStart(2, '0')}</span>
                      <p className="text-[10px] text-ink-muted uppercase">Min</p>
                    </div>
                    <span className="text-xl text-ink-muted">:</span>
                    <div className="text-center">
                      <span className="text-xl font-bold text-ink tabular-nums">{quizCountdown.seconds.toString().padStart(2, '0')}</span>
                      <p className="text-[10px] text-ink-muted uppercase">Sec</p>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => handleJoin(Number(quiz.id))}
                  disabled={!isLive}
                >
                  {isLive ? 'Join Now' : 'Not Yet Open'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function getCountdown(startsAt: string) {
  const diff = new Date(startsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}
