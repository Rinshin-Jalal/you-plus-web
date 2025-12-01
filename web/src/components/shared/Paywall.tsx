/**
 * Paywall Component
 * Displays when user needs to subscribe or update payment
 */

'use client';

import React, { useState, useEffect } from 'react';
import { paymentService } from '@/services/payment';
import { Button } from '@/components/ui/Button';

export interface PaywallProps {
  title?: string;
  message?: string;
  reason?: 'no_subscription' | 'expired' | 'payment_failed';
  onClose?: () => void;
  className?: string;
}

export function Paywall({
  title,
  message,
  reason = 'no_subscription',
  onClose,
  className = '',
}: PaywallProps) {
  const [paywallUrl, setPaywallUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For web, we'll show plans and redirect to DodoPayments checkout
    // For mobile, this component shouldn't be shown (use native RevenueCat)
    setLoading(false);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Redirect to plans/checkout page or directly to DodoPayments
      // You can either:
      // 1. Navigate to /checkout page with plan selection
      // 2. Or directly create checkout session with default plan
      
      // Option 1: Navigate to checkout page (recommended)
      window.location.href = '/checkout';
      
      // Option 2: Direct checkout with default plan (uncomment if needed)
      // await paymentService.redirectToCheckout('default_plan_id');
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      setLoading(false);
    }
  };

  // Default content based on reason
  const defaultTitle = {
    no_subscription: 'Subscription Required',
    expired: 'Subscription Expired',
    payment_failed: 'Payment Update Required',
  }[reason];

  const defaultMessage = {
    no_subscription: 'Get unlimited access to all features with a subscription.',
    expired: 'Your subscription has expired. Renew now to continue using all features.',
    payment_failed: 'Your payment method failed. Please update your payment information to continue.',
  }[reason];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-6">
            <svg
              className="h-8 w-8 text-purple-600 dark:text-purple-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2
            id="paywall-title"
            className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {title || defaultTitle}
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {message || defaultMessage}
          </p>

          {/* Features list */}
          {reason === 'no_subscription' && (
            <div className="text-left mb-8 space-y-3">
              <FeatureItem text="Daily coaching calls" />
              <FeatureItem text="Personalized AI guidance" />
              <FeatureItem text="Progress tracking" />
              <FeatureItem text="Priority support" />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSubscribe}
              disabled={loading || !paywallUrl}
              className="flex-1"
              variant="primary"
            >
              {loading ? 'Loading...' : reason === 'payment_failed' ? 'Update Payment' : 'Subscribe Now'}
            </Button>
            
            {onClose && (
              <Button
                onClick={onClose}
                variant="secondary"
                className="flex-1"
              >
                Maybe Later
              </Button>
            )}
          </div>

          {/* Additional info */}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
            Cancel anytime. No long-term commitment.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature item component for paywall
 */
function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center">
      <svg
        className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-gray-700 dark:text-gray-300">{text}</span>
    </div>
  );
}

/**
 * Compact paywall banner (for inline display)
 */
export interface PaywallBannerProps {
  message?: string;
  onSubscribe?: () => void;
  className?: string;
}

export function PaywallBanner({ message, onSubscribe, className = '' }: PaywallBannerProps) {
  const handleClick = () => {
    if (onSubscribe) {
      onSubscribe();
      return;
    }

    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  return (
    <div
      className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-4 shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">
            {message || 'Subscribe to unlock all features'}
          </p>
        </div>
        <Button
          onClick={handleClick}
          variant="secondary"
          className="ml-4 bg-white text-purple-600 hover:bg-gray-100"
        >
          Subscribe
        </Button>
      </div>
    </div>
  );
}
