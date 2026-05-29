'use client';
import { cn } from '@/lib/utils';
import type { LeaderboardRow } from '@/types/leaderboard';

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
}

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  if (!rows.length) {
    return (
      <div className="text-center py-12 text-ink-muted italic">
        No entries yet. Start practicing to climb the ranks!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[40px_1fr_80px_80px] gap-4 px-4 py-2 text-ink-muted text-[10px] font-bold uppercase tracking-widest opacity-50">
        <span>Rank</span>
        <span>Student</span>
        <span className="text-right">Marks</span>
        <span className="text-right">%</span>
      </div>

      {rows.map((row) => (
        <div
          key={row.userId + row.rank}
          className={cn(
            'grid grid-cols-[40px_1fr_80px_80px] gap-4 px-4 py-3 rounded-xl items-center transition-all',
            row.isCurrentUser
              ? 'bg-primary/5 border border-primary/20'
              : 'bg-surface border border-border hover:bg-surface2'
          )}
        >
          <span
            className={cn(
              'font-black text-sm',
              row.rank <= 3 ? 'text-primary' : 'text-ink-muted'
            )}
          >
            #{row.rank}
          </span>

          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {row.name[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-ink">{row.name}</span>
            </div>
          </div>

          <span className="font-bold text-sm text-right text-ink">{row.marksEarned.toFixed(1)}</span>
          <span className="text-xs font-bold text-right text-primary">{row.percentage}%</span>
        </div>
      ))}
    </div>
  );
}
