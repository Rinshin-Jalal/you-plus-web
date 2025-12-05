'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentService } from '@/services/payment';
import { storageService } from '@/services/storage';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export default function BillingSuccessPage() {
  const router = useRouter();
  const { isAuthenticated, signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // When user becomes authenticated, process everything and go to dashboard
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      processAndRedirect();
    }
  }, [isAuthenticated, authLoading]);

  const processAndRedirect = async () => {
    setProcessing(true);

    try {
      // Get guest checkout ID and onboarding data from localStorage
      const guestId = localStorage.getItem('youplus_guest_checkout_id') || '';
      const onboardingData = storageService.getData();
      const hasOnboardingData = Object.keys(onboardingData).length > 0;

      console.log('[billing-success] Processing:', { guestId, hasOnboardingData });

      // Link payment to auth user
      const result = await paymentService.linkGuestCheckout(guestId, onboardingData);

      if (result.success) {
        console.log('[billing-success] Link succeeded, pushing onboarding data if present');

        // Push onboarding data to backend now that we are authenticated
        if (hasOnboardingData) {
          const push = await storageService.pushOnboardingData();
          if (!push.success) {
            console.error('[billing-success] Onboarding push failed:', push.error);
          } else {
            console.log('[billing-success] Onboarding data pushed');
          }
        } else {
          console.log('[billing-success] No onboarding data found in localStorage');
        }

        // Clear local cache
        localStorage.removeItem('youplus_guest_checkout_id');
        localStorage.removeItem('youplus_pending_plan_id');
        storageService.clearOnboardingData();
      } else {
        console.error('[billing-success] Link failed:', result.error);
        // Still proceed; webhook might handle subscription
      }

      // Go to setup page (post-signup onboarding)
      router.replace('/setup');
    } catch (err) {
      console.error('[billing-success] Error:', err);
      // Still try to go to setup
      router.replace('/setup');
    }
  };

  const handleSignIn = async (provider: 'google' | 'apple') => {
    setSigningIn(true);
    setError(null);

    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=/billing/success`;
      const result = provider === 'google'
        ? await signInWithGoogle(callbackUrl)
        : await signInWithApple(callbackUrl);

      if (result.error) {
        setError('Sign in failed. Please try again.');
        setSigningIn(false);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Sign in failed. Please try again.');
      setSigningIn(false);
    }
  };

  // Loading states
  if (authLoading || processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mx-auto" />
          <p className="text-gray-700">
            {processing ? 'Setting up your account...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Main UI - Sign in to activate
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 text-gray-900">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <svg
            className="h-16 w-16 text-green-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-lg text-gray-700">
            Sign in to activate your subscription
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleSignIn('google')}
            className="w-full flex items-center justify-center gap-3"
            disabled={signingIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {signingIn ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <Button
            onClick={() => handleSignIn('apple')}
            variant="secondary"
            className="w-full flex items-center justify-center gap-3"
            disabled={signingIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            {signingIn ? 'Signing in...' : 'Continue with Apple'}
          </Button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <p className="text-sm text-gray-600">
          Your payment is secure. Sign in to activate your subscription.
        </p>
      </div>
    </div>
  );
}
