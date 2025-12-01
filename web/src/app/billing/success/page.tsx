/**
 * Billing Success Page
 * Displayed after successful checkout from DodoPayments
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentService } from '@/services/payment';
import { Button } from '@/components/ui/Button';

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCheckout = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('No checkout session found');
        setVerifying(false);
        return;
      }

      try {
        const result = await paymentService.verifyCheckoutSession(sessionId);

        if (result.success) {
          setSuccess(true);
        } else {
          setError('Checkout verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Failed to verify checkout');
      } finally {
        setVerifying(false);
      }
    };

    verifyCheckout();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <svg
              className="h-16 w-16 text-red-500 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Payment Verification Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/checkout')} className="w-full">
              Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="secondary" className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="h-16 w-16 text-green-500 mx-auto"
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

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Successful!
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Your subscription is now active. Welcome to YOU+!
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            What's next?
          </h2>
          <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Start your first coaching call
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Set your goals and preferences
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Track your progress
            </li>
          </ul>
        </div>

        <Button onClick={() => router.push('/dashboard')} className="w-full mb-4">
          Go to Dashboard
        </Button>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Receipt sent to your email • Manage subscription anytime
        </p>
      </div>
    </div>
  );
}
