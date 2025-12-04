'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/services/supabase';
import type { 
  DashboardData, 
  DashboardStats, 
  User, 
  Identity, 
  Status, 
  CallMemory, 
  CallAnalytics,
  Subscription 
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

/**
 * Calculate next call time based on identity.call_time
 */
function calculateNextCallTime(callTime: string | undefined): Date | null {
  if (!callTime) return null;

  try {
    // Parse call_time format "HH:MM:SS"
    const [hours, minutes] = callTime.split(':').map(Number);
    
    const now = new Date();
    const nextCall = new Date();
    nextCall.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (now > nextCall) {
      nextCall.setDate(nextCall.getDate() + 1);
    }
    
    return nextCall;
  } catch {
    return null;
  }
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const user = await auth.getUser();
      if (!user) {
        setData(null);
        setLoading(false);
        return;
      }

      // Fetch all dashboard data in parallel
      const dashboardData = await db.getDashboardData(user.id);
      
      // Compute stats from status
      const stats = db.computeStats(dashboardData.status);
      
      // Calculate next call time
      const nextCallTime = calculateNextCallTime(dashboardData.identity?.call_time);

      setData({
        user: dashboardData.user,
        identity: dashboardData.identity,
        status: dashboardData.status,
        callMemory: dashboardData.callMemory,
        recentCalls: dashboardData.recentCalls,
        subscription: dashboardData.subscription,
        stats,
        nextCallTime,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh function for manual refresh
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error,
    refresh,
    // Convenience accessors
    user: data?.user ?? null,
    identity: data?.identity ?? null,
    status: data?.status ?? null,
    stats: data?.stats ?? DEFAULT_STATS,
    nextCallTime: data?.nextCallTime ?? null,
    recentCalls: data?.recentCalls ?? [],
    subscription: data?.subscription ?? null,
  };
};

/**
 * Hook to get just the stats (lighter weight)
 */
export const useStats = () => {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = await auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: status } = await db.getStatus(user.id);
        setStats(db.computeStats(status));
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};

/**
 * Hook to get identity status label based on trust score
 */
export const useIdentityStatus = () => {
  const { stats, loading } = useStats();

  const getStatusLabel = (trustScore: number): string => {
    if (trustScore >= 80) return 'LEGENDARY';
    if (trustScore >= 60) return 'RELIABLE';
    if (trustScore >= 40) return 'REBUILDING';
    if (trustScore >= 20) return 'STRUGGLING';
    return 'PATHETIC';
  };

  const getStatusColor = (trustScore: number): string => {
    if (trustScore >= 80) return 'text-yellow-400'; // Gold
    if (trustScore >= 60) return 'text-green-400';
    if (trustScore >= 40) return 'text-blue-400';
    if (trustScore >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  return {
    statusLabel: getStatusLabel(stats.trustScore),
    statusColor: getStatusColor(stats.trustScore),
    trustScore: stats.trustScore,
    loading,
  };
};
