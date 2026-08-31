import type { ISODateTime, UUID } from './common';

export interface Skill {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  category: string;
  parent_skill_id?: UUID;
  difficulty_level: number;
  is_active: boolean;
}

export interface SkillRelationship {
  id: UUID;
  source_skill_id: UUID;
  target_skill_id: UUID;
  relationship_type: SkillRelationshipType;
  strength: number;
}

export enum SkillRelationshipType {
  PREREQUISITE = 'prerequisite',
  RELATED = 'related',
  BUILDS_ON = 'builds_on',
  PART_OF = 'part_of',
}

export interface CareerRole {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  category: string;
  required_skills: RoleSkill[];
}

export interface RoleSkill {
  skill_id: UUID;
  skill_name: string;
  importance: 'essential' | 'important' | 'nice_to_have';
  minimum_mastery: number;
}

export interface SkillGap {
  skill_id: UUID;
  skill_name: string;
  current_mastery: number;
  required_mastery: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  has_prerequisites_met: boolean;
}

export interface SkillMap {
  skills: SkillWithMastery[];
  total_skills: number;
  mastered_count: number;
  in_progress_count: number;
  not_started_count: number;
}

export interface SkillWithMastery {
  skill: Skill;
  mastery_score: number;
  confidence: number;
  last_assessed_at?: ISODateTime;
}
