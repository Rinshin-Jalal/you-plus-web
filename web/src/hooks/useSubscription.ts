'use client';

import { useState, useEffect, useCallback } from 'react';
import { paymentService, SubscriptionStatus, SubscriptionResponse } from '@/services/payment';
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
let cachedResponse: SubscriptionResponse | null = null;
let cacheTimestamp: number = 0;
let cachedUserId: string | null = null;

// Standalone cache clear function for use during signout
export function clearSubscriptionCache() {
  cachedResponse = null;
  cachedUserId = null;
  cacheTimestamp = 0;
}

export function useSubscription() {
  const { isAuthenticated, user } = useAuth();
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
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
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async (force: boolean = false) => {
    const userId = user?.id ?? null;

    if (!isAuthenticated || !userId) {
      setSubscription(prev => ({ ...prev, status: 'none', hasActiveSubscription: false }));
      setOnboardingCompleted(false);
      setLoading(false);
      setLoadedUserId(null);
      cachedResponse = null;
      cachedUserId = null;
      cacheTimestamp = 0;
      return;
    }

    // Reuse cached result when the same user is already loaded recently.
    const now = Date.now();
    const hasValidCache =
      !force &&
      cachedResponse &&
      cachedUserId === userId &&
      now - cacheTimestamp < CACHE_DURATION &&
      loadedUserId === userId;

    if (hasValidCache) {
      // Nothing to do; avoid triggering re-renders on focus/tab changes.
      setLoading(false);
      return;
    }

    setLoading(true);

    const applyResponse = (fullResponse: SubscriptionResponse) => {
      const sub = fullResponse.subscription;
      const isOnboarded = fullResponse.onboardingCompleted;

      let status: 'active' | 'expired' | 'none' = 'none';
      let displayText = 'No Active Subscription';
      let needsAction = true;

      if (sub.hasActiveSubscription && sub.status === 'active') {
        status = 'active';
        displayText = 'Subscription Active';
        needsAction = false;
      } else if (sub.status === 'past_due') {
        status = 'expired';
        displayText = 'Payment Failed - Update Required';
        needsAction = true;
      } else if (sub.status === 'cancelled') {
        status = 'expired';
        displayText = 'Subscription Cancelled';
        needsAction = true;
      }

      setSubscription({
        status,
        displayText,
        expiresAt: sub.currentPeriodEnd,
        needsAction,
        hasActiveSubscription: sub.hasActiveSubscription,
        isTrial: sub.isTrial ?? false,
        entitlement: sub.entitlement ?? null,
        willRenew: sub.willRenew ?? false,
        productId: sub.productId ?? null,
      });
      setOnboardingCompleted(isOnboarded);
      setLoadedUserId(userId);
      setError(null);
    };

    try {
      // Use getFullSubscriptionStatus to get both pieces of info in one call
      const fullResponse = await paymentService.getFullSubscriptionStatus();

      cachedResponse = fullResponse;
      cachedUserId = userId;
      cacheTimestamp = Date.now();

      applyResponse(fullResponse);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, loadedUserId]);

  // Initial fetch
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Refresh function
  const refresh = useCallback(() => {
    return fetchSubscription(true);
  }, [fetchSubscription]);

  // Clear cache (noop now, but kept for API compatibility)
  const clearCache = useCallback(() => {
    cachedResponse = null;
    cachedUserId = null;
    cacheTimestamp = 0;
    return fetchSubscription(true);
  }, [fetchSubscription]);

  // Determine effective loading state
  // We are loading if:
  // 1. The internal loading state is true
  // 2. We are authenticated but haven't loaded data for THIS user yet
  const effectiveLoading = loading || (isAuthenticated && !!user && loadedUserId !== user.id);

  return {
    subscription,
    loading: effectiveLoading,
    error,
    refresh,
    clearCache,
    isActive: subscription.hasActiveSubscription,
    needsPayment: subscription.needsAction,
    isTrial: subscription.isTrial,
    onboardingCompleted,
  };
}

export function useRequireSubscription(redirectTo: string = '/checkout') {
  const { subscription, loading } = useSubscription();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && !subscription.hasActiveSubscription) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [loading, isAuthenticated, subscription.hasActiveSubscription, redirectTo]);

  return { subscription, loading };
}

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
