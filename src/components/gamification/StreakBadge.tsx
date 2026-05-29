'use client';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, className, size = 'md' }: StreakBadgeProps) {
  const sizes = {
    sm: { icon: 16, text: 'text-xs', container: 'px-2.5 py-1' },
    md: { icon: 20, text: 'text-sm', container: 'px-3 py-1.5' },
    lg: { icon: 24, text: 'text-lg', container: 'px-4 py-2' },
  };

  const s = sizes[size];

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20',
        s.container,
        className
      )}
    >
      <motion.div
        animate={streak > 0 ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
      >
        <Flame
          size={s.icon}
          className={streak > 0 ? 'fill-primary' : ''}
        />
      </motion.div>
      <span className={s.text}>{streak}</span>
    </motion.div>
  );
}
