'use client';
import { motion } from 'framer-motion';
import { useXP } from '@/hooks/useXP';

export function MarksBar({ showLabel = true }: { showLabel?: boolean }) {
  const { marks, progress, nextMilestone } = useXP();

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              Total Marks
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-ink">{marks.toFixed(1)}</span>
            {nextMilestone > 0 && (
              <span className="text-xs text-ink-muted"> / {marks + nextMilestone}</span>
            )}
          </div>
        </div>
      )}
      <div className="h-2.5 bg-surface2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
        />
      </div>
      {showLabel && nextMilestone > 0 && (
        <p className="text-[10px] text-ink-muted font-medium">
          {nextMilestone} marks to next Rapid Fire tier
        </p>
      )}
    </div>
  );
}
