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
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-lg font-medium">Finalizing sign-in...</p>
      </div>
    </div>
  );
}

export default function FinalizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <FinalizeContent />
    </Suspense>
  );
}
