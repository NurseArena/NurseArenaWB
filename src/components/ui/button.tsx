'use client';
import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20',
  secondary: 'bg-surface2 text-ink border border-border hover:bg-border',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface2',
  danger: 'bg-danger text-white hover:brightness-110',
  outline: 'border-2 border-primary text-primary hover:bg-primary/5',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
