'use client';
import { useCallback } from 'react';
import { useExamStore } from '@/store/examStore';
import { EXAMS, type ExamCode } from '@/lib/exam-config';

export function useExam() {
  const { activeExam, setActiveExam } = useExamStore();
  const config = EXAMS[activeExam];

  const simpleSwitch = (exam: ExamCode) => {
    setActiveExam(exam);
  };

  return {
    activeExam,
    setActiveExam: simpleSwitch,
    config,
    subjects: config?.subjects ?? [],
    examName: config?.name ?? '',
    examColor: config?.color ?? '#6366f1',
  };
}
