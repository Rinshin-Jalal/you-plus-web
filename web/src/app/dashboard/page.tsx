'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import { authService } from '@/services/auth';

export default function DashboardPage() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await authService.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('[DASHBOARD] Sign out error:', error);
            window.location.href = '/';
        }
    };

    const handleJoinCall = () => {
        router.push('/call');
    };

    return <Dashboard onLogout={handleLogout} onJoinCall={handleJoinCall} />;
}
