import { cn } from '@/lib/utils';
import type { LabelHTMLAttributes } from 'react';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-xs font-bold uppercase tracking-widest text-ink-muted', className)}
      {...props}
    />
  );
}
