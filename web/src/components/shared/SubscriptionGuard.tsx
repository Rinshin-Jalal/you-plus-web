/**
 * SubscriptionGuard Component
 * Protects routes that require an active subscription
 * Shows paywall if subscription is not active
 */

'use client';

import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Paywall } from './Paywall';

export interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  paywallMessage?: string;
  allowExpired?: boolean; // Allow recently expired subscriptions
}

export function SubscriptionGuard({
  children,
  fallback,
  paywallMessage,
  allowExpired = false,
}: SubscriptionGuardProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();

  // Show loading state
  if (authLoading || subLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Must be authenticated first
  if (!isAuthenticated) {
    return null; // AuthGuard should handle this
  }

  // Check subscription status
  const hasAccess = subscription.hasActiveSubscription || 
    (allowExpired && subscription.status === 'expired' && subscription.expiresAt);

  if (!hasAccess) {
    // Determine paywall reason
    const reason = subscription.status === 'expired' 
      ? 'expired' 
      : subscription.needsAction 
      ? 'payment_failed' 
      : 'no_subscription';

    return <Paywall reason={reason} message={paywallMessage} />;
  }

  // Render children if has active subscription
  return <>{children}</>;
}
