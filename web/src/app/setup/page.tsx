'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { PhoneInput, isValidE164 } from '@/components/shared/PhoneInput';
import { apiClient } from '@/services/api';

/**
 * Post-Signup Setup Page
 * 
 * A gentle onboarding after payment + signup:
 * 1. Welcome screen
 * 2. How calls work explanation
 * 3. Phone number collection (E.164 format)
 * 4. Redirect to dashboard
 */

type SetupStep = 'welcome' | 'how-it-works' | 'phone' | 'complete';

export default function SetupPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [step, setStep] = useState<SetupStep>('welcome');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleNext = () => {
    if (step === 'welcome') {
      setStep('how-it-works');
    } else if (step === 'how-it-works') {
      setStep('phone');
    }
  };

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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {['welcome', 'how-it-works', 'phone'].map((s, idx) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                step === s
                  ? 'bg-teal-500'
                  : ['welcome', 'how-it-works', 'phone'].indexOf(step) > idx
                  ? 'bg-teal-300'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎉</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to YOU+
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Your Future Self is ready to hold you accountable.
              </p>
              <p className="text-gray-500">
                Let's get you set up for your first call.
              </p>
            </div>

            <Button onClick={handleNext} className="w-full">
              Let's Go
            </Button>
          </div>
        )}

        {/* Step: How It Works */}
        {step === 'how-it-works' && (
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📞</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h1>
              <div className="text-left space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl">🌙</span>
                  <div>
                    <p className="font-medium text-gray-900">Every evening</p>
                    <p className="text-gray-600 text-sm">
                      Your Future Self calls you at your scheduled time
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-medium text-gray-900">Quick check-in</p>
                    <p className="text-gray-600 text-sm">
                      Did you keep your promise? YES or NO. Simple.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="font-medium text-gray-900">Plan tomorrow</p>
                    <p className="text-gray-600 text-sm">
                      Set your commitments for the next day
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleNext} className="w-full">
              Got It
            </Button>
          </div>
        )}

        {/* Step: Phone Number */}
        {step === 'phone' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📱</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your Phone Number
              </h1>
              <p className="text-gray-600">
                This is how your Future Self will reach you.
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
                className="w-full"
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
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Skip for now (add later in settings)
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              We'll only use this for your accountability calls. No spam, ever.
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-teal-600"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                You're All Set!
              </h1>
              <p className="text-gray-600 mb-2">
                Your Future Self will call you at your scheduled time.
              </p>
              <p className="text-gray-500 text-sm">
                Redirecting to dashboard...
              </p>
            </div>

            <div className="animate-pulse">
              <div className="h-1 w-32 bg-teal-200 rounded mx-auto"></div>
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
