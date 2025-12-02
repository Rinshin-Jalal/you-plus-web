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
        // After onboarding, go to checkout (not dashboard)
        // Checkout will handle auth check and redirect to signup if needed
        router.push('/checkout');
    };

    return <OnboardingFlow onFinish={completeOnboarding} />;
}
