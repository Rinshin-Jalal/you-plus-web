'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { WitnessLogo } from '@/components/ui/WitnessLogo';

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
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] relative">
      <GrainOverlay />
      
      {/* Navigation */}
      <nav className="border-b border-white/10 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-6" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316] mb-2">
            Almost there
          </p>
          <h1 className="text-2xl font-black text-white">
            FINALIZING SIGN-IN
          </h1>
        </div>
      </div>
    </div>
  );
}

export default function FinalizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#0A0A0A] relative">
          <nav className="border-b border-white/10">
            <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <WitnessLogo size="sm" showWordmark />
              </span>
            </div>
          </nav>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-6" />
              <p className="text-lg font-medium text-white">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <FinalizeContent />
    </Suspense>
  );
}
