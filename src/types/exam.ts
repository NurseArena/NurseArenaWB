export interface Exam {
  id: string;
  code: string;
  label: string;
  parentExam?: string;
  maxMarks: number;
  totalQuestions: number;
  markingCategory: ('I' | 'II')[];
  hasNegativeMarking: boolean;
  partialCredit: boolean;
  durationSeconds: number;
}

export interface Subject {
  id: string;
  examId: string;
  label: string;
  questionCount: number;
  marks: number;
  catI?: number;
  catII?: number;
  topics: string[];
}

export interface Question {
  id: string;
  examId: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'I' | 'II';
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswers: string[];
  explanation?: string;
  createdAt?: string;
  archived?: boolean;
}

export interface ExamTopic {
  id: string;
  subjectId: string;
  examId: string;
  label: string;
  subtopics: string[];
}

export interface QuestionTag {
  id: string;
  name: string;
  exam_id: string;
}
