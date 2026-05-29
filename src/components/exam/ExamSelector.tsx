'use client';
import { motion } from 'framer-motion';
import { EXAMS, type ExamCode } from '@/lib/exam-config';
import { BookOpen } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';

interface ExamSelectorProps {
  onSelect: (code: ExamCode) => void;
  filterExam?: string;
}

export function ExamSelector({ onSelect, filterExam }: ExamSelectorProps) {
  const exams = Object.entries(EXAMS)
    .filter(([code]) => !filterExam || code.startsWith(filterExam))
    .map(([_, exam]) => exam);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {exams.map((exam) => (
        <motion.button
          key={exam.code}
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(exam.code as ExamCode)}
          className="text-left bg-surface border-2 border-border hover:border-primary/50 rounded-2xl p-6 transition-all shadow-card"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: exam.color + '15' }}
          >
            {exam.code.startsWith('JENPAS') ? (
              <LogoIcon size={28} />
            ) : (
              <BookOpen size={28} style={{ color: exam.color }} />
            )}
          </div>

          <h3 className="text-xl font-bold text-ink mb-1">{exam.name}</h3>
          <p className="text-sm text-ink-muted mb-4">
            {exam.totalQuestions} Q · {Math.floor(exam.durationSeconds / 60)} min · {exam.maxMarks} marks
          </p>

          <div className="space-y-1.5">
            {exam.subjects.map((sub) => (
              <div key={sub.name} className="flex items-center gap-2 text-xs text-ink-muted">
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
                <span className="ml-auto opacity-50">{sub.totalQ} Q</span>
              </div>
            ))}
          </div>

          <div className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-center bg-primary/10 text-primary">
            Select {exam.shortName}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
