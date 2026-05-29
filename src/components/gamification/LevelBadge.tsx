'use client';
import { useXP } from '@/hooks/useXP';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  className?: string;
}

export function LevelBadge({ className }: LevelBadgeProps) {
  const { marks, currentTier } = useXP();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20',
        className
      )}
    >
      <Zap size={16} />
      <span className="text-xs font-bold">
        {marks.toFixed(1)} marks · Tier {currentTier.tier}
      </span>
    </div>
  );
}
