// ============================================================================
// Gamification Types
// ============================================================================

// XP Transaction Reasons
export type XPReason =
  | 'call_answered'
  | 'call_completed'
  | 'pillar_checkin'
  | 'all_pillars_complete'
  | 'promise_kept'
  | 'promise_broken'
  | 'achievement_unlock'
  | 'daily_challenge'
  | 'streak_bonus'
  | 'level_up_bonus'
  | 'admin_adjustment';

// XP Values (base amounts before multiplier)
export const XP_VALUES = {
  call_answered: 25,
  call_completed: 30,
  pillar_checkin: 15,
  all_pillars_complete: 50,
  promise_kept: 20,
  promise_broken: -10,
  daily_challenge_base: 50,
  daily_challenge_max: 100,
} as const;

// Mascot Moods (in priority order)
export type MascotMood =
  | 'celebrating'
  | 'proud'
  | 'happy'
  | 'neutral'
  | 'concerned'
  | 'sad'
  | 'sleeping';

// Mascot Stage Names
export const MASCOT_STAGES = {
  1: 'Spark',
  2: 'Ember',
  3: 'Flame',
  4: 'Blaze',
  5: 'Inferno',
} as const;

// Achievement Rarity
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Achievement Category
export type AchievementCategory =
  | 'streaks'
  | 'calls'
  | 'pillars'
  | 'trust'
  | 'levels'
  | 'special';

// Accessory Category
export type AccessoryCategory =
  | 'headwear'
  | 'eyewear'
  | 'effects'
  | 'backgrounds'
  | 'props';

// Challenge Types
export type ChallengeType =
  | 'pillar_focus'
  | 'all_pillars'
  | 'call_speed'
  | 'no_excuse'
  | 'reflection'
  | 'streak_protect';

// ============================================================================
// Database Types
// ============================================================================

export interface UserProgression {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_in_current_level: number;
  xp_to_next_level: number;
  streak_multiplier: number;
  streak_shields: number;
  mascot_stage: number;
  mascot_mood: MascotMood;
  mascot_energy: number;
  days_absent: number; // Days since last activity - for abandonment visuals
  last_xp_earned_at: string | null;
  last_level_up_at: string | null;
  last_achievement_at: string | null;
  last_energy_decay_at: string | null;
  last_activity_check_at: string | null; // Last date we checked days_absent
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string | null;
  xp_reward: number;
  rarity: AchievementRarity;
  category: AchievementCategory;
  requirement_type: string;
  requirement_value: number | null;
  requirement_config: Record<string, unknown>;
  accessory_unlock: string | null;
  sort_order: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  notified: boolean;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: XPReason;
  multiplier: number;
  base_amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DailyChallenge {
  id: string;
  user_id: string;
  challenge_date: string;
  challenge_type: ChallengeType;
  challenge_config: Record<string, unknown>;
  description: string;
  xp_reward: number;
  completed: boolean;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface MascotAccessory {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: AccessoryCategory;
  rarity: AchievementRarity;
  unlock_method: string;
  unlock_requirement: string | null;
  asset_key: string;
  z_index: number;
  preview_offset_x: number;
  preview_offset_y: number;
  sort_order: number;
  created_at: string;
}

export interface UserAccessory {
  id: string;
  user_id: string;
  accessory_id: string;
  equipped: boolean;
  unlocked_at: string;
}

export interface WeeklyLeaderboard {
  id: string;
  user_id: string;
  week_start: string;
  xp_earned: number;
  rank: number | null;
  mascot_stage: number;
  current_level: number;
  updated_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ProgressionResponse {
  totalXp: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  streakMultiplier: number;
  streakShields: number;
  mascotStage: number;
  mascotStageName: string;
  mascotMood: MascotMood;
  mascotEnergy: number;
}

export interface AchievementResponse {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string | null;
  xpReward: number;
  rarity: AchievementRarity;
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt: string | null;
  accessoryUnlock: string | null;
}

export interface AccessoryResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: AccessoryCategory;
  rarity: AchievementRarity;
  assetKey: string;
  zIndex: number;
  unlocked: boolean;
  equipped: boolean;
  unlockMethod: string;
  unlockRequirement: string | null;
}

export interface ChallengeResponse {
  id: string;
  challengeType: ChallengeType;
  description: string;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
  expiresAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  xpEarned: number;
  mascotStage: number;
  currentLevel: number;
  isCurrentUser: boolean;
}

export interface XPAwardResult {
  newTotalXp: number;
  newLevel: number;
  xpAwarded: number;
  leveledUp: boolean;
  newStage: number;
  achievementsUnlocked: string[];
}
