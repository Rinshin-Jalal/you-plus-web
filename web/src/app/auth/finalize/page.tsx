'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { storageService } from '@/services/storage';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { WitnessLogo } from '@/components/ui/WitnessLogo';
import { analytics } from '@/services/analytics';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Smart Redirect Logic after authentication:
 * 
 * Check THREE sources:
 * 1. localStorage for onboarding data (hasLocalData)
 * 2. Backend for onboarding_completed flag (onboardingCompleted)
 * 3. Subscription status (isActive)
 * 
 * Decision matrix:
 * 
 * | Local Data | Backend Onboarded | Subscribed | Destination         |
 * |------------|-------------------|------------|---------------------|
 * | Yes        | -                 | No         | /checkout/welcome   |
 * | Yes        | -                 | Yes        | /setup              |
 * | No         | Yes               | Yes        | /dashboard          |
 * | No         | Yes               | No         | /checkout           |
 * | No         | No                | -          | /onboarding         |
 * 
 * The `next` query param can override for specific flows.
 */

function FinalizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isActive, onboardingCompleted, loading: subLoading } = useSubscription();
  const [statusMessage, setStatusMessage] = useState('Checking authentication...');
  const [hasTrackedLogin, setHasTrackedLogin] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setStatusMessage('Checking authentication...');
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    // Track OAuth login completion (only once)
    if (isAuthenticated && user && !hasTrackedLogin) {
      // Determine provider from user metadata
      const provider = user.app_metadata?.provider as 'google' | 'apple' | 'email' || 'email';
      analytics.authLoginCompleted(provider);
      analytics.identify(user.id, {
        createdAt: user.created_at,
        provider,
      });
      setHasTrackedLogin(true);
    }

    // Wait for subscription/onboarding check
    if (subLoading) {
      setStatusMessage('Checking your account...');
      return;
    }

    // Get the explicit next param (if any)
    const explicitNext = searchParams.get('next');
    
    // Check if user has onboarding data in localStorage
    const hasLocalData = storageService.hasOnboardingData();
    
    if (isDev) {
      console.log('[Finalize] Smart redirect:', { 
        hasLocalData,
        onboardingCompleted,
        isActive, 
        explicitNext 
      });
    }

    // Determine the smart redirect destination
    let destination: string;

    if (explicitNext && explicitNext !== '/dashboard' && explicitNext !== '/') {
      // Honor explicit redirect (e.g., from specific flows)
      destination = explicitNext;
      setStatusMessage('Redirecting...');
    } else if (hasLocalData && !isActive) {
      // Has local onboarding data but not paid → personalized checkout
      destination = '/checkout/welcome';
      setStatusMessage('Taking you to checkout...');
    } else if (hasLocalData && isActive) {
      // Has local onboarding data and paid → setup (push data, collect phone)
      destination = '/setup';
      setStatusMessage('Setting up your account...');
    } else if (!hasLocalData && onboardingCompleted && isActive) {
      // No local data, but backend says onboarded + paid → dashboard (returning user)
      destination = '/dashboard';
      setStatusMessage('Welcome back!');
    } else if (!hasLocalData && onboardingCompleted && !isActive) {
      // Onboarded but subscription lapsed → checkout
      destination = '/checkout';
      setStatusMessage('Renew your subscription...');
    } else if (!hasLocalData && !onboardingCompleted) {
      // Not onboarded yet → start onboarding
      destination = '/onboarding';
      setStatusMessage('Let\'s get started...');
    } else {
      // Fallback to dashboard
      destination = '/dashboard';
      setStatusMessage('Welcome!');
    }

    if (isDev) console.log('[Finalize] Redirecting to:', destination);
    router.replace(destination);
  }, [isAuthenticated, authLoading, subLoading, isActive, onboardingCompleted, router, searchParams, user, hasTrackedLogin]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] relative">
      <GrainOverlay />
      
      {/* Navigation */}
      <nav className="border-b border-white/10 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-6" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316] mb-2">
            Almost there
          </p>
          <h1 className="text-2xl font-black text-white mb-2">
            FINALIZING SIGN-IN
          </h1>
          <p className="text-sm text-white/50">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FinalizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#0A0A0A] relative">
          <nav className="border-b border-white/10">
            <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <WitnessLogo size="sm" showWordmark />
              </span>
            </div>
          </nav>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-6" />
              <p className="text-lg font-medium text-white">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <FinalizeContent />
    </Suspense>
  );
}
