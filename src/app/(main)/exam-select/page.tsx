'use client';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { ExamSelector } from '@/components/exam/ExamSelector';
import { motion } from 'framer-motion';
import { LogoIcon } from '@/components/LogoIcon';
import type { ExamCode } from '@/lib/exam-config';

export default function ExamSelectPage() {
  const router = useRouter();
  const setActiveExam = useExamStore((s) => s.setActiveExam);
  const user = useAuthStore((s) => s.user);

  const handleSelect = async (code: ExamCode) => {
    setActiveExam(code);
    if (user) {
      const supabase = createClient();
      const { data: exam } = await supabase.from('exams').select('id').eq('code', code).single();
      if (exam) {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, targetExams: [code] }, { onConflict: 'id' });
      }
    }
    router.push('/dashboard');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
          <LogoIcon size={56} />
        </div>
        <h1 className="text-3xl font-bold text-ink">Choose Your Exam</h1>
        <p className="text-ink-muted mt-2">
          Select the exam you&apos;re preparing for
        </p>
      </div>
      <ExamSelector onSelect={handleSelect} />
    </motion.div>
  );
}
