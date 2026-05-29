'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { EXAMS, type ExamCode } from '@/lib/exam-config';
import { useExam } from '@/hooks/useExam';

interface ExamSwitchModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExamSwitchModal({ open, onClose }: ExamSwitchModalProps) {
  const { setActiveExam } = useExam();
  const [selectedExam, setSelectedExam] = useState<ExamCode>('JENPAS-UG');

  const handleConfirm = () => {
    setActiveExam(selectedExam);
    onClose();
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
                <h2 className="text-xl font-bold text-ink">
                  Switch Exam
                </h2>
                <button onClick={onClose} className="text-ink-muted hover:text-ink">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {Object.entries(EXAMS).map(([code, config]) => (
                  <button
                    key={code}
                    onClick={() => setSelectedExam(code as ExamCode)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      selectedExam === code
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: config.color + '20' }}>
                      <LogoIcon size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink">{config.shortName}</p>
                      <p className="text-xs text-ink-muted">{config.name}</p>
                    </div>
                  </button>
                ))}
              </div>

              <Button className="w-full" onClick={handleConfirm}>
                Switch to {EXAMS[selectedExam].shortName}
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
