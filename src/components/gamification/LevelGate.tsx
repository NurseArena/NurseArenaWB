'use client';
import { useXP } from '@/hooks/useXP';
import { RAPID_FIRE_TIERS } from '@/lib/xp';
import { Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarksGateProps {
  marksMilestone: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLock?: boolean;
  className?: string;
}

export function LevelGate({ marksMilestone, children, fallback, showLock = true, className }: MarksGateProps) {
  const { marks } = useXP();
  const unlocked = marks >= marksMilestone;
  const tier = RAPID_FIRE_TIERS.find(t => t.marksMilestone === marksMilestone);

  if (unlocked) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none opacity-30">
        {children}
      </div>
      {showLock && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center">
            <Lock size={24} className="text-ink-muted" />
          </div>
          <p className="text-sm font-bold text-ink-muted">{marksMilestone} Marks Required</p>
          <p className="text-xs text-ink-muted/60 flex items-center gap-1">
            <Zap size={12} />
            {tier ? `Tier ${tier.tier}: ${tier.name}` : 'Keep practicing to unlock'}
          </p>
        </div>
      )}
    </div>
  );
}
