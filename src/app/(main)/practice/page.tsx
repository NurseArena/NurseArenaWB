'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import { ArrowRight, Loader2 } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { EXAMS } from '@/lib/exam-config';

export default function PracticePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setActiveExam = useExamStore((s) => s.setActiveExam);
  const [ready, setReady] = useState(false);
  const targetExams = user?.targetExams ?? [];

  useEffect(() => {
    if (!user) return;
    if (targetExams.length <= 1) {
      if (targetExams.length === 1) {
        setActiveExam(targetExams[0] as keyof typeof EXAMS);
      }
      router.replace('/subjects');
    } else {
      setReady(true);
    }
  }, [user, targetExams, setActiveExam, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const handleSelect = (code: string) => {
    setActiveExam(code as keyof typeof EXAMS);
    router.push('/subjects');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink">What to practice today?</h1>
        <p className="text-sm text-ink-muted mt-1">You are enrolled in multiple exams — pick one to start</p>
      </div>

      <div className="space-y-3">
        {targetExams.map((code) => {
          const exam = EXAMS[code as keyof typeof EXAMS];
          if (!exam) return null;
          return (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-surface hover:border-primary/30 hover:bg-surface2 transition-all text-left group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: exam.color + '20' }}
              >
                <LogoIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">{exam.shortName}</p>
                <p className="text-xs text-ink-muted truncate">{exam.name}</p>
                <p className="text-[10px] text-ink-muted/60 mt-0.5">{exam.subjects.length} subjects</p>
              </div>
              <ArrowRight size={20} className="text-ink-muted group-hover:text-primary transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
