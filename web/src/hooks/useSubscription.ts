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
      const now = Date.now();
      if (!forceRefresh && cachedSubscription && (now - cacheTimestamp) < CACHE_DURATION) {
        const info = await paymentService.getSubscriptionInfo();
        setSubscription({
          ...info,
          hasActiveSubscription: cachedSubscription.hasActiveSubscription,
          isTrial: cachedSubscription.isTrial ?? false,
          entitlement: cachedSubscription.entitlement ?? null,
          willRenew: cachedSubscription.willRenew ?? false,
          productId: cachedSubscription.productId ?? null,
        });
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      const [status, info] = await Promise.all([
        paymentService.getSubscriptionStatus(),
        paymentService.getSubscriptionInfo(),
      ]);

      cachedSubscription = status;
      cacheTimestamp = now;

      setSubscription({
        ...info,
        hasActiveSubscription: status.hasActiveSubscription,
        isTrial: status.isTrial ?? false,
        entitlement: status.entitlement ?? null,
        willRenew: status.willRenew ?? false,
        productId: status.productId ?? null,
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

  const refresh = useCallback(() => {
    return fetchSubscription(true);
  }, [fetchSubscription]);

  const clearCache = useCallback(() => {
    cachedSubscription = null;
    cacheTimestamp = 0;
    return refresh();
  }, [refresh]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription, user?.id]);

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
