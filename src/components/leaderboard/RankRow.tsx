'use client';
import { cn } from '@/lib/utils';
import type { LeaderboardRow } from '@/types/leaderboard';

interface RankRowProps {
  entry: LeaderboardRow;
}

export function RankRow({ entry }: RankRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[40px_1fr_80px] gap-4 px-4 py-3 rounded-xl items-center transition-all',
        entry.isCurrentUser
          ? 'bg-primary/5 border border-primary/20'
          : 'bg-surface border border-border'
      )}
    >
      <span className={cn('font-black text-sm', entry.rank <= 3 ? 'text-primary' : 'text-ink-muted')}>
        #{entry.rank}
      </span>
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
          {entry.name[0]}
        </div>
        <span className="text-sm font-bold truncate text-ink">{entry.name}</span>
      </div>
      <span className="font-bold text-sm text-right text-ink">{entry.marksEarned.toFixed(1)}</span>
    </div>
  );
}
