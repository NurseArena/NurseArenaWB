'use client';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import type { QuestionWithStatus } from '@/types/quiz';

interface QuizCardProps {
  question: QuestionWithStatus;
  selected?: string;
  onSelect: (label: string) => void;
  showResult?: boolean;
}

const correctAnim: TargetAndTransition = {
  scale: [1, 1.06, 1],
  transition: { duration: 0.4, ease: 'easeOut' },
};

const wrongAnim: TargetAndTransition = {
  x: [0, -6, 6, -6, 6, 0],
  transition: { duration: 0.45 },
};

export function QuizCard({ question, selected, onSelect, showResult }: QuizCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2">
          {question.topic && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {question.topic}
            </span>
          )}
          {question.difficulty && (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                question.difficulty === 'easy'
                  ? 'text-success'
                  : question.difficulty === 'medium'
                    ? 'text-warning'
                    : 'text-danger'
              }`}
            >
              {question.difficulty}
            </span>
          )}
        </div>

        <p className="text-xl font-semibold text-ink leading-relaxed">
          {question.question}
        </p>

        <div className="space-y-3">
          {question.options.map((opt) => {
            const isSelected = selected === opt.label;
            const isCorrect = showResult && question.correctAnswers.includes(opt.label);
            const isWrong = showResult && isSelected && !question.correctAnswers.includes(opt.label);

            return (
              <motion.button
                key={opt.label}
                onClick={() => !showResult && onSelect(opt.label)}
                disabled={showResult}
                animate={isCorrect ? correctAnim : isWrong ? wrongAnim : {}}
                whileTap={!showResult ? { scale: 0.97 } : undefined}
                className={`w-full text-left p-4 rounded-xl border-2 flex items-center justify-between
                  ${isCorrect ? 'border-success bg-success/5' : ''}
                  ${isWrong ? 'border-danger bg-danger/5' : ''}
                  ${isSelected && !isCorrect && !isWrong ? 'border-primary bg-primary/5' : ''}
                  ${!isSelected && !isCorrect && !isWrong ? 'border-border bg-surface hover:border-primary/50' : ''}
                  ${showResult ? 'cursor-default' : 'cursor-pointer'}
                `}
                style={isCorrect ? { boxShadow: '0 0 20px rgba(34,197,94,0.35)' } : undefined}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                      ${isCorrect ? 'bg-success text-white' : ''}
                      ${isWrong ? 'bg-danger text-white' : ''}
                      ${isSelected && !isCorrect && !isWrong ? 'bg-primary text-white' : ''}
                      ${!isSelected && !isCorrect && !isWrong ? 'bg-surface2 text-ink-muted' : ''}
                    `}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={`text-sm ${
                      isCorrect
                        ? 'text-success font-medium'
                        : isWrong
                          ? 'text-danger font-medium'
                          : 'text-ink'
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>
                <AnimatePresence>
                  {isCorrect && (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="w-6 h-6 rounded-full bg-success flex items-center justify-center"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
