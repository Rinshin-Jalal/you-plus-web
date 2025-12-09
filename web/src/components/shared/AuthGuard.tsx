'use client';

import React, { useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/Loaders';
import { storageService } from '@/services/storage';

export interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard - Only checks authentication
 * Use this for pages that just need auth (like settings, profile)
 */
function AuthGuardInner({ children, redirectTo = '/auth/login', fallback }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const targetPath = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const redirectUrl = useMemo(() => {
    const separator = redirectTo.includes('?') ? '&' : '?';
    return `${redirectTo}${separator}next=${encodeURIComponent(targetPath)}`;
  }, [redirectTo, targetPath]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, loading, redirectUrl, router]);

  if (loading) {
    return fallback || <FullPageLoader message="Checking authentication…" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function AuthGuard(props: AuthGuardProps) {
  return (
    <Suspense fallback={props.fallback || <FullPageLoader message="Loading…" />}>
      <AuthGuardInner {...props} />
    </Suspense>
  );
}

/**
 * ActiveUserGuard - Checks ALL 3 conditions:
 * 1. Authenticated
 * 2. Onboarded (backend flag OR has pending local data to push)
 * 3. Subscribed
 * 
 * Redirects users to the appropriate step if any condition is missing.
 */
export interface ActiveUserGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ActiveUserGuardInner({ children, fallback }: ActiveUserGuardProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isActive, onboardingCompleted, loading: subLoading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for both auth and subscription checks
    if (authLoading || subLoading) return;

    // Check 1: Must be authenticated
    if (!isAuthenticated) {
      console.log('[ActiveUserGuard] Not authenticated, redirecting to login');
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check local storage for pending onboarding data
    const hasLocalOnboardingData = storageService.hasOnboardingData();

    // Check 2: Must be onboarded (either backend flag or has local data to push)
    if (!onboardingCompleted && !hasLocalOnboardingData) {
      console.log('[ActiveUserGuard] Not onboarded, redirecting to onboarding');
      router.replace('/onboarding');
      return;
    }

    // If has local data but not pushed yet, redirect to setup to push it
    if (hasLocalOnboardingData && !onboardingCompleted) {
      console.log('[ActiveUserGuard] Has local data to push, redirecting to setup');
      router.replace('/setup');
      return;
    }

    // Check 3: Must be subscribed
    if (!isActive) {
      console.log('[ActiveUserGuard] Not subscribed, redirecting to checkout');
      router.replace('/checkout');
      return;
    }

    // All checks passed!
    console.log('[ActiveUserGuard] All checks passed - user is active');
  }, [authLoading, subLoading, isAuthenticated, isActive, onboardingCompleted, router, pathname]);

  // Show loading while checking
  if (authLoading || subLoading) {
    return fallback || <FullPageLoader message="Loading..." />;
  }

  // If any check fails, we're redirecting - don't render children
  const hasLocalOnboardingData = typeof window !== 'undefined' && storageService.hasOnboardingData();
  const isFullyActive = isAuthenticated && isActive && (onboardingCompleted || hasLocalOnboardingData);
  
  // Special case: has local data to push - redirect to setup
  if (hasLocalOnboardingData && !onboardingCompleted) {
    return null;
  }

  if (!isFullyActive) {
    return null;
  }

  return <>{children}</>;
}

export function ActiveUserGuard(props: ActiveUserGuardProps) {
  return (
    <Suspense fallback={props.fallback || <FullPageLoader message="Loading…" />}>
      <ActiveUserGuardInner {...props} />
    </Suspense>
  );
}
