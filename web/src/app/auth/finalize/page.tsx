'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function FinalizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const next = searchParams.get('next') || '/dashboard';

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    router.replace(next);
  }, [isAuthenticated, authLoading, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto" />
        <p className="text-lg font-medium">Finalizing sign-in...</p>
      </div>
    </div>
  );
}

export default function FinalizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <FinalizeContent />
    </Suspense>
  );
}
