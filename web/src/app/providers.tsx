'use client';

import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { AppErrorBoundary } from '@/components/shared/AppErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default Providers;
