import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExamCode } from '@/lib/exam-config';

interface ExamState {
  activeExam: ExamCode;
  setActiveExam: (exam: ExamCode) => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      activeExam: 'JENPAS_UG_P1' as ExamCode,
      setActiveExam: (exam) => set({ activeExam: exam }),
    }),
    { name: 'nursearena-exam' }
  )
);
