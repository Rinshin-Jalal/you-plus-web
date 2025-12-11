'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { isOnboardingComplete } from '@/data/onboardingSteps';
import { audioService } from '@/services/audio';
import { storageService } from '@/services/storage';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { FullPageLoader } from '@/components/ui/Loaders';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Onboarding Page
 * 
 * User should NOT see this page if:
 * 1. They have onboarding data in localStorage (partial/complete)
 * 2. They are authenticated AND backend says onboarding_completed = true
 * 
 * Instead, redirect them to the appropriate next step.
 */

export default function OnboardingPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { onboardingCompleted, isActive, loading: subLoading } = useSubscription();
    const [checking, setChecking] = useState(true);
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

    useEffect(() => {
        audioService.init();
    }, []);

    useEffect(() => {
        // Wait for auth to load if user might be authenticated
        if (authLoading) return;

        // Check localStorage first (works for everyone)
        const localData = storageService.getData();
        // Import strictly typed function from data/onboardingSteps
        const isComplete = isOnboardingComplete(localData);

        if (isComplete) {
            // User has COMPLETE onboarding data in localStorage
            // Redirect to setup which will handle auth/subscription checks
            if (isDev) console.log('[Onboarding] Has complete local data, redirecting to /setup');
            router.replace('/setup');
            return;
        } else if (Object.keys(localData).length > 0) {
            if (isDev) console.log('[Onboarding] Has partial data, resuming flow...');
        }

        // If authenticated, also check backend onboarding status
        if (isAuthenticated) {
            if (subLoading) return; // Wait for subscription/onboarding status

            if (onboardingCompleted) {
                // User already completed onboarding on backend
                // Redirect based on subscription status
                if (isActive) {
                    if (isDev) console.log('[Onboarding] Already onboarded + subscribed, redirecting to /dashboard');
                    router.replace('/dashboard');
                } else {
                    if (isDev) console.log('[Onboarding] Already onboarded but not subscribed, redirecting to /checkout');
                    router.replace('/checkout');
                }
                return;
            }
        }

        // No local data and not onboarded on backend - show onboarding
        if (isDev) console.log('[Onboarding] Showing onboarding flow');
        setChecking(false);
        setShouldShowOnboarding(true);
    }, [authLoading, subLoading, isAuthenticated, onboardingCompleted, isActive, router]);

    const completeOnboarding = () => {
        // After onboarding, go to /setup which handles:
        // - Auth check (redirects to login if needed)
        // - Subscription check (redirects to checkout if needed)  
        // - Push onboarding data to backend
        // - Redirect to dashboard
        router.push('/setup');
    };

    // Show loading while checking status
    if (checking || authLoading || (isAuthenticated && subLoading)) {
        return <FullPageLoader message="Loading..." />;
    }

    // Show onboarding flow
    if (shouldShowOnboarding) {
        return <OnboardingFlow onFinish={completeOnboarding} />;
    }

    // Fallback loading state (should not reach here)
    return <FullPageLoader message="Redirecting..." />;
}
