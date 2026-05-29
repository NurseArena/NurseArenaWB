'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface QuizTimerProps {
  timeRemaining: number;
  duration: number;
  onTimeUp?: () => void;
}

export function QuizTimer({ timeRemaining, duration, onTimeUp }: QuizTimerProps) {
  const [pulseTick, setPulseTick] = useState(0);
  const percentage = (timeRemaining / duration) * 100;
  const isLow = timeRemaining <= 10;

  useEffect(() => {
    if (!isLow) return;
    const interval = setInterval(() => setPulseTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, [isLow]);

  useEffect(() => {
    if (timeRemaining <= 0 && onTimeUp) onTimeUp();
  }, [timeRemaining, onTimeUp]);

  const pulse = isLow && pulseTick % 2 === 1;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-border" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="currentColor"
            className={cn(
              'transition-all duration-1000 ease-linear',
              isLow ? 'text-danger' : 'text-primary'
            )}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums',
              pulse && 'scale-110',
              isLow ? 'text-danger text-lg' : 'text-ink text-base'
            )}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
        {isLow ? 'Hurry!' : 'Time Left'}
      </span>
    </div>
  );
}
