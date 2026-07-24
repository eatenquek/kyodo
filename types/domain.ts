export type Dimension =
  | 'planning'
  | 'communication'
  | 'leadership'
  | 'pace'
  | 'conflict'
  | 'detail'
  | 'initiative'
  | 'flexibility'
  | 'accountability'
  | 'decisionComfort';

// coarse blocks instead of exact hours - good enough to find a shared slot
export type AvailabilityBlock =
  | 'weekdayMorning'
  | 'weekdayAfternoon'
  | 'weekdayEvening'
  | 'weekendMorning'
  | 'weekendAfternoon'
  | 'weekendEvening';

export type Profile = {
  id: string;
  fullName: string;
  university?: string;
  course?: string;
  yearOfStudy?: number;
  preferredRole: string;
  bio?: string;
  availability?: AvailabilityBlock[];
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
  value: number;
};

export type WorkstyleScores = Record<Dimension, number>;

export type PersonalityResult = WorkstyleScores & {
  userId: string;
  resultLabel: string;
  summaryText: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  result?: PersonalityResult;
  availability?: AvailabilityBlock[];
};

export type Team = {
  id: string;
  name: string;
  projectName?: string;
  description?: string;
  joinCode: string;
  /** Profile id of the team creator. Only the owner may rotate the join code. */
  createdBy?: string;
  joinCodeUpdatedAt?: string;
  members: TeamMember[];
};

export type CompatibilityRoleCoverage = {
  id: 'coordinator' | 'builder' | 'quality' | 'connector';
  label: string;
  score: number;
  members: string[];
};

export type CompatibilityResult = {
  teamId: string;
  score: number;
  scoreLabel: string;
  pairFitScore?: number;
  roleCoverageScore?: number;
  coordinatorHealthScore?: number;
  suggestedCoordinator?: string;
  roleCoverage?: CompatibilityRoleCoverage[];
  sharedResponsibilities?: string[];
  overlapRisks?: string[];
  gaps?: string[];
  strengths: string[];
  frictions: string[];
  tips: string[];
  createdAt: string;
};
