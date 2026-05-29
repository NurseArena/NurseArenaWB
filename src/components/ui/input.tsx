import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
