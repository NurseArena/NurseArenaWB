export interface Profile {
  id: string;
  uid: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  phone?: string;
  targetExams: string[];
  jemasSubCourse?: string;
  currentStage?: 'Student' | 'Appeared' | 'Working Nurse';
  institution?: string;
  district?: string;
  joinedAt?: string;
  totalMarksEarned: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  bestMockScore: number;
  rapidFireUnlockedTier: number;
  streakDays: number;
  lastLoginAt?: string;
  profileCompletePct: number;
  isAdmin?: boolean;
}

export interface QuizAttempt {
  id: string;
  uid: string;
  quizId: string;
  attemptNumber: number;
  examId: string;
  startedAt: string;
  completedAt?: string;
  totalMarks: number;
  marksEarned: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  negativePenalty: number;
  categoryIAttempts: { correct: number; wrong: number; skip: number };
  categoryIIAttempts: { correct: number; wrong: number; partial: number; skip: number };
  subjectBreakdown: Record<string, { correct: number; wrong: number; marks: number }>;
  isLiveAttempt: boolean;
}

export interface MockTestEvent {
  id: number;
  exam_id: string;
  scheduled_at: string;
  duration_min: number;
  max_participants?: number;
  week_number: number;
  year: number;
  created_by?: string;
}

export interface LiveQuizEvent {
  id: number;
  exam_id: string;
  question_set_id?: string;
  starts_at: string;
  timezone: string;
  duration_min: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  current_q_index: number;
}

export interface QuizResult {
  id: number;
  quiz_event_id: number;
  user_id: string;
  score: number;
  correct_count: number;
  total_latency_ms: number;
  joined_at_index: number;
  disconnection_flag: boolean;
}

export interface QuizAnswer {
  id: number;
  quiz_event_id: number;
  user_id: string;
  question_index: number;
  selected_option?: string;
  is_correct?: boolean;
  latency_ms?: number;
  submitted_at: string;
}

export interface Mission {
  id: string;
  exam_id?: string;
  title: string;
  description?: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
  is_daily: boolean;
}

export interface UserMission {
  user_id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  assigned_date: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  targetExams: string[];
  type: 'mock_test' | 'result' | 'announcement';
  createdAt: string;
  readBy: string[];
}
