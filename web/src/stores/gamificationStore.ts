import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gamificationService } from '@/services/gamification';
import type {
  ProgressionResponse,
  AchievementResponse,
  AccessoryResponse,
  MascotState,
  ChallengeResponse,
  LeaderboardResponse,
  AchievementNotification,
} from '@/services/gamification';

// Cache duration: 2 minutes
const CACHE_DURATION_MS = 2 * 60 * 1000;

interface GamificationState {
  // Progression data
  progression: ProgressionResponse | null;
  achievements: AchievementResponse[];
  accessories: AccessoryResponse[];
  mascot: MascotState | null;
  challenge: ChallengeResponse | null;
  leaderboard: LeaderboardResponse | null;
  
  // Notifications queue
  pendingNotifications: AchievementNotification[];
  
  // State
  loading: boolean;
  error: Error | null;
  lastFetchedAt: number | null;
  
  // Actions
  fetchProgression: (force?: boolean) => Promise<void>;
  fetchAchievements: (force?: boolean) => Promise<void>;
  fetchAccessories: () => Promise<void>;
  fetchMascot: () => Promise<void>;
  fetchChallenge: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchPendingNotifications: () => Promise<void>;
  
  // Accessory actions
  equipAccessory: (accessoryId: string) => Promise<boolean>;
  unequipAccessory: (accessoryId: string) => Promise<boolean>;
  
  // Notification actions
  dismissNotification: (achievementId: string) => void;
  markNotificationsRead: () => Promise<void>;
  
  // Utilities
  clearCache: () => void;
  isStale: () => boolean;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      progression: null,
      achievements: [],
      accessories: [],
      mascot: null,
      challenge: null,
      leaderboard: null,
      pendingNotifications: [],
      loading: false,
      error: null,
      lastFetchedAt: null,

      isStale: () => {
        const { lastFetchedAt } = get();
        if (!lastFetchedAt) return true;
        return Date.now() - lastFetchedAt > CACHE_DURATION_MS;
      },

      fetchProgression: async (force = false) => {
        const state = get();
        if (state.loading) return;
        if (!force && state.progression && !state.isStale()) return;

        set({ loading: true, error: null });

        try {
          const progression = await gamificationService.getProgression();
          set({
            progression,
            loading: false,
            lastFetchedAt: Date.now(),
            error: null,
          });
        } catch (err) {
          console.error('Failed to fetch progression:', err);
          set({
            error: err instanceof Error ? err : new Error('Failed to fetch progression'),
            loading: false,
          });
        }
      },

      fetchAchievements: async (force = false) => {
        const state = get();
        if (!force && state.achievements.length > 0 && !state.isStale()) return;

        try {
          const { achievements } = await gamificationService.getAchievements();
          set({ achievements });
        } catch (err) {
          console.error('Failed to fetch achievements:', err);
        }
      },

      fetchAccessories: async () => {
        try {
          const { accessories } = await gamificationService.getAccessories();
          set({ accessories });
        } catch (err) {
          console.error('Failed to fetch accessories:', err);
        }
      },

      fetchMascot: async () => {
        try {
          const mascot = await gamificationService.getMascot();
          set({ mascot });
        } catch (err) {
          console.error('Failed to fetch mascot:', err);
        }
      },

      fetchChallenge: async () => {
        try {
          const { challenge } = await gamificationService.getDailyChallenge();
          set({ challenge });
        } catch (err) {
          console.error('Failed to fetch challenge:', err);
        }
      },

      fetchLeaderboard: async () => {
        try {
          const leaderboard = await gamificationService.getLeaderboard();
          set({ leaderboard });
        } catch (err) {
          console.error('Failed to fetch leaderboard:', err);
        }
      },

      fetchPendingNotifications: async () => {
        try {
          const { notifications } = await gamificationService.getAchievementNotifications();
          if (notifications.length > 0) {
            set({ pendingNotifications: notifications });
          }
        } catch (err) {
          console.error('Failed to fetch pending notifications:', err);
        }
      },

      equipAccessory: async (accessoryId: string) => {
        try {
          const { success } = await gamificationService.equipAccessory(accessoryId);
          if (success) {
            // Update local state
            const { accessories } = get();
            const accessory = accessories.find((a) => a.id === accessoryId);
            if (accessory) {
              const updatedAccessories = accessories.map((a) => {
                if (a.category === accessory.category && a.id !== accessoryId) {
                  return { ...a, equipped: false };
                }
                if (a.id === accessoryId) {
                  return { ...a, equipped: true };
                }
                return a;
              });
              set({ accessories: updatedAccessories });
            }
            // Refresh mascot state
            get().fetchMascot();
          }
          return success;
        } catch (err) {
          console.error('Failed to equip accessory:', err);
          return false;
        }
      },

      unequipAccessory: async (accessoryId: string) => {
        try {
          const { success } = await gamificationService.unequipAccessory(accessoryId);
          if (success) {
            // Update local state
            const { accessories } = get();
            const updatedAccessories = accessories.map((a) =>
              a.id === accessoryId ? { ...a, equipped: false } : a
            );
            set({ accessories: updatedAccessories });
            // Refresh mascot state
            get().fetchMascot();
          }
          return success;
        } catch (err) {
          console.error('Failed to unequip accessory:', err);
          return false;
        }
      },

      dismissNotification: (achievementId: string) => {
        const { pendingNotifications } = get();
        set({
          pendingNotifications: pendingNotifications.filter((n) => n.id !== achievementId),
        });
      },

      markNotificationsRead: async () => {
        const { pendingNotifications } = get();
        if (pendingNotifications.length === 0) return;

        try {
          const ids = pendingNotifications.map((n) => n.id);
          await gamificationService.markAchievementsNotified(ids);
          set({ pendingNotifications: [] });
        } catch (err) {
          console.error('Failed to mark notifications read:', err);
        }
      },

      clearCache: () => {
        set({
          progression: null,
          achievements: [],
          accessories: [],
          mascot: null,
          challenge: null,
          leaderboard: null,
          pendingNotifications: [],
          lastFetchedAt: null,
          error: null,
        });
      },
    }),
    {
      name: 'gamification-store',
      partialize: (state) => ({
        progression: state.progression,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);

// Convenience selectors
export const selectProgression = (state: GamificationState) => state.progression;
export const selectAchievements = (state: GamificationState) => state.achievements;
export const selectUnlockedAchievements = (state: GamificationState) =>
  state.achievements.filter((a) => a.unlocked);
export const selectLockedAchievements = (state: GamificationState) =>
  state.achievements.filter((a) => !a.unlocked);
export const selectAccessories = (state: GamificationState) => state.accessories;
export const selectMascot = (state: GamificationState) => state.mascot;
export const selectChallenge = (state: GamificationState) => state.challenge;
export const selectLeaderboard = (state: GamificationState) => state.leaderboard;
export const selectPendingNotifications = (state: GamificationState) => state.pendingNotifications;
export const selectGamificationLoading = (state: GamificationState) => state.loading;
