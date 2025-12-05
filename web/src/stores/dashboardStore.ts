import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth } from '@/services/supabase';
import type {
  DashboardData,
  DashboardStats,
  User,
  Identity,
  Status,
  CallMemory,
  CallAnalytics,
  Subscription,
} from '@/types';

const DEFAULT_STATS: DashboardStats = {
  currentStreak: 0,
  longestStreak: 0,
  trustScore: 50,
  promisesKeptTotal: 0,
  promisesBrokenTotal: 0,
  promisesKeptLast7Days: 0,
  promisesBrokenLast7Days: 0,
  totalCalls: 0,
  successRate: 0,
};

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

interface DashboardState {
  // Data
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  
  // Cache tracking
  lastFetchedAt: number | null;
  userId: string | null;
  
  // Actions
  fetchData: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  clearCache: () => void;
  
  // Computed helpers
  isStale: () => boolean;
}

function calculateNextCallTime(callTime: string | undefined): Date | null {
  if (!callTime) return null;

  try {
    const [hours, minutes] = callTime.split(':').map(Number);
    
    const now = new Date();
    const nextCall = new Date();
    nextCall.setHours(hours, minutes, 0, 0);
    
    if (now > nextCall) {
      nextCall.setDate(nextCall.getDate() + 1);
    }
    
    return nextCall;
  } catch {
    return null;
  }
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      data: null,
      loading: false,
      error: null,
      lastFetchedAt: null,
      userId: null,

      isStale: () => {
        const { lastFetchedAt } = get();
        if (!lastFetchedAt) return true;
        return Date.now() - lastFetchedAt > CACHE_DURATION_MS;
      },

      fetchData: async (force = false) => {
        const state = get();
        
        // Skip if already loading
        if (state.loading) return;
        
        // Check if we have valid cached data
        if (!force && state.data && !state.isStale()) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const user = await auth.getUser();
          if (!user) {
            set({ data: null, loading: false, userId: null });
            return;
          }

          // If user changed, clear old data
          if (state.userId && state.userId !== user.id) {
            set({ data: null, lastFetchedAt: null });
          }

          const dashboardData = await db.getDashboardData(user.id);
          const stats = db.computeStats(dashboardData.status);
          const nextCallTime = calculateNextCallTime(dashboardData.identity?.call_time);

          set({
            data: {
              user: dashboardData.user,
              identity: dashboardData.identity,
              status: dashboardData.status,
              callMemory: dashboardData.callMemory,
              recentCalls: dashboardData.recentCalls,
              subscription: dashboardData.subscription,
              stats,
              nextCallTime,
            },
            loading: false,
            lastFetchedAt: Date.now(),
            userId: user.id,
            error: null,
          });
        } catch (err) {
          console.error('Failed to fetch dashboard data:', err);
          set({
            error: err instanceof Error ? err : new Error('Failed to fetch dashboard data'),
            loading: false,
          });
        }
      },

      refresh: async () => {
        await get().fetchData(true);
      },

      clearCache: () => {
        set({
          data: null,
          lastFetchedAt: null,
          userId: null,
          error: null,
        });
      },
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        // Only persist these fields
        data: state.data,
        lastFetchedAt: state.lastFetchedAt,
        userId: state.userId,
      }),
      // Handle Date serialization for nextCallTime
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          const parsed = JSON.parse(str);
          
          // Rehydrate nextCallTime as Date
          if (parsed?.state?.data?.nextCallTime) {
            parsed.state.data.nextCallTime = new Date(parsed.state.data.nextCallTime);
          }
          
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

// Convenience selectors
export const selectDashboardData = (state: DashboardState) => state.data;
export const selectDashboardLoading = (state: DashboardState) => state.loading;
export const selectDashboardError = (state: DashboardState) => state.error;
export const selectStats = (state: DashboardState) => state.data?.stats ?? DEFAULT_STATS;
export const selectUser = (state: DashboardState) => state.data?.user ?? null;
export const selectIdentity = (state: DashboardState) => state.data?.identity ?? null;
export const selectStatus = (state: DashboardState) => state.data?.status ?? null;
export const selectNextCallTime = (state: DashboardState) => state.data?.nextCallTime ?? null;
