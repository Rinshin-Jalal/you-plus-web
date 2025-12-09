// ============================================================================
// Gamification Service (Frontend)
// ============================================================================
// API client for gamification endpoints

import { apiClient } from './api';

// ============================================================================
// Types
// ============================================================================

export type MascotMood =
  | 'celebrating'
  | 'proud'
  | 'happy'
  | 'neutral'
  | 'concerned'
  | 'sad'
  | 'sleeping';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory =
  | 'streaks'
  | 'calls'
  | 'pillars'
  | 'trust'
  | 'levels'
  | 'special';

export type AccessoryCategory =
  | 'headwear'
  | 'eyewear'
  | 'effects'
  | 'backgrounds'
  | 'props';

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

export interface MascotState {
  stage: number;
  stageName: string;
  mood: MascotMood;
  energy: number;
  equippedAccessories: Array<{
    key: string;
    category: AccessoryCategory;
    assetKey: string;
    zIndex: number;
  }>;
}

export interface ChallengeResponse {
  id: string;
  challengeType: string;
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

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  userXp: number;
  weekStart: string;
}

export interface XPTransaction {
  amount: number;
  reason: string;
  createdAt: string;
}

export interface AchievementNotification {
  id: string;
  key: string;
  name: string;
  description: string;
  xpReward: number;
  rarity: AchievementRarity;
}

// ============================================================================
// Service
// ============================================================================

class GamificationService {
  /**
   * Get user's current progression
   */
  async getProgression(): Promise<ProgressionResponse> {
    return apiClient.get<ProgressionResponse>('/api/gamification/progression');
  }

  /**
   * Get XP transaction history
   */
  async getTransactions(limit = 50): Promise<{ transactions: XPTransaction[] }> {
    return apiClient.get<{ transactions: XPTransaction[] }>(
      `/api/gamification/transactions?limit=${limit}`
    );
  }

  /**
   * Get all achievements with user's unlock status
   */
  async getAchievements(): Promise<{ achievements: AchievementResponse[] }> {
    return apiClient.get<{ achievements: AchievementResponse[] }>(
      '/api/gamification/achievements'
    );
  }

  /**
   * Get pending achievement notifications
   */
  async getAchievementNotifications(): Promise<{ notifications: AchievementNotification[] }> {
    return apiClient.get<{ notifications: AchievementNotification[] }>(
      '/api/gamification/achievements/notifications'
    );
  }

  /**
   * Mark achievements as notified
   */
  async markAchievementsNotified(achievementIds: string[]): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      '/api/gamification/achievements/mark-notified',
      { achievementIds }
    );
  }

  /**
   * Get mascot state with equipped accessories
   */
  async getMascot(): Promise<MascotState> {
    return apiClient.get<MascotState>('/api/gamification/mascot');
  }

  /**
   * Get all accessories with unlock status
   */
  async getAccessories(): Promise<{ accessories: AccessoryResponse[] }> {
    return apiClient.get<{ accessories: AccessoryResponse[] }>(
      '/api/gamification/accessories'
    );
  }

  /**
   * Equip an accessory
   */
  async equipAccessory(accessoryId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      '/api/gamification/accessories/equip',
      { accessoryId }
    );
  }

  /**
   * Unequip an accessory
   */
  async unequipAccessory(accessoryId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      '/api/gamification/accessories/unequip',
      { accessoryId }
    );
  }

  /**
   * Get today's daily challenge
   */
  async getDailyChallenge(): Promise<{ challenge: ChallengeResponse | null }> {
    return apiClient.get<{ challenge: ChallengeResponse | null }>(
      '/api/gamification/challenge'
    );
  }

  /**
   * Get weekly leaderboard
   */
  async getLeaderboard(limit = 100): Promise<LeaderboardResponse> {
    return apiClient.get<LeaderboardResponse>(
      `/api/gamification/leaderboard?limit=${limit}`
    );
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;
