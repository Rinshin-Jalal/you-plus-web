'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LiveCallInterface from '@/components/call/LiveCallInterface';
import { audioService } from '@/services/audio';

export default function CallPage() {
    const router = useRouter();

    React.useEffect(() => {
        audioService.init();
    }, []);

    const handleEndCall = () => {
        router.push('/dashboard');
    };

    return <LiveCallInterface onEndCall={handleEndCall} />;
}
