'use client';
import { useExam } from '@/hooks/useExam';
import { cn } from '@/lib/utils';

interface ExamBadgeProps {
  className?: string;
}

export function ExamBadge({ className }: ExamBadgeProps) {
  const { examName, examColor } = useExam();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold',
        className
      )}
      style={{ backgroundColor: examColor + '15', color: examColor }}
    >
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: examColor }} />
      {examName}
    </div>
  );
}
