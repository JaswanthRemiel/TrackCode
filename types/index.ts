export interface User {
  uid: string;
  email: string;
  createdAt: number;
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  lastActiveDate?: string;
  leetcodeUsername?: string;
}

export interface Problem {
  id: string; // Typically a generated ID
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  company: string; // or an array if multiple
  leetcodeUrl: string;
  tags: string[];
}

export type ProgressStatus = 'todo' | 'done' | 'revision';

export interface UserProgress {
  userId: string;
  problemId: string;
  status: ProgressStatus;
  completedAt?: number;
}

export interface DailyActivity {
  userId: string;
  date: string; // YYYY-MM-DD
  problemsSolved: number;
}

export interface Note {
  userId: string;
  problemId: string;
  content: string;
}
