'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, RotateCcw, Trophy, CheckCircle2 } from 'lucide-react';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const marksEarned = parseFloat(searchParams.get('marksEarned') ?? '0');
  const totalMarks = parseFloat(searchParams.get('totalMarks') ?? '0');
  const correct = parseInt(searchParams.get('correct') ?? '0');
  const wrong = parseInt(searchParams.get('wrong') ?? '0');
  const skipped = parseInt(searchParams.get('skipped') ?? '0');
  const negativePenalty = parseFloat(searchParams.get('negativePenalty') ?? '0');
  const percentage = totalMarks > 0 ? Math.round((marksEarned / totalMarks) * 100) : 0;
  const isPerfect = percentage >= 100;
  const isGood = percentage >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto space-y-8 pt-10"
    >
      <div className="text-center">
        <div
          className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isPerfect || isGood
              ? 'bg-success/10 text-success'
              : 'bg-warning/10 text-warning'
          }`}
        >
          {isPerfect || isGood ? (
            <Trophy size={48} />
          ) : (
            <CheckCircle2 size={48} />
          )}
        </div>
        <h1 className="text-3xl font-bold text-ink">
          {isPerfect ? 'Perfect Score!' : isGood ? 'Great Job!' : 'Keep Practicing!'}
        </h1>
        <p className="text-ink-muted mt-2">
          {isPerfect
            ? 'You nailed every question!'
            : isGood
              ? "You're doing great!"
              : "You'll do better next time"}
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-ink">{marksEarned.toFixed(1)} / {totalMarks}</p>
          <p className="text-lg font-bold text-primary">{percentage}%</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-success">{correct}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Correct</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-danger">{wrong}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Wrong</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-muted">{skipped}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Skipped</p>
          </div>
        </div>
        {negativePenalty > 0 && (
          <div className="text-center">
            <p className="text-sm text-danger">Negative Penalty: -{negativePenalty.toFixed(2)} marks</p>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => router.push('/dashboard')}>
          <Home size={18} />
          Dashboard
        </Button>
        <Button className="flex-1" onClick={() => router.back()}>
          <RotateCcw size={18} />
          Try Again
        </Button>
      </div>
    </motion.div>
  );
}

export default function QuizResultPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto pt-10 text-center text-ink-muted">Loading result...</div>}>
      <ResultContent />
    </Suspense>
  );
}
