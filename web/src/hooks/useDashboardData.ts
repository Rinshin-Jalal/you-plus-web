'use client';

import { useEffect } from 'react';
import {
  useDashboardStore,
  selectDashboardData,
  selectDashboardLoading,
  selectDashboardError,
  selectStats,
} from '@/stores/dashboardStore';
import type { DashboardStats } from '@/types';

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

export const useDashboardData = () => {
  const data = useDashboardStore(selectDashboardData);
  const loading = useDashboardStore(selectDashboardLoading);
  const error = useDashboardStore(selectDashboardError);
  const fetchData = useDashboardStore((state) => state.fetchData);
  const refresh = useDashboardStore((state) => state.refresh);

  // Fetch on mount (will use cache if available and fresh)
  useEffect(() => {
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
 * Hook to get just the stats (uses cached data from store)
 */
export const useStats = () => {
  const stats = useDashboardStore(selectStats);
  const loading = useDashboardStore(selectDashboardLoading);
  const fetchData = useDashboardStore((state) => state.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
