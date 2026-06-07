export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'learner';
  avatar: string;
  xpTotal: number;
  level: number;
  coursesCompleted: string[];
  currentBatch?: string;
  createdAt: string;
}

export interface Segment {
  id: string;
  text: string;
  animationStyle: 'type' | 'zoom' | 'fade' | 'reveal';
  emphasis: string[];
  durationSeconds: number;
  startTime?: number;
  endTime?: number;
}

export interface Interaction {
  id: string;
  afterSegmentId: string;
  triggerTime?: number;
  type: 'mcq' | 'code' | 'fill_blank' | 'concept_match';
  xpReward: number;
  timeLimit: number;
  data: MCQData | CodeData | FillBlankData | ConceptMatchData;
}

export interface MCQData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CodeData {
  instruction: string;
  language: string;
  starterCode: string;
  testCases: { input: string; expectedOutput: string }[];
  solution: string;
}

export interface FillBlankData {
  sentence: string;
  blanks: string[];
  hint?: string;
}

export interface ConceptMatchData {
  pairs: { term: string; definition: string }[];
}

export interface Course {
  _id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  thumbnail: string;
  status: 'generating' | 'ready' | 'published';
  script: { segments: Segment[] };
  interactions: Interaction[];
  videoUrl?: string;
  audioUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface BatchLearner {
  userId: string;
  name: string;
  avatar: string;
  joinedAt: string;
  xpEarned: number;
  interactionsCompleted: number;
  rank: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  xp: number;
  rank: number;
  delta?: number;
}

export interface Batch {
  _id: string;
  courseId: string;
  batchNumber: number;
  startTime: string;
  endTime?: string;
  status: 'waiting' | 'active' | 'completed';
  learners: BatchLearner[];
  leaderboard: LeaderboardEntry[];
}

export interface InteractionResult {
  interactionId: string;
  batchId: string;
  answer: unknown;
  timeTaken: number;
  isCorrect?: boolean;
  xpAwarded?: number;
}
