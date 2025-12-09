'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { storageService } from '@/services/storage';
import { useAuth } from '@/hooks/useAuth';

/**
 * Billing Success Page
 * 
 * After successful payment, this page:
 * 1. Pushes onboarding data to backend (if exists)
 * 2. Clears temporary checkout data
 * 3. Redirects to /setup for phone collection
 */

export default function BillingSuccessPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Processing payment...');

  const processAndRedirect = useCallback(async () => {
    setProcessing(true);

    try {
      // Push onboarding data if exists
      if (storageService.hasOnboardingData()) {
        setStatusMessage('Saving your profile...');
        await storageService.pushOnboardingData();
      }

      // Clear temporary checkout data
      localStorage.removeItem('youplus_guest_checkout_id');
      localStorage.removeItem('youplus_pending_plan_id');
      
      setStatusMessage('Redirecting to setup...');
      
      // Always go to setup after successful payment
      // Setup will handle phone collection and then redirect to dashboard
      router.replace('/setup');
    } catch {
      // Even on error, redirect to setup - it will handle any issues
      router.replace('/setup');
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login?next=/billing/success');
      return;
    }

    processAndRedirect();
  }, [isAuthenticated, authLoading, router, processAndRedirect]);

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
