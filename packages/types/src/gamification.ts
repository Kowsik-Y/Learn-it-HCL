import type { UUID, ISODateTime } from './common';

export interface XPEvent {
  id: UUID;
  learner_id: UUID;
  amount: number;
  reason: string;
  source_type: string;
  source_id: UUID;
  created_at: ISODateTime;
}

export interface GamificationProfile {
  learner_id: UUID;
  total_xp: number;
  level: LearnerLevel;
  level_progress: number;
  current_streak: number;
  longest_streak: number;
  streak_freeze_available: boolean;
  badges_count: number;
  quests_completed: number;
}

export interface LearnerLevel {
  name: string;
  number: number;
  min_xp: number;
  max_xp: number;
  icon: string;
}

export const LEVELS: LearnerLevel[] = [
  { name: 'Novice', number: 1, min_xp: 0, max_xp: 500, icon: '🌱' },
  { name: 'Explorer', number: 2, min_xp: 500, max_xp: 1500, icon: '🔍' },
  { name: 'Builder', number: 3, min_xp: 1500, max_xp: 3500, icon: '🔨' },
  { name: 'Practitioner', number: 4, min_xp: 3500, max_xp: 7000, icon: '⚡' },
  { name: 'Advanced', number: 5, min_xp: 7000, max_xp: 12000, icon: '🚀' },
  { name: 'Expert', number: 6, min_xp: 12000, max_xp: Infinity, icon: '👑' },
];

export interface Badge {
  id: UUID;
  name: string;
  description: string;
  icon_url: string;
  category: string;
  criteria: string;
  is_earned: boolean;
  earned_at?: ISODateTime;
}

export interface Quest {
  id: UUID;
  title: string;
  description: string;
  quest_type: 'daily' | 'weekly' | 'achievement' | 'challenge';
  tasks: QuestTask[];
  xp_reward: number;
  badge_reward_id?: UUID;
  progress_percentage: number;
  is_completed: boolean;
  expires_at?: ISODateTime;
}

export interface QuestTask {
  id: UUID;
  description: string;
  target_count: number;
  current_count: number;
  is_completed: boolean;
}

export interface Streak {
  learner_id: UUID;
  current_count: number;
  longest_count: number;
  last_activity_date: string;
  freeze_count: number;
  is_active: boolean;
}

export interface DailyRewardSummary {
  date: string;
  events: XPEvent[];
  total_xp: number;
  skills_improved: SkillImprovement[];
  tomorrow_preview?: string;
}

export interface SkillImprovement {
  skill_name: string;
  improvement_percentage: number;
}

export interface LeaderboardEntry {
  rank: number;
  learner_id: UUID;
  learner_name: string;
  avatar_url?: string;
  value: number;
  metric_type: 'xp' | 'streak' | 'challenges';
}
