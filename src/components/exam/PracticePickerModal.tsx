'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamStore } from '@/store/examStore';
import { useRouter } from 'next/navigation';
import { ArrowRight, X } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { EXAMS } from '@/lib/exam-config';
import { Card } from '@/components/ui/card';

interface PracticePickerModalProps {
  open: boolean;
  onClose: () => void;
  targetExams: string[];
}

export function PracticePickerModal({ open, onClose, targetExams }: PracticePickerModalProps) {
  const setActiveExam = useExamStore((s) => s.setActiveExam);
  const router = useRouter();

  const handleSelect = (code: string) => {
    setActiveExam(code as keyof typeof EXAMS);
    onClose();
    router.push('/subjects');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink">What to practice today?</h2>
                  <p className="text-sm text-ink-muted mt-0.5">You are enrolled in multiple exams — pick one</p>
                </div>
                <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {targetExams.map((code) => {
                  const exam = EXAMS[code as keyof typeof EXAMS];
                  if (!exam) return null;
                  return (
                    <button
                      key={code}
                      onClick={() => handleSelect(code)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-surface hover:border-primary/30 hover:bg-surface2 transition-all text-left group"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: exam.color + '20' }}
                      >
                        <LogoIcon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-ink">{exam.shortName}</p>
                        <p className="text-xs text-ink-muted truncate">{exam.name}</p>
                      </div>
                      <ArrowRight size={18} className="text-ink-muted group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
