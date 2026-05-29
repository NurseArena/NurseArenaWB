'use client';
import { useXP } from '@/hooks/useXP';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface SpeedSeekerBadgeProps {
  className?: string;
}

export function SpeedSeekerBadge({ className }: SpeedSeekerBadgeProps) {
  const { currentTier } = useXP();

  if (currentTier.tier < 2) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30',
        className
      )}
    >
      <Zap size={12} className="fill-amber-500 text-amber-500" />
      Speed Seeker
    </div>
  );
}
