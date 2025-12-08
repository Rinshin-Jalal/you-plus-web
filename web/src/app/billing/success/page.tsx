'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storageService } from '@/services/storage';
import { useAuth } from '@/hooks/useAuth';

export default function BillingSuccessPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login?next=/billing/success');
      return;
    }

    processAndRedirect();
  }, [isAuthenticated, authLoading, router]);

  const processAndRedirect = async () => {
    setProcessing(true);

    try {
      if (storageService.hasOnboardingData()) {
        await storageService.pushOnboardingData();
      }

      localStorage.removeItem('youplus_guest_checkout_id');
      localStorage.removeItem('youplus_pending_plan_id');
      router.replace('/setup');
    } catch {
      router.replace('/setup');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
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
        {processing && (
          <div className="animate-spin rounded h-8 w-8 border-2 border-white border-t-transparent mx-auto" />
        )}
      </div>
    </div>
  );
}
