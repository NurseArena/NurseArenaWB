'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplanationPanelProps {
  explanation?: string;
  correct: string | string[];
  selected: string | string[] | null;
}

export function ExplanationPanel({ explanation, correct, selected }: ExplanationPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const correctArr = Array.isArray(correct) ? correct : [correct];
  const selectedArr = Array.isArray(selected) ? selected : selected ? [selected] : [];
  const isCorrect = selectedArr.length > 0 && correctArr.length === selectedArr.length && correctArr.every(c => selectedArr.includes(c));

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 transition-colors hover:bg-surface2"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isCorrect ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            )}
          >
            <Lightbulb size={18} />
          </div>
          <div className="text-left">
            <span
              className={cn(
                'text-sm font-bold',
                isCorrect ? 'text-success' : 'text-danger'
              )}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
            <p className="text-xs text-ink-muted">
              Correct answer: <span className="font-bold text-ink">{correctArr.join(', ')}</span>
            </p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && explanation && (
        <div className="px-4 pb-4 pt-0">
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm text-ink-muted leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
