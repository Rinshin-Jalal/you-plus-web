/**
 * Checkout Page
 * Display pricing plans and handle DodoPayments checkout
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paymentService } from '@/services/payment';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

// Default plans (replace with actual product IDs from DodoPayments)
const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_pro_monthly',
    name: 'Pro Monthly',
    description: 'Full access to all features',
    price: 49900, // ₹499
    currency: 'INR',
    interval: 'month',
    features: [
      'Daily AI coaching calls',
      'Personalized guidance',
      'Progress tracking',
      'Priority support',
      'Unlimited access',
    ],
  },
  {
    id: 'plan_pro_yearly',
    name: 'Pro Yearly',
    description: 'Best value - 2 months free',
    price: 499000, // ₹4,990 (₹499 x 10)
    currency: 'INR',
    interval: 'year',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Annual discount',
      'VIP support',
      'Early access to features',
    ],
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiPlans = await paymentService.getPlans();
        if (apiPlans.length > 0) {
          // Map API plans to our format
          setPlans(apiPlans.map((p: any) => ({
            id: p.product_id || p.id,
            name: p.name,
            description: p.description || '',
            price: p.price_cents || p.price || 0,
            currency: p.currency || 'INR',
            interval: p.interval || 'month',
            features: p.features || [],
          })));
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        // Use default plans on error
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPlans();
    }
  }, [isAuthenticated]);

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(true);
    setSelectedPlan(planId);
    setError(null);

    try {
      // Redirect to DodoPayments checkout
      await paymentService.redirectToCheckout(planId);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    const amount = (cents / 100).toFixed(0);
    return `${symbol}${amount}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Get unlimited access to AI-powered coaching
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative overflow-hidden">
              {/* Recommended badge for yearly plan */}
              {plan.interval === 'year' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                  Best Value
                </div>
              )}

              <div className="p-8">
                {/* Plan name */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    /{plan.interval}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
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
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={checkoutLoading && selectedPlan === plan.id}
                  className="w-full"
                  variant={plan.interval === 'year' ? 'primary' : 'secondary'}
                >
                  {checkoutLoading && selectedPlan === plan.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Secure payment powered by DodoPayments • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
