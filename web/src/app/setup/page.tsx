'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { storageService } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { PhoneInput, isValidE164 } from '@/components/shared/PhoneInput';
import { apiClient } from '@/services/api';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Phone, X, Check } from 'lucide-react';

/**
 * Setup Page - The gateway after onboarding
 * 
 * Flow:
 * 1. Check if authenticated → if not, redirect to /auth/login?next=/setup
 * 2. Check if subscribed → if not, redirect to /checkout
 * 3. Push onboarding data to backend
 * 4. Collect phone number
 * 5. Redirect to dashboard
 */

type SetupStep = 'checking' | 'pushing' | 'phone' | 'complete' | 'error';

export default function SetupPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { subscription, loading: subLoading, isActive } = useSubscription();
  
  const [step, setStep] = useState<SetupStep>('checking');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushAttempted, setPushAttempted] = useState(false);

  // Step 1: Check authentication
  useEffect(() => {
    if (authLoading) return; // Still loading auth
    
    if (!isAuthenticated) {
      // Not logged in → redirect to auth with return URL
      const returnUrl = encodeURIComponent('/setup');
      router.replace(`/auth/login?next=${returnUrl}`);
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // Step 2: Check subscription (only after auth is confirmed)
  useEffect(() => {
    if (authLoading || subLoading) return; // Still loading
    if (!isAuthenticated) return; // Not authenticated, will redirect above
    
    if (!isActive) {
      // Not subscribed → redirect to checkout
      router.replace('/checkout');
      return;
    }
    
    // Auth + subscription confirmed → proceed to push data
    if (step === 'checking') {
      setStep('pushing');
    }
  }, [isAuthenticated, authLoading, subLoading, isActive, step, router]);

  // Step 3: Push onboarding data to backend
  useEffect(() => {
    if (step !== 'pushing' || pushAttempted) return;
    
    const pushData = async () => {
      setPushAttempted(true);
      
      try {
        // Check if there's onboarding data to push
        if (storageService.hasOnboardingData()) {
          console.log('[Setup] Pushing onboarding data to backend...');
          const result = await storageService.pushOnboardingData();
          
          if (!result.success) {
            console.error('[Setup] Failed to push onboarding data:', result.error);
            setError(result.error || 'Failed to save your data. Please try again.');
            setStep('error');
            return;
          }
          
          console.log('[Setup] Onboarding data pushed successfully');
        } else {
          console.log('[Setup] No onboarding data to push');
        }
        
        // Move to phone collection
        setStep('phone');
      } catch (err) {
        console.error('[Setup] Error pushing data:', err);
        setError('Something went wrong. Please try again.');
        setStep('error');
      }
    };
    
    pushData();
  }, [step, pushAttempted]);

  const handlePhoneSubmit = async () => {
    // Validate phone number
    if (!phoneNumber) {
      setPhoneError('Please enter your phone number');
      return;
    }

    if (!isValidE164(phoneNumber)) {
      setPhoneError('Please enter a valid phone number');
      return;
    }

    setPhoneError(null);
    setSaving(true);

    try {
      // Save phone number to backend
      await apiClient.put('/api/settings/phone', {
        phone_number: phoneNumber,
      });

      setStep('complete');
      // Redirect to dashboard after a brief moment
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error saving phone number:', error);
      setPhoneError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping phone number (they can add it later in settings)
    router.replace('/dashboard');
  };

  const handleRetry = () => {
    setError(null);
    setPushAttempted(false);
    setStep('pushing');
  };

  // Loading states
  if (authLoading || subLoading || step === 'checking' || step === 'pushing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] p-4">
        <div className="animate-spin rounded h-12 w-12 border-2 border-white border-t-transparent mb-4"></div>
        <p className="text-white/60 font-mono text-sm">
          {authLoading && 'Checking authentication...'}
          {!authLoading && subLoading && 'Checking subscription...'}
          {step === 'pushing' && 'Saving your data...'}
          {step === 'checking' && !authLoading && !subLoading && 'Setting up...'}
        </p>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-900/30 rounded-md flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-white/60 mb-8">
            {error || 'We couldn\'t save your data. Please try again.'}
          </p>
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white">
              Try Again
            </Button>
            <button
              onClick={() => router.replace('/dashboard')}
              className="w-full py-2 text-white/50 hover:text-white/70 text-sm transition-colors"
            >
              Skip and go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {['phone', 'complete'].map((s, idx) => (
            <div
              key={s}
              className={`h-2 w-16 rounded transition-colors ${
                step === s
                  ? 'bg-[#F97316]'
                  : ['phone', 'complete'].indexOf(step) > idx
                  ? 'bg-[#F97316]/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step: Phone Number */}
        {step === 'phone' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#F97316]/20 rounded-md flex items-center justify-center mx-auto mb-6">
                <Phone className="w-10 h-10 text-[#F97316]" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Almost There!
              </h1>
              <p className="text-white/60">
                Add your phone number so your Future Self can call you.
              </p>
            </div>

            <div className="mb-6">
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="Enter your number"
                error={phoneError || undefined}
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePhoneSubmit}
                disabled={saving}
                className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Continue'
                )}
              </Button>

              <button
                onClick={handleSkip}
                className="w-full py-2 text-white/50 hover:text-white/70 text-sm transition-colors"
              >
                Skip for now (add later in settings)
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-white/40">
              We'll only use this for your accountability calls. No spam, ever.
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="w-20 h-20 bg-[#F97316]/20 rounded-md flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-[#F97316]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                You're All Set!
              </h1>
              <p className="text-white/60 mb-2">
                Your Future Self will call you at your scheduled time.
              </p>
              <p className="text-white/50 text-sm">
                Redirecting to dashboard...
              </p>
            </div>

            <div className="animate-pulse">
              <div className="h-1 w-32 bg-[#F97316]/30 rounded mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
