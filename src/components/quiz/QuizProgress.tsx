'use client';
import { cn } from '@/lib/utils';

interface QuizProgressProps {
  current: number;
  total: number;
  accuracy?: number;
}

export function QuizProgress({ current, total, accuracy }: QuizProgressProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">
            Question
          </span>
          <span className="text-sm font-bold text-ink">
            {current + 1}
            <span className="text-ink-muted/50">/{total}</span>
          </span>
        </div>
        {accuracy !== undefined && (
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              Accuracy
            </span>
            <span
              className={cn(
                'ml-2 text-sm font-bold',
                accuracy >= 80 ? 'text-success' : accuracy >= 50 ? 'text-warning' : 'text-danger'
              )}
            >
              {accuracy}%
            </span>
          </div>
        )}
      </div>
      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
