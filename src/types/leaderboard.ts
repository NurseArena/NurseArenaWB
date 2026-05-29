export type PeriodType = 'daily' | 'weekly' | 'all_time';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  examId?: string;
  marksEarned: number;
  percentage: number;
  wrong: number;
  rank: number;
  periodType: PeriodType;
  correctCount?: number;
  totalQuestions?: number;
  user?: {
    name?: string;
    avatarURL?: string;
    totalMarksEarned?: number;
  };
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  marksEarned: number;
  percentage: number;
  wrong: number;
  totalMarksEarned: number;
  trend?: 'up' | 'down' | 'stable';
  isCurrentUser?: boolean;
}

export interface AdminStats {
  totalRegisteredUsers: number;
  totalUsersPerExam: { exam: string; count: number }[];
  dailyActiveUsers: { date: string; count: number }[];
  averageScores: { mockTestName: string; avgScore: number }[];
  marksDistribution: { marksRange: string; count: number }[];
  topWrongQuestions: { id: string; question: string; wrongRate: number; totalAttempts: number }[];
}
