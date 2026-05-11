export interface Word {
  id: string;
  term: string;
  definition: string;
  mastery?: number;
  wrongCount?: number;
  [key: string]: any;
}

export interface AppData {
  vocab: Word[];
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: string | null;
  completedModes: Record<string, { date: string; mc: boolean; spelling: boolean; [key: string]: any }>;
}

export interface Feedback {
  show: boolean;
  title: string;
  type: string;
  subtitle: string;
  duration: number;
}
