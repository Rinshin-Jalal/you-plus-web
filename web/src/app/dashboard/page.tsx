'use client';

import React, { useEffect, useRef } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import { authService } from '@/services/auth';
import { ActiveUserGuard } from '@/components/shared/AuthGuard';
import { analytics } from '@/services/analytics';

/**
 * Dashboard Page - Protected by ActiveUserGuard
 * 
 * User must meet ALL 3 conditions to access:
 * 1. Authenticated
 * 2. Onboarded
 * 3. Subscribed
 * 
 * If any condition is missing, redirects to the appropriate step.
 */
export default function DashboardPage() {
    const hasTrackedView = useRef(false);
    
    // Track dashboard view (only once per mount)
    useEffect(() => {
        if (!hasTrackedView.current) {
            analytics.dashboardViewed();
            hasTrackedView.current = true;
        }
    }, []);
    
    const handleLogout = async () => {
        try {
            // Track logout
            analytics.authLogout();
            await authService.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('[DASHBOARD] Sign out error:', error);
            window.location.href = '/';
        }
    };

    return (
        <ActiveUserGuard>
            <Dashboard onLogout={handleLogout} />
        </ActiveUserGuard>
    );
}
