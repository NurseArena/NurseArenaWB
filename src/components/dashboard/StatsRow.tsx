'use client';
import { Target, Zap, Trophy, TrendingUp } from 'lucide-react';

interface StatsRowProps {
  accuracy?: number;
  rank?: number;
  streak?: number;
  xpMultiplier?: number;
}

export function StatsRow({ accuracy = 0, rank = 0, streak = 0, xpMultiplier = 1 }: StatsRowProps) {
  const stats = [
    { icon: Target, label: 'Accuracy', value: `${accuracy}%`, color: 'text-primary', border: 'border-t-primary' },
    { icon: Trophy, label: 'Rank', value: `#${rank}`, color: 'text-accent', border: 'border-t-accent' },
    { icon: Zap, label: 'Streak', value: `${streak}d`, color: 'text-warning', border: 'border-t-warning' },
    { icon: TrendingUp, label: 'XP Boost', value: `${xpMultiplier}x`, color: 'text-highlight', border: 'border-t-highlight' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className={`bg-surface border border-border rounded-2xl p-4 shadow-card border-t-2 ${stat.border}`}>
          <div className={`${stat.color} mb-2`}>
            <stat.icon size={20} />
          </div>
          <span className="text-2xl font-bold text-ink block">{stat.value}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted/60">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
