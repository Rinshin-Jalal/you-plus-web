/**
 * useSubscription Hook
 * Manages subscription status with caching and automatic refresh
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { paymentService, SubscriptionStatus } from '@/services/payment';
import { useAuth } from './useAuth';

export interface SubscriptionInfo {
  status: 'active' | 'expired' | 'none' | 'loading';
  displayText: string;
  expiresAt: string | null;
  needsAction: boolean;
  hasActiveSubscription: boolean;
  isTrial: boolean;
  entitlement: string | null;
  willRenew: boolean;
  productId: string | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cachedSubscription: SubscriptionStatus | null = null;
let cacheTimestamp: number = 0;

/**
 * useSubscription Hook
 * Fetches and caches subscription status, automatically refreshes when needed
 */
export function useSubscription() {
  const { isAuthenticated, user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    status: 'loading',
    displayText: 'Loading subscription...',
    expiresAt: null,
    needsAction: false,
    hasActiveSubscription: false,
    isTrial: false,
    entitlement: null,
    willRenew: false,
    productId: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch subscription status from API
   */
  const fetchSubscription = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated) {
      setSubscription({
        status: 'none',
        displayText: 'Not authenticated',
        expiresAt: null,
        needsAction: true,
        hasActiveSubscription: false,
        isTrial: false,
        entitlement: null,
        willRenew: false,
        productId: null,
      });
      setLoading(false);
      return;
    }

    try {
      // Use cache if available and not expired (unless force refresh)
      const now = Date.now();
      if (!forceRefresh && cachedSubscription && (now - cacheTimestamp) < CACHE_DURATION) {
        const info = await paymentService.getSubscriptionInfo();
        setSubscription({
          ...info,
          hasActiveSubscription: cachedSubscription.hasActiveSubscription,
          isTrial: cachedSubscription.isTrial,
          entitlement: cachedSubscription.entitlement,
          willRenew: cachedSubscription.willRenew,
          productId: cachedSubscription.productId,
        });
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch fresh data
      const [status, info] = await Promise.all([
        paymentService.getSubscriptionStatus(),
        paymentService.getSubscriptionInfo(),
      ]);

      // Update cache
      cachedSubscription = status;
      cacheTimestamp = now;

      // Merge status and info
      setSubscription({
        ...info,
        hasActiveSubscription: status.hasActiveSubscription,
        isTrial: status.isTrial,
        entitlement: status.entitlement,
        willRenew: status.willRenew,
        productId: status.productId,
      });
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription status');
      setSubscription({
        status: 'none',
        displayText: 'Unable to load subscription',
        expiresAt: null,
        needsAction: false,
        hasActiveSubscription: false,
        isTrial: false,
        entitlement: null,
        willRenew: false,
        productId: null,
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Refresh subscription status (bypasses cache)
   */
  const refresh = useCallback(() => {
    return fetchSubscription(true);
  }, [fetchSubscription]);

  /**
   * Clear cache (useful after payment changes)
   */
  const clearCache = useCallback(() => {
    cachedSubscription = null;
    cacheTimestamp = 0;
    return refresh();
  }, [refresh]);

  // Fetch subscription on mount and when user changes
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription, user?.id]);

  // Auto-refresh every 5 minutes when active subscription
  useEffect(() => {
    if (!subscription.hasActiveSubscription) return;

    const interval = setInterval(() => {
      fetchSubscription();
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [subscription.hasActiveSubscription, fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    refresh,
    clearCache,
    isActive: subscription.hasActiveSubscription,
    needsPayment: subscription.needsAction,
    isTrial: subscription.isTrial,
  };
}

/**
 * Hook to require active subscription
 * Redirects to paywall if no active subscription
 */
export function useRequireSubscription(redirectTo: string = '/checkout') {
  const { subscription, loading } = useSubscription();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && !subscription.hasActiveSubscription) {
      // Redirect to paywall
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [loading, isAuthenticated, subscription.hasActiveSubscription, redirectTo]);

  return { subscription, loading };
}

/**
 * Hook to check if payment method needs update
 */
export function usePaymentStatus() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [checking, setChecking] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!isAuthenticated) {
        setNeedsUpdate(false);
        setChecking(false);
        return;
      }

      try {
        const result = await paymentService.needsPaymentUpdate();
        setNeedsUpdate(result);
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkPaymentStatus();
  }, [isAuthenticated]);

  return { needsUpdate, checking };
}
