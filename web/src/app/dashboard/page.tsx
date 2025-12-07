'use client';

import React from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import { authService } from '@/services/auth';

export default function DashboardPage() {
    const handleLogout = async () => {
        try {
            await authService.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('[DASHBOARD] Sign out error:', error);
            window.location.href = '/';
        }
    };

    return <Dashboard onLogout={handleLogout} />;
}
