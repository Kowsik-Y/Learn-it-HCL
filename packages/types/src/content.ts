import type { UUID, ISODateTime } from './common';

export interface Course {
  id: UUID;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url?: string;
  difficulty_level: string;
  estimated_duration_hours: number;
  language: string;
  tags: string[];
  skill_ids: UUID[];
  instructor_ids: UUID[];
  is_published: boolean;
  is_free: boolean;
  enrollment_count: number;
  rating: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Module {
  id: UUID;
  course_id: UUID;
  title: string;
  description: string;
  order_index: number;
  estimated_duration_minutes: number;
}

export interface Chapter {
  id: UUID;
  module_id: UUID;
  title: string;
  description: string;
  order_index: number;
  estimated_duration_minutes: number;
}

export interface Lesson {
  id: UUID;
  chapter_id: UUID;
  title: string;
  description: string;
  content_type: LessonContentType;
  content_url?: string;
  content_body?: string;
  order_index: number;
  estimated_duration_minutes: number;
  skill_ids: UUID[];
  difficulty_level: string;
  learning_objectives: string[];
}

export enum LessonContentType {
  VIDEO = 'video',
  ARTICLE = 'article',
  INTERACTIVE = 'interactive',
  CODING = 'coding',
  QUIZ = 'quiz',
  PROJECT = 'project',
}

export interface Resource {
  id: UUID;
  title: string;
  description: string;
  resource_type: string;
  url?: string;
  content?: string;
  skill_ids: UUID[];
  difficulty_level: string;
  estimated_duration_minutes: number;
  quality_score: number;
}

export interface Project {
  id: UUID;
  title: string;
  description: string;
  difficulty_level: string;
  skill_ids: UUID[];
  estimated_duration_hours: number;
  project_type: 'micro' | 'mini' | 'milestone' | 'capstone';
  instructions: string;
  starter_code?: string;
  evaluation_criteria: string[];
}
