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
        router.push('/dashboard');
    };

    return <OnboardingFlow onFinish={completeOnboarding} />;
}
