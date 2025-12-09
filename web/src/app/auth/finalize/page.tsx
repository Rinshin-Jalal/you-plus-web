'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { storageService } from '@/services/storage';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { WitnessLogo } from '@/components/ui/WitnessLogo';

/**
 * Smart Redirect Logic:
 * 
 * 1. Has onboarding data + NOT paid → /checkout/welcome (personalized checkout)
 * 2. Has onboarding data + paid → /setup (push data, collect phone)
 * 3. No onboarding data + paid → /dashboard (returning user)
 * 4. No onboarding data + NOT paid → /checkout (generic checkout)
 * 
 * The `next` query param can override this for specific flows.
 */

function FinalizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const [statusMessage, setStatusMessage] = useState('Checking authentication...');

  useEffect(() => {
    if (authLoading) {
      setStatusMessage('Checking authentication...');
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    // Wait for subscription check
    if (subLoading) {
      setStatusMessage('Checking subscription...');
      return;
    }

    // Get the explicit next param (if any)
    const explicitNext = searchParams.get('next');
    
    // Check if user has onboarding data in localStorage
    const hasOnboardingData = storageService.hasOnboardingData();
    
    console.log('[Finalize] Smart redirect:', { 
      hasOnboardingData, 
      isActive, 
      explicitNext 
    });

    // Determine the smart redirect destination
    let destination: string;

    if (explicitNext && explicitNext !== '/dashboard') {
      // Honor explicit redirect (e.g., from specific flows)
      destination = explicitNext;
    } else if (hasOnboardingData && !isActive) {
      // Has onboarding data but not paid → personalized checkout
      destination = '/checkout/welcome';
      setStatusMessage('Taking you to checkout...');
    } else if (hasOnboardingData && isActive) {
      // Has onboarding data and paid → setup (push data, collect phone)
      destination = '/setup';
      setStatusMessage('Setting up your account...');
    } else if (!hasOnboardingData && isActive) {
      // No onboarding data but paid → dashboard (returning user)
      destination = '/dashboard';
      setStatusMessage('Welcome back!');
    } else {
      // No onboarding data and not paid → generic checkout
      destination = '/checkout';
      setStatusMessage('Taking you to checkout...');
    }

    console.log('[Finalize] Redirecting to:', destination);
    router.replace(destination);
  }, [isAuthenticated, authLoading, subLoading, isActive, router, searchParams]);

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
          <h1 className="text-2xl font-black text-white mb-2">
            FINALIZING SIGN-IN
          </h1>
          <p className="text-sm text-white/50">
            {statusMessage}
          </p>
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
