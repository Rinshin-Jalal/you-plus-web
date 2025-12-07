'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { audioService } from '@/services/audio';

export default function OnboardingPage() {
    const router = useRouter();

    React.useEffect(() => {
        audioService.init();
    }, []);

    const completeOnboarding = () => {
        // After onboarding, go to /setup which handles:
        // - Auth check (redirects to login if needed)
        // - Subscription check (redirects to checkout if needed)  
        // - Push onboarding data to backend
        // - Redirect to dashboard
        router.push('/setup');
    };

    return <OnboardingFlow onFinish={completeOnboarding} />;
}
