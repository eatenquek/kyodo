export type Dimension =
  | 'planning'
  | 'communication'
  | 'leadership'
  | 'pace'
  | 'conflict'
  | 'detail'
  | 'collaboration';

export type Profile = {
  id: string;
  fullName: string;
  university?: string;
  course?: string;
  yearOfStudy?: number;
  preferredRole: string;
  bio?: string;
  onboardingCompleted: boolean;
};

export type Question = {
  id: string;
  dimension: Dimension;
  prompt: string;
  reverse: boolean;
};

export type Answer = {
  questionId: string;
  dimension: Dimension;
  value: number;
  reverse: boolean;
};

export type PersonalityResult = {
  userId: string;
  planning: number;
  communication: number;
  leadership: number;
  pace: number;
  conflict: number;
  detail: number;
  collaboration: number;
  resultLabel: string;
  summaryText: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  result?: PersonalityResult;
};

export type Team = {
  id: string;
  name: string;
  projectName?: string;
  description?: string;
  joinCode: string;
  members: TeamMember[];
};

export type CompatibilityResult = {
  teamId: string;
  score: number;
  scoreLabel: string;
  strengths: string[];
  frictions: string[];
  tips: string[];
  createdAt: string;
};
