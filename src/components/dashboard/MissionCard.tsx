'use client';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Mission } from '@/types/user';

interface MissionCardProps {
  mission: Mission & { progress?: number; completed?: boolean };
}

export function MissionCard({ mission }: MissionCardProps) {
  const progress = mission.progress ?? 0;
  const completed = mission.completed ?? false;
  const progressPercent = Math.min((progress / mission.condition_value) * 100, 100);

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        completed
          ? 'bg-success/5 border-success/20'
          : 'bg-surface border-border hover:border-primary/30'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {completed ? (
            <CheckCircle2 size={22} className="text-success shrink-0" />
          ) : (
            <Circle size={22} className="text-ink-muted/40 shrink-0" />
          )}
          <div>
            <span
              className={cn(
                'text-sm block',
                completed ? 'text-ink-muted line-through' : 'text-ink font-medium'
              )}
            >
              {mission.title}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted/60">
              {mission.condition_type.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <span className={cn('text-sm font-bold', completed ? 'text-success' : 'text-primary')}>
          +{mission.xp_reward}
        </span>
      </div>

      {!completed && (
        <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {!completed && (
        <p className="text-[10px] text-ink-muted mt-2">
          {progress} / {mission.condition_value}
        </p>
      )}
    </div>
  );
}
