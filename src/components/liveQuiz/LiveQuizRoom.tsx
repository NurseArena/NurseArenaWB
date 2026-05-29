'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { LateJoinBanner } from './LateJoinBanner';
import { Trophy, Zap, Clock } from 'lucide-react';
import type { QuestionWithStatus, LeaderboardEntry } from '@/types/quiz';
import { cn } from '@/lib/utils';

interface LiveQuizRoomProps {
  currentQuestion: QuestionWithStatus | null;
  questionIndex: number;
  totalQuestions: number;
  timeRemainingMs: number;
  marksEarned: number;
  correctCount: number;
  joinedLate: boolean;
  canSubmit: boolean;
  leaderboard: LeaderboardEntry[];
  quizState: 'waiting' | 'active' | 'reviewing' | 'ended';
  onSelectAnswer: (option: string) => void;
  selectedOption?: string;
}

export function LiveQuizRoom({
  currentQuestion,
  questionIndex,
  totalQuestions,
  timeRemainingMs,
  marksEarned,
  correctCount,
  joinedLate,
  canSubmit,
  leaderboard,
  quizState,
  onSelectAnswer,
  selectedOption,
}: LiveQuizRoomProps) {
  if (quizState === 'waiting') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Clock size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Waiting for the quiz to start...</h2>
          <p className="text-ink-muted">The host will begin shortly</p>
        </div>
      </div>
    );
  }

  if (quizState === 'ended') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
          <Trophy size={40} className="text-accent" />
        </div>
        <h2 className="text-3xl font-bold text-ink">Quiz Complete!</h2>
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
          <Card className="p-4">
            <p className="text-3xl font-bold text-ink">{marksEarned}</p>
            <p className="text-xs text-ink-muted uppercase tracking-widest">Marks</p>
          </Card>
          <Card className="p-4">
            <p className="text-3xl font-bold text-ink">{correctCount}</p>
            <p className="text-xs text-ink-muted uppercase tracking-widest">Correct</p>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {joinedLate && (
        <div className="mb-4">
          <LateJoinBanner currentIndex={questionIndex} totalQuestions={totalQuestions} readOnly={!canSubmit} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="danger">Question {questionIndex + 1} of {totalQuestions}</Badge>
            <div className="flex items-center gap-2 text-sm">
              <Zap size={16} className="text-warning" />
              <span className="font-bold text-ink">{marksEarned} marks</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={questionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <QuizTimer
                    timeRemaining={Math.ceil(timeRemainingMs / 1000)}
                    duration={Math.ceil(timeRemainingMs / 1000)}
                    onTimeUp={() => {}}
                  />
                </Card>

                <Card className="p-6">
                  <p className="text-lg font-medium text-ink mb-6">{currentQuestion.question}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = selectedOption === opt.label;
                      const showCorrect = quizState === 'reviewing' && currentQuestion.correctAnswers.includes(opt.label);
                      const showWrong = quizState === 'reviewing' && isSelected && !currentQuestion.correctAnswers.includes(opt.label);
                      return (
                        <motion.button
                          key={opt.label}
                          onClick={() => canSubmit && onSelectAnswer(opt.label)}
                          disabled={!canSubmit || quizState === 'reviewing'}
                          animate={
                            showCorrect ? { scale: [1, 1.06, 1], transition: { duration: 0.4 } } :
                            showWrong ? { x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.45 } } :
                            {}
                          }
                          whileTap={canSubmit && quizState !== 'reviewing' ? { scale: 0.97 } : undefined}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-xl border-2 text-left',
                            showCorrect ? 'border-success bg-success/5' : '',
                            showWrong ? 'border-danger bg-danger/5' : '',
                            isSelected && !showCorrect && !showWrong ? 'border-primary bg-primary/5' : '',
                            !isSelected && !showCorrect && !showWrong ? 'border-border hover:border-primary/30 bg-surface' : ''
                          )}
                          style={showCorrect ? { boxShadow: '0 0 20px rgba(34,197,94,0.35)' } : undefined}
                        >
                          <span className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                            isSelected && !showCorrect && !showWrong ? 'bg-primary text-white' : 'bg-surface2 text-ink-muted'
                          )}>
                            {opt.label}
                          </span>
                          <span className="text-sm text-ink">{opt.text}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-accent" />
              Leaderboard
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-xl text-sm',
                    entry.rank <= 3 ? 'bg-accent/5' : 'bg-surface2'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                      entry.rank === 1 ? 'bg-accent text-white' :
                      entry.rank === 2 ? 'bg-ink-muted text-white' :
                      entry.rank === 3 ? 'bg-warning text-white' : 'bg-surface2 text-ink-muted'
                    )}>
                      {entry.rank}
                    </span>
                    <span className="text-ink">{entry.name}</span>
                  </div>
                  <span className="font-bold text-ink">{entry.marksEarned.toFixed(1)}</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-xs text-ink-muted italic text-center py-4">Waiting for participants...</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
