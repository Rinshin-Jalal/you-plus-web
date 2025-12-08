'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentService, type SubscriptionStatus } from '@/services/payment';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { storageService } from '@/services/storage';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'pdt_NhtaHsMWnOV7xl3qHzBuE',
    name: 'Pro Monthly',
    description: 'Full access to all features',
    price: 49900,
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
    id: 'pdt_E0kK0u7ZB7yRi9icsBCjA',
    name: 'Pro Yearly',
    description: 'Best value - 2 months free',
    price: 499000,
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
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(true); // Start true - assume we need to check
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasOnboardingData, setHasOnboardingData] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year'); // Default to yearly

  // Check if user has onboarding data (only on client to avoid hydration mismatch)
  useEffect(() => {
    setHasOnboardingData(storageService.hasOnboardingData());
  }, []);

  useEffect(() => {
    // Fetch plans from API for all users (authenticated or not)
    const fetchPlans = async () => {
      setLoading(true);
      try {
        console.log('[Checkout] Fetching plans from API...');
        const apiPlans = await paymentService.getPlans();
        console.log('[Checkout] API response:', apiPlans);
        
        if (apiPlans.length > 0) {
          const mappedPlans = apiPlans.map((p: any) => {
            const defaultPlan = DEFAULT_PLANS.find(d => d.id === (p.product_id || p.id));
            return {
              id: p.product_id || p.id,
              name: p.name || defaultPlan?.name || 'Plan',
              description: p.description || defaultPlan?.description || '',
              price: p.price_cents ?? p.price ?? defaultPlan?.price ?? 0,
              currency: p.currency || defaultPlan?.currency || 'INR',
              interval: p.interval || defaultPlan?.interval || 'month',
              // Use API features if available, otherwise use defaults
              features: (p.features && p.features.length > 0) 
                ? p.features 
                : defaultPlan?.features || [],
            };
          });
          console.log('[Checkout] Mapped plans:', mappedPlans);
          setPlans(mappedPlans);
        } else {
          console.log('[Checkout] No plans returned from API, using defaults');
        }
      } catch (err) {
        console.error('[Checkout] Error fetching plans:', err);
        // Keep DEFAULT_PLANS on error
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Fetch current subscription if authenticated
  useEffect(() => {
    const fetchSubscription = async () => {
      if (isAuthenticated) {
        setSubLoading(true);
        try {
          console.log('[Checkout] Fetching subscription status...');
          const sub = await paymentService.getSubscriptionStatus();
          console.log('[Checkout] Subscription response:', JSON.stringify(sub, null, 2));
          setSubscription(sub);
        } catch (err) {
          console.error('[Checkout] Error fetching subscription:', err);
        } finally {
          setSubLoading(false);
        }
      } else {
        // Not authenticated - no subscription to check
        setSubLoading(false);
      }
    };

    if (!authLoading) {
      fetchSubscription();
    }
  }, [isAuthenticated, authLoading]);

  // Debug logging for subscription state
  useEffect(() => {
    // Wait for auth and subscription loading to complete
    if (authLoading || subLoading) return;

    console.log("=== CHECKOUT DEBUG ===")
    console.log("authLoading:", authLoading, "subLoading:", subLoading)
    console.log("isAuthenticated:", isAuthenticated, "user:", user?.email)
    console.log("subscription object:", JSON.stringify(subscription, null, 2));
    console.log("plans array:", JSON.stringify(plans.map(p => ({ id: p.id, name: p.name })), null, 2));
    console.log("subscription.planId:", subscription?.planId);
    console.log("subscription.hasActiveSubscription:", subscription?.hasActiveSubscription);
    plans.forEach(p => {
      console.log(`Plan "${p.name}" id="${p.id}" matches subscription.planId? ${subscription?.planId === p.id}`);
    });
    console.log("=== END DEBUG ===")
    
    // No redirect - allow subscribed users to view/manage plans
  }, [authLoading, subLoading, isAuthenticated, subscription, plans, user]);

  const handleCheckout = async (planId: string) => {
    console.log('[Checkout] handleCheckout called', { planId, isAuthenticated, user: user?.email });
    setSelectedPlan(planId);
    setError(null);
    setCheckoutLoading(true);

    try {
      if (!isAuthenticated) {
        const next = encodeURIComponent('/checkout');
        router.push(`/auth/login?next=${next}`);
        return;
      }

      // Authenticated checkout only
      console.log('[Checkout] User authenticated, using authenticated checkout');
      await paymentService.redirectToCheckout(planId);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleChangePlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsChangingPlan(true);
    setMessage(null);

    try {
      const result = await paymentService.changePlan(planId);
      
      if (result.success) {
        setMessage({ type: 'success', text: `Successfully switched to ${result.newPlan?.name || 'new plan'}!` });
        // Reload subscription
        const sub = await paymentService.getSubscriptionStatus();
        setSubscription(sub);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to change plan' });
      }
    } catch (err) {
      console.error('Change plan error:', err);
      setMessage({ type: 'error', text: 'Failed to change plan. Please try again.' });
    } finally {
      setIsChangingPlan(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    const amount = (cents / 100).toFixed(0);
    return `${symbol}${amount}`;
  };

  const formatMonthlyPrice = (plan: Plan) => {
    const symbol = plan.currency === 'INR' ? '₹' : '$';
    if (plan.interval === 'year') {
      // Show yearly price divided by 12
      const monthlyAmount = Math.round(plan.price / 12 / 100);
      return `${symbol}${monthlyAmount}`;
    }
    return `${symbol}${Math.round(plan.price / 100)}`;
  };

  const getSelectedPlan = () => {
    return plans.find(p => p.interval === billingInterval) || plans[0];
  };

  const getYearlySavings = () => {
    const monthlyPlan = plans.find(p => p.interval === 'month');
    const yearlyPlan = plans.find(p => p.interval === 'year');
    if (monthlyPlan && yearlyPlan) {
      const yearlyIfMonthly = monthlyPlan.price * 12;
      const savings = yearlyIfMonthly - yearlyPlan.price;
      return savings > 0 ? Math.round(savings / 100) : 0;
    }
    return 0;
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.hasActiveSubscription && subscription?.planId === planId;
  };

  const getButtonText = (plan: Plan) => {
    if (!isAuthenticated) {
      return 'Login to Subscribe';
    }
    
    if (isCurrentPlan(plan.id)) {
      return 'Current Plan';
    }
    
    if (subscription?.hasActiveSubscription) {
      // Compare prices to determine upgrade/downgrade
      const currentPlan = plans.find(p => p.id === subscription.planId);
      if (currentPlan) {
        return plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade';
      }
      return 'Switch Plan';
    }
    
    return 'Get Started';
  };

  const handlePlanAction = (plan: Plan) => {
    if (isCurrentPlan(plan.id)) {
      return; // Do nothing for current plan
    }
    
    if (subscription?.hasActiveSubscription) {
      handleChangePlan(plan.id);
    } else {
      handleCheckout(plan.id);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const portalUrl = await paymentService.getCustomerPortalUrl();
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        setError('Unable to open subscription management. Please try again.');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      setError('Failed to open subscription management.');
    }
  };

  // Show loading while checking auth or subscription status
  // This prevents flash of checkout UI before redirect for subscribed users
  if (authLoading || subLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {subscription?.hasActiveSubscription ? 'Manage Your Plan' : 'Choose Your Plan'}
          </h1>
          <p className="text-lg text-white/60">
            {subscription?.hasActiveSubscription 
              ? 'Upgrade or downgrade your subscription anytime' 
              : 'Get unlimited access to AI-powered coaching'}
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-8 p-4 rounded-lg border ${
            message.type === 'success' ? 'border-white/20 bg-white/5' : 'border-red-600/50 bg-red-900/20'
          }`}>
            <p className={message.type === 'success' ? 'text-white' : 'text-red-400'}>
              {message.text}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-900/20 border border-red-600/50 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/20">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === 'month'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === 'year'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Yearly
              {getYearlySavings() > 0 && (
                <span className="ml-2 text-xs bg-[#F97316] text-white px-2 py-0.5 rounded-full">
                  Save {formatPrice(getYearlySavings() * 100, plans[0]?.currency || 'USD')}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Single Plan Card */}
        {(() => {
          const plan = getSelectedPlan();
          if (!plan) return null;
          
          const isCurrent = isCurrentPlan(plan.id);
          const buttonText = getButtonText(plan);
          const isProcessing = (checkoutLoading || isChangingPlan) && selectedPlan === plan.id;
          
          return (
            <Card 
              className={`relative overflow-hidden transition-all duration-200 ${
                isCurrent 
                  ? 'bg-[#F97316] text-white border-[#F97316]' 
                  : 'bg-[#111] border-white/20'
              }`}
            >
              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute top-4 right-4 bg-white text-[#F97316] px-3 py-1 text-sm font-medium rounded-full">
                  Your Plan
                </div>
              )}

              <div className="p-8">
                <h3 className={`text-2xl font-bold mb-2 ${isCurrent ? 'text-white' : 'text-white'}`}>
                  You+ Pro
                </h3>

                <p className={`mb-6 ${isCurrent ? 'text-white/80' : 'text-white/60'}`}>
                  {plan.interval === 'year' ? 'Best value - billed annually' : 'Flexible monthly billing'}
                </p>

                <div className="mb-2">
                  <span className={`text-5xl font-bold ${isCurrent ? 'text-white' : 'text-white'}`}>
                    {formatMonthlyPrice(plan)}
                  </span>
                  <span className={`ml-2 text-lg ${isCurrent ? 'text-white/80' : 'text-white/60'}`}>
                    /month
                  </span>
                </div>
                
                {plan.interval === 'year' && (
                  <p className={`text-sm mb-6 ${isCurrent ? 'text-white/70' : 'text-white/50'}`}>
                    {formatPrice(plan.price, plan.currency)} billed annually
                  </p>
                )}
                {plan.interval === 'month' && (
                  <p className={`text-sm mb-6 ${isCurrent ? 'text-white/70' : 'text-white/50'}`}>
                    Billed monthly
                  </p>
                )}

                <ul className="space-y-3 mb-8">
                  {(plan.features.length > 0 ? plan.features : [
                    'Daily AI coaching calls',
                    'Personalized guidance',
                    'Progress tracking',
                    'Priority support',
                    'Unlimited access',
                  ]).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${isCurrent ? 'text-white' : 'text-[#F97316]'}`}
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
                      <span className={isCurrent ? 'text-white/90' : 'text-white/80'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => isCurrent ? handleManageSubscription() : handlePlanAction(plan)}
                  disabled={isProcessing || authLoading}
                  className={`w-full ${isCurrent ? 'bg-white text-[#F97316] hover:bg-white/90' : 'bg-[#F97316] text-white hover:bg-[#EA580C]'}`}
                  variant={isCurrent ? 'outline' : 'primary'}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : isCurrent ? 'Manage Subscription' : buttonText}
                </Button>
              </div>
            </Card>
          );
        })()}

        <div className="text-center mt-12">
          <p className="text-sm text-white/50 mb-2">
            Secure payment powered by DodoPayments
          </p>
          <p className="text-xs text-white/40">
            By subscribing, you agree to our{' '}
            <a href="/legal/terms" className="underline hover:text-white/60">Terms of Service</a>
            {' '}and{' '}
            <a href="/legal/privacy" className="underline hover:text-white/60">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
