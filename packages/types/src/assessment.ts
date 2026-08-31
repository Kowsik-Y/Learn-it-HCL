import type { ISODateTime, UUID } from './common';

export interface Assessment {
  id: UUID;
  title: string;
  description: string;
  assessment_type: AssessmentType;
  skill_ids: UUID[];
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts: number;
  is_adaptive: boolean;
  question_count: number;
  created_at: ISODateTime;
}

export enum AssessmentType {
  DIAGNOSTIC = 'diagnostic',
  QUIZ = 'quiz',
  PRACTICE = 'practice',
  EXAM = 'exam',
  ASSIGNMENT = 'assignment',
}

export interface Question {
  id: UUID;
  content: string;
  question_type: QuestionType;
  difficulty_level: number;
  skill_ids: UUID[];
  blooms_level: BloomsLevel;
  estimated_time_seconds: number;
  explanation?: string;
  hints: string[];
  options?: QuestionOption[];
  correct_answer?: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  MULTIPLE_SELECT = 'multiple_select',
  TRUE_FALSE = 'true_false',
  CODING = 'coding',
  SQL = 'sql',
  SHORT_ANSWER = 'short_answer',
  MATCHING = 'matching',
  ORDERING = 'ordering',
  SCENARIO = 'scenario',
}

export enum BloomsLevel {
  REMEMBER = 'remember',
  UNDERSTAND = 'understand',
  APPLY = 'apply',
  ANALYZE = 'analyze',
  EVALUATE = 'evaluate',
  CREATE = 'create',
}

export interface QuestionOption {
  id: UUID;
  content: string;
  is_correct: boolean;
  explanation?: string;
}

export interface AssessmentAttempt {
  id: UUID;
  assessment_id: UUID;
  learner_id: UUID;
  score: number;
  max_score: number;
  percentage: number;
  status: AttemptStatus;
  started_at: ISODateTime;
  completed_at?: ISODateTime;
  time_spent_seconds: number;
  responses: QuestionResponse[];
}

export enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  TIMED_OUT = 'timed_out',
  ABANDONED = 'abandoned',
}

export interface QuestionResponse {
  question_id: UUID;
  answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  hints_used: number;
  score: number;
}

export interface DiagnosticResult {
  assessment_id: UUID;
  learner_id: UUID;
  skill_results: DiagnosticSkillResult[];
  recommended_actions: DiagnosticAction[];
  overall_readiness: number;
}

export interface DiagnosticSkillResult {
  skill_id: UUID;
  skill_name: string;
  mastery_estimate: number;
  confidence: number;
  status: 'mastered' | 'partial' | 'weak' | 'unknown';
  questions_asked: number;
  questions_correct: number;
}

export interface DiagnosticAction {
  action_type: 'skip' | 'review' | 'learn' | 'remediate';
  skill_id: UUID;
  skill_name: string;
  reason: string;
}
