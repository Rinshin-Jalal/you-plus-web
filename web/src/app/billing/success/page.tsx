'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Billing Success Page
 * 
 * After successful payment, this page:
 * 1. Clears temporary checkout data
 * 2. Hands off to /setup (which pushes onboarding data and collects phone)
 */

export default function BillingSuccessPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const statusMessage = 'Redirecting to setup...';

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login?next=/billing/success');
      return;
    }

    const clearAndRedirect = async () => {
      setProcessing(true);

      try {
        // Clear temporary checkout data before handing off to setup
        localStorage.removeItem('youplus_guest_checkout_id');
        localStorage.removeItem('youplus_pending_plan_id');

        router.replace('/setup');
      } catch {
        router.replace('/setup');
      }
    };

    clearAndRedirect();
  }, [isAuthenticated, authLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <svg
            className="h-16 w-16 text-[#F97316]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Payment Successful!</h1>
        <p className="text-white/50 text-sm">{statusMessage}</p>
        {processing && (
          <div className="animate-spin rounded h-8 w-8 border-2 border-[#F97316] border-t-transparent mx-auto" />
        )}
      </div>
    </div>
  );
}
