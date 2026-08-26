import type { UUID, ISODateTime } from './common';

export interface LearnerProfile {
  id: UUID;
  user_id: UUID;
  age_range?: string;
  language: string;
  timezone: string;
  locale: string;
  bio?: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface LearnerPreferences {
  preferred_content_type: ContentTypePreference;
  preferred_study_duration_minutes: number;
  available_days: string[];
  preferred_difficulty: DifficultyLevel;
  preferred_learning_time: string;
  preferred_language: string;
  learning_style: LearningStyle;
  project_oriented: boolean;
  mentor_supported: boolean;
}

export enum ContentTypePreference {
  VIDEO = 'video',
  READING = 'reading',
  INTERACTIVE = 'interactive',
  PROJECT = 'project',
  MIXED = 'mixed',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ADAPTIVE = 'adaptive',
}

export enum LearningStyle {
  VISUAL = 'visual',
  TEXTUAL = 'textual',
  AUDITORY = 'auditory',
  KINESTHETIC = 'kinesthetic',
  MIXED = 'mixed',
}

export interface LearnerGoal {
  id: UUID;
  learner_id: UUID;
  title: string;
  description: string;
  goal_type: GoalType;
  target_role?: string;
  time_horizon_weeks?: number;
  hours_per_week?: number;
  is_active: boolean;
  progress_percentage: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export enum GoalType {
  CAREER = 'career',
  ACADEMIC = 'academic',
  CERTIFICATION = 'certification',
  CURIOSITY = 'curiosity',
  JOB_SWITCH = 'job_switch',
  PERSONAL = 'personal',
}

export interface OnboardingConversation {
  goal: string;
  target_role?: string;
  time_horizon_weeks?: number;
  hours_per_week?: number;
  known_skills: string[];
  unknown_or_uncertain_skills: string[];
  preferences: {
    video_length?: string;
    hands_on?: boolean;
    projects?: string;
  };
}

export interface DailyCheckIn {
  energy_level: EnergyLevel;
  available_minutes: number;
}

export enum EnergyLevel {
  READY = 'ready',
  GOOD = 'good',
  OKAY = 'okay',
  TIRED = 'tired',
  OVERWHELMED = 'overwhelmed',
}
