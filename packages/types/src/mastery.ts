import type { UUID, ISODateTime } from './common';

export interface MasteryState {
  id: UUID;
  learner_id: UUID;
  skill_id: UUID;
  skill_name: string;
  mastery_score: number;
  confidence: number;
  evidence_count: number;
  last_assessed_at?: ISODateTime;
  last_practiced_at?: ISODateTime;
  retention_estimate: number;
  difficulty_estimate: number;
  status: MasteryStatus;
}

export enum MasteryStatus {
  NOT_STARTED = 'not_started',
  LEARNING = 'learning',
  PRACTICED = 'practiced',
  MASTERED = 'mastered',
  NEEDS_REVIEW = 'needs_review',
  DECLINING = 'declining',
}

export interface MasteryEvidence {
  id: UUID;
  mastery_state_id: UUID;
  evidence_type: EvidenceType;
  source_id: UUID;
  score: number;
  weight: number;
  created_at: ISODateTime;
}

export enum EvidenceType {
  ASSESSMENT = 'assessment',
  QUIZ = 'quiz',
  PROJECT = 'project',
  PRACTICE = 'practice',
  DIAGNOSTIC = 'diagnostic',
  REVIEW = 'review',
  TEACHER_OVERRIDE = 'teacher_override',
}

export interface MasterySummary {
  total_skills: number;
  mastered: number;
  learning: number;
  needs_review: number;
  not_started: number;
  overall_progress: number;
  strongest_skills: SkillMasteryBrief[];
  weakest_skills: SkillMasteryBrief[];
  recently_improved: SkillMasteryBrief[];
}

export interface SkillMasteryBrief {
  skill_id: UUID;
  skill_name: string;
  mastery_score: number;
  trend: 'improving' | 'stable' | 'declining';
}
