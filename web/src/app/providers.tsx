'use client';

import React, { Suspense } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { AppErrorBoundary } from '@/components/shared/AppErrorBoundary';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';

// Disable noisy console logs in non-development environments
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  console.log = () => {};
  console.debug = () => {};
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <Suspense fallback={null}>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </Suspense>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default Providers;
