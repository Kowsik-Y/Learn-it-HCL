import type { ISODateTime, UUID } from './common';

export interface Recommendation {
  id: UUID;
  learner_id: UUID;
  resource_id: UUID;
  resource_type: string;
  resource_title: string;
  score: number;
  rank: number;
  reasons: RecommendationReason[];
  is_accepted?: boolean;
  created_at: ISODateTime;
}

export interface RecommendationReason {
  type: RecommendationReasonType;
  description: string;
  evidence?: string;
  weight: number;
}

export enum RecommendationReasonType {
  FILLS_SKILL_GAP = 'fills_skill_gap',
  PREREQUISITES_MET = 'prerequisites_met',
  MATCHES_PREFERENCE = 'matches_preference',
  FITS_TIME = 'fits_time',
  MATCHES_DIFFICULTY = 'matches_difficulty',
  HISTORICAL_SUCCESS = 'historical_success',
  GOAL_ALIGNED = 'goal_aligned',
  HIGH_QUALITY = 'high_quality',
  REVIEW_DUE = 'review_due',
  NOVELTY = 'novelty',
}

export interface WhyRecommended {
  resource_id: UUID;
  resource_title: string;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  not_recommended_reasons?: string[];
}

export interface LearningPath {
  id: UUID;
  learner_id: UUID;
  goal_id: UUID;
  title: string;
  description: string;
  estimated_duration_weeks: number;
  progress_percentage: number;
  nodes: LearningPathNode[];
  milestones: Milestone[];
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface LearningPathNode {
  id: UUID;
  path_id: UUID;
  resource_id: UUID;
  resource_type: string;
  title: string;
  description: string;
  order_index: number;
  status: PathNodeStatus;
  is_skipped: boolean;
  skip_reason?: string;
  estimated_duration_minutes: number;
  skill_ids: UUID[];
  prerequisites: UUID[];
}

export enum PathNodeStatus {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  REMEDIATION = 'remediation',
}

export interface Milestone {
  id: UUID;
  path_id: UUID;
  title: string;
  description: string;
  target_skills: UUID[];
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: ISODateTime;
}

export interface DailyMission {
  date: string;
  estimated_minutes: number;
  current_milestone?: string;
  primary_task: MissionTask;
  review_task?: MissionTask;
  challenge_task?: MissionTask;
  optional_task?: MissionTask;
  total_xp_available: number;
}

export interface MissionTask {
  id: UUID;
  title: string;
  description: string;
  task_type: 'lesson' | 'quiz' | 'review' | 'challenge' | 'project';
  estimated_minutes: number;
  xp_reward: number;
  skill_names: string[];
  resource_id: UUID;
}

export interface LearningSession {
  id: UUID;
  learner_id: UUID;
  started_at: ISODateTime;
  ended_at?: ISODateTime;
  duration_minutes: number;
  activities_completed: number;
  xp_earned: number;
  skills_practiced: string[];
}
