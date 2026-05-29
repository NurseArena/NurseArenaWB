export type QuizType = 'mock' | 'quiz' | 'topicwise' | 'rapid_fire' | 'live' | 'daily' | 'pyq';

export interface Quiz {
  id: string;
  examId: string;
  type: QuizType;
  title: string;
  startTime?: string;
  endTime?: string;
  durationSeconds: number;
  questionCount?: number;
  isAuto?: boolean;
  maxMarks?: number;
  isLiveAttempt?: boolean;
  subjectId?: string;
  topicId?: string;
  pyqYear?: number;
  perQuestionSeconds?: number;
  scoringProfileId?: string;
  liveAt?: string;
  catchupEndsAt?: string;
  liveStatus?: 'scheduled' | 'live' | 'catchup' | 'closed' | 'failed';
}

export interface QuizQuestion {
  quizId: string;
  questionId: string;
  orderIndex: number;
}

export interface Attempt {
  id: string;
  userId: string;
  questionId: string;
  selectedOption?: string;
  isCorrect?: boolean;
  timeTakenMs?: number;
  attemptedAt?: string;
}

export type QuizState = 'idle' | 'loading' | 'active' | 'reviewing' | 'finished';

export interface QuizSession {
  state: QuizState;
  questions: QuestionWithStatus[];
  currentIndex: number;
  startTime: number;
  timeRemaining: number;
  marksEarned: number;
  totalMarks: number;
  correct: number;
  wrong: number;
  skipped: number;
  negativePenalty: number;
  categoryIAttempts: { correct: number; wrong: number; skip: number };
  categoryIIAttempts: { correct: number; wrong: number; partial: number; skip: number };
  answers: Record<string, { selected: string | string[] | null; isCorrect: boolean; timeMs: number }>;
}

export interface QuestionWithStatus {
  id: string;
  question: string;
  options: { label: string; text: string }[];
  correctAnswers: string[];
  category: 'I' | 'II';
  explanation?: string;
  difficulty?: string;
  topic?: string;
  answered?: boolean;
  selected?: string | string[];
  isCorrect?: boolean;
}

export interface LiveQuizState {
  eventId: string;
  state: 'waiting' | 'active' | 'reviewing' | 'ended';
  currentQuestionIndex: number;
  currentQuestion: QuestionWithStatus | null;
  timeRemainingMs: number;
  score: number;
  correctCount: number;
  totalLatencyMs: number;
  joinedLate: boolean;
  canSubmit: boolean;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  marksEarned: number;
  percentage: number;
  wrong: number;
  rank: number;
}

export interface ScoringProfile {
  id: string;
  name: string;
  marks_correct: number;
  marks_wrong: number;
  marks_unattempted: number;
  partial_credit: boolean;
}

export interface QuizSessionRecord {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  submitted_at?: string;
  time_taken_ms?: number;
  total_questions: number;
  attempted_count: number;
  correct_count: number;
  wrong_count: number;
  score: number;
  max_score: number;
  status: 'in_progress' | 'submitted' | 'abandoned';
  quiz?: Quiz;
}

export interface SessionAnswerRecord {
  id: string;
  session_id: string;
  question_id: string;
  order_index: number;
  selected_option?: string;
  is_correct?: boolean;
  marks_awarded?: number;
  time_taken_ms?: number;
  flagged: boolean;
  answered_at?: string;
  question?: QuestionWithStatus;
}

export interface MockTest {
  id: string;
  exam_id: string;
  title: string;
  serial_number: number;
  duration_seconds: number;
  scoring_profile_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_by?: string;
  created_at: string;
}

export interface MockTestAttempt {
  id: string;
  mock_test_id: string;
  user_id: string;
  session_id: string;
  started_at: string;
  submitted_at?: string;
  score?: number;
  correct_count?: number;
  wrong_count?: number;
  rank?: number;
}

export type { Question } from './exam';
