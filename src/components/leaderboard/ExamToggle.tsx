'use client';
import { cn } from '@/lib/utils';

interface ExamToggleProps {
  tabs: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
}

export function ExamToggle({ tabs, active, onChange }: ExamToggleProps) {
  return (
    <div className="inline-flex bg-surface2 rounded-xl p-1 border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
            active === tab.value
              ? 'bg-surface text-primary shadow-card'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
