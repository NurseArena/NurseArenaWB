'use client';
import { AlertTriangle, Info } from 'lucide-react';

interface LateJoinBannerProps {
  currentIndex: number;
  totalQuestions: number;
  readOnly?: boolean;
}

export function LateJoinBanner({ currentIndex, totalQuestions, readOnly }: LateJoinBannerProps) {
  return (
    <div className={`p-4 rounded-xl flex items-start gap-3 ${readOnly ? 'bg-warning/10 border border-warning/20' : 'bg-primary/10 border border-primary/20'}`}>
      {readOnly ? (
        <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
      ) : (
        <Info size={20} className="text-primary shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-sm font-bold text-ink">
          {readOnly
            ? 'Quiz is almost over — you can observe but cannot submit answers.'
            : `You joined late! You're at question ${currentIndex + 1} of ${totalQuestions}.`}
        </p>
        <p className="text-xs text-ink-muted mt-1">
          {readOnly
            ? 'Answers submitted before you joined are marked as skipped (0 points).'
            : 'Previous questions are marked as skipped to keep the leaderboard fair.'}
        </p>
      </div>
    </div>
  );
}
