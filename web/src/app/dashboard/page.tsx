'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
    const router = useRouter();

    const handleLogout = () => {
        router.push('/');
    };

    const handleJoinCall = () => {
        router.push('/call');
    };

    return <Dashboard onLogout={handleLogout} onJoinCall={handleJoinCall} />;
}
