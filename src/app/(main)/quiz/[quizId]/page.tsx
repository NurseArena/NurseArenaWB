'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuiz } from '@/hooks/useQuiz';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { QuizProgress } from '@/components/quiz/QuizProgress';
import { ExplanationPanel } from '@/components/quiz/ExplanationPanel';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuizSessionPage() {
  const params = useParams();
  const router = useRouter();
  const {
    state,
    currentQuestion,
    currentIndex,
    questions,
    answers,
    marksEarned,
    totalMarks,
    correct,
    wrong,
    skipped,
    negativePenalty,
    timeRemaining,
    timePerQuestion,
    startQuiz,
    startTimer,
    submitAnswer,
    nextQuestion,
  } = useQuiz();

  useEffect(() => {
    if (params.quizId && typeof params.quizId === 'string') {
      startQuiz(params.quizId);
    }
  }, [params.quizId, startQuiz]);

  useEffect(() => {
    if (state === 'active' && questions.length > 0) {
      startTimer(timePerQuestion);
    }
  }, [state, questions.length, startTimer, timePerQuestion]);

  useEffect(() => {
    if (state === 'finished') {
      router.push(`/quiz/result?marksEarned=${marksEarned}&totalMarks=${totalMarks}&correct=${correct}&wrong=${wrong}&skipped=${skipped}&negativePenalty=${negativePenalty}`);
    }
  }, [state, router, marksEarned, totalMarks, correct, wrong, skipped, negativePenalty]);

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-muted italic">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (state === 'idle' || !currentQuestion) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-muted italic">No questions found</p>
      </div>
    );
  }

  const answered = answers[currentQuestion.id];
  const accuracy = Object.keys(answers).length > 0
    ? Math.round((Object.values(answers).filter((a) => a.isCorrect).length / Object.keys(answers).length) * 100)
    : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      {state === 'active' && (
        <>
          <QuizProgress current={currentIndex} total={questions.length} accuracy={accuracy} />

          <div className="flex justify-center my-8">
            <QuizTimer
              timeRemaining={timeRemaining}
              duration={timePerQuestion}
              onTimeUp={() => {
                if (!answered) {
                  submitAnswer(null);
                  nextQuestion();
                }
              }}
            />
          </div>

          <QuizCard
            question={currentQuestion}
            selected={typeof answered?.selected === 'string' ? answered.selected : undefined}
            onSelect={submitAnswer}
            showResult={!!answered}
          />

          {answered && (
            <div className="mt-6 space-y-4">
              <ExplanationPanel
                explanation={currentQuestion.explanation}
                correct={currentQuestion.correctAnswers}
                selected={answered.selected}
              />
              <Button className="w-full" size="lg" onClick={nextQuestion}>
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight size={18} />
                  </>
                ) : (
                  'See Results'
                )}
              </Button>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <span className="text-xs text-ink-muted">
              Correct: {correct} / {questions.length}
            </span>
          </div>
        </>
      )}

      {state === 'reviewing' && answered && (
        <div className="space-y-4">
          <QuizCard
            question={currentQuestion}
            selected={typeof answered.selected === 'string' ? answered.selected : undefined}
            onSelect={() => {}}
            showResult
          />
          <ExplanationPanel
            explanation={currentQuestion.explanation}
            correct={currentQuestion.correctAnswers}
            selected={answered.selected}
          />
          <Button variant="secondary" className="w-full" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      )}
    </motion.div>
  );
}

