import { create } from 'zustand';
import type { QuestionWithStatus, QuizState } from '@/types/quiz';

interface QuizStateStore {
  state: QuizState;
  questions: QuestionWithStatus[];
  currentIndex: number;
  startTime: number;
  questionStartTime: number;
  timeRemaining: number;
  timePerQuestion: number;
  perQuestionSeconds: number | null;
  marksEarned: number;
  totalMarks: number;
  correct: number;
  wrong: number;
  skipped: number;
  negativePenalty: number;
  categoryIAttempts: { correct: number; wrong: number; skip: number };
  categoryIIAttempts: { correct: number; wrong: number; partial: number; skip: number };
  answers: Record<string, { selected: string | string[] | null; isCorrect: boolean; timeMs: number }>;
  setState: (state: QuizState) => void;
  setStartTime: (time: number) => void;
  setQuestionStartTime: (time: number) => void;
  setQuestions: (questions: QuestionWithStatus[]) => void;
  setCurrentIndex: (index: number) => void;
  setTimeRemaining: (time: number) => void;
  setTimePerQuestion: (time: number) => void;
  setPerQuestionSeconds: (seconds: number | null) => void;
  addAnswer: (qId: string, answer: { selected: string | string[] | null; isCorrect: boolean; timeMs: number }) => void;
  setMarksData: (data: {
    marksEarned: number;
    totalMarks: number;
    correct: number;
    wrong: number;
    skipped: number;
    negativePenalty: number;
    categoryIAttempts: { correct: number; wrong: number; skip: number };
    categoryIIAttempts: { correct: number; wrong: number; partial: number; skip: number };
  }) => void;
  reset: () => void;
}

const initialState = {
  state: 'idle' as QuizState,
  questions: [] as QuestionWithStatus[],
  currentIndex: 0,
  startTime: 0,
  questionStartTime: 0,
  timeRemaining: 0,
  timePerQuestion: 30,
  perQuestionSeconds: null,
  marksEarned: 0,
  totalMarks: 0,
  correct: 0,
  wrong: 0,
  skipped: 0,
  negativePenalty: 0,
  categoryIAttempts: { correct: 0, wrong: 0, skip: 0 },
  categoryIIAttempts: { correct: 0, wrong: 0, partial: 0, skip: 0 },
  answers: {},
};

export const useQuizStore = create<QuizStateStore>((set) => ({
  ...initialState,
  setState: (state) => set({ state }),
  setStartTime: (startTime) => set({ startTime }),
  setQuestionStartTime: (questionStartTime) => set({ questionStartTime }),
  setQuestions: (questions) => set({ questions }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
  setTimePerQuestion: (timePerQuestion) => set({ timePerQuestion }),
  setPerQuestionSeconds: (perQuestionSeconds) => set({ perQuestionSeconds }),
  addAnswer: (qId, answer) =>
    set((s) => ({ answers: { ...s.answers, [qId]: answer } })),
  setMarksData: (data) => set(data),
  reset: () => set(initialState),
}));
