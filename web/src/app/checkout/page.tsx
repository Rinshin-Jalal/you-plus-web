'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentService, type SubscriptionStatus } from '@/services/payment';
import { useAuth } from '@/hooks/useAuth';
import { storageService } from '@/services/storage';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { WitnessLogo } from '@/components/ui/WitnessLogo';
import { analytics } from '@/services/analytics';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  interval: string;
  interval_count?: number;
  features: string[];
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'pdt_NhtaHsMWnOV7xl3qHzBuE',
    name: 'Pro Weekly',
    description: 'Full access to all features',
    price: 499,
    currency: 'USD',
    interval: 'week',
    interval_count: 1,
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
    name: 'Pro 6-Month',
    description: 'Best value - billed every 6 months',
    price: 4999,
    currency: 'USD',
    interval: 'month',
    interval_count: 6,
    features: [
      'Everything in Weekly',
      'Best value pricing',
      'Priority support',
      'Unlimited access',
    ],
  },
];

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
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
  const [subLoading, setSubLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasOnboardingData, setHasOnboardingData] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [billingInterval, setBillingInterval] = useState<'week' | 'six_month'>('six_month');
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    setHasOnboardingData(storageService.hasOnboardingData());
  }, []);

  // Track checkout page view
  useEffect(() => {
    if (!authLoading && !subLoading && !hasTrackedView) {
      analytics.checkoutViewed(hasOnboardingData, isAuthenticated);
      setHasTrackedView(true);
    }
  }, [authLoading, subLoading, hasOnboardingData, isAuthenticated, hasTrackedView]);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const apiPlans = await paymentService.getPlans();
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
              interval_count: p.interval_count ?? defaultPlan?.interval_count,
              features: (p.features && p.features.length > 0) 
                ? p.features 
                : defaultPlan?.features || [],
            };
          });
          setPlans(mappedPlans);
        }
      } catch (err) {
        console.error('[Checkout] Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (isAuthenticated) {
        setSubLoading(true);
        try {
          const sub = await paymentService.getSubscriptionStatus();
          setSubscription(sub);
        } catch (err) {
          console.error('[Checkout] Error fetching subscription:', err);
        } finally {
          setSubLoading(false);
        }
      } else {
        setSubLoading(false);
      }
    };

    if (!authLoading) {
      fetchSubscription();
    }
  }, [isAuthenticated, authLoading]);

  const handleCheckout = async (planId: string) => {
    setSelectedPlan(planId);
    setError(null);
    setCheckoutLoading(true);

    // Find the plan to get details for tracking
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const trackedInterval =
        plan.interval === 'week'
          ? 'week'
          : plan.interval === 'month' && (plan.interval_count ?? 1) === 6
            ? 'six_month'
            : (plan.interval as 'month' | 'year');
      analytics.checkoutStarted(planId, trackedInterval);
    }

    try {
      if (!isAuthenticated) {
        const next = encodeURIComponent('/checkout');
        router.push(`/auth/login?next=${next}`);
        return;
      }

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
    const decimals = currency === 'INR' ? 0 : 2;
    const amount = (cents / 100).toFixed(decimals);
    return `${symbol}${amount}`;
  };

  const isWeekly = (p: Plan) => p.interval === 'week';
  const isSixMonth = (p: Plan) => p.interval === 'month' && (p.interval_count ?? 1) === 6;
  const getIntervalSuffix = (p: Plan) => (isWeekly(p) ? 'wk' : isSixMonth(p) ? '6mo' : p.interval);

  const getSelectedPlan = () => {
    if (billingInterval === 'week') {
      return plans.find(isWeekly) || plans[0];
    }
    return plans.find(isSixMonth) || plans[0];
  };

  const getSixMonthSavingsCents = () => {
    const weekly = plans.find(isWeekly);
    const sixMonth = plans.find(isSixMonth);
    if (!weekly || !sixMonth) return 0;
    const costIfWeekly = weekly.price * 26; // ~26 weeks in 6 months
    return Math.max(0, costIfWeekly - sixMonth.price);
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.hasActiveSubscription && subscription?.planId === planId;
  };

  const getButtonText = (plan: Plan) => {
    if (!isAuthenticated) {
      return 'LOGIN TO SUBSCRIBE';
    }
    
    if (isCurrentPlan(plan.id)) {
      return 'CURRENT PLAN';
    }
    
    if (subscription?.hasActiveSubscription) {
      const currentPlan = plans.find(p => p.id === subscription.planId);
      if (currentPlan) {
        return plan.price > currentPlan.price ? 'UPGRADE' : 'DOWNGRADE';
      }
      return 'SWITCH PLAN';
    }
    
    return 'GET STARTED';
  };

  const handlePlanAction = (plan: Plan) => {
    if (isCurrentPlan(plan.id)) {
      return;
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

  if (authLoading || subLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const plan = getSelectedPlan();
  const isCurrent = plan ? isCurrentPlan(plan.id) : false;
  const buttonText = plan ? getButtonText(plan) : '';
  const isProcessing = plan && (checkoutLoading || isChangingPlan) && selectedPlan === plan.id;
  const isSixMonthSelected = plan ? isSixMonth(plan) : false;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">
                Login
              </Link>
              <Link 
                href="/onboarding" 
                className="bg-[#F97316] text-black px-5 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316]">
            {subscription?.hasActiveSubscription ? 'Manage subscription' : 'Choose your plan'}
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 mb-4">
            {subscription?.hasActiveSubscription ? 'YOUR PLAN' : 'SIMPLE PRICING'}
          </h1>
          <p className="text-lg text-white/50 max-w-md mx-auto">
            {subscription?.hasActiveSubscription 
              ? 'Upgrade or downgrade anytime' 
              : 'Get unlimited access to AI-powered accountability'}
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`max-w-lg mx-auto mb-8 p-4 border ${
            message.type === 'success' 
              ? 'border-white/30 bg-white/5' 
              : 'border-red-500/50 bg-red-500/10'
          }`}>
            <p className={message.type === 'success' ? 'text-white' : 'text-red-400'}>
              {message.text}
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto mb-8 p-4 border border-red-500/50 bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex border border-white/20">
            <button
              onClick={() => {
                setBillingInterval('week');
                const weeklyPlan = plans.find(isWeekly);
                if (weeklyPlan) {
                  analytics.checkoutPlanSelected(weeklyPlan.id, 'week', weeklyPlan.price);
                }
              }}
              className={`px-8 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                billingInterval === 'week'
                  ? 'bg-white text-black'
                  : 'bg-transparent text-white/60 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => {
                setBillingInterval('six_month');
                const sixMonthPlan = plans.find(isSixMonth);
                if (sixMonthPlan) {
                  analytics.checkoutPlanSelected(sixMonthPlan.id, 'six_month', sixMonthPlan.price);
                }
              }}
              className={`px-8 py-3 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2 ${
                billingInterval === 'six_month'
                  ? 'bg-white text-black'
                  : 'bg-transparent text-white/60 hover:text-white'
              }`}
            >
              6 Months
              {getSixMonthSavingsCents() > 0 && (
                <span className={`text-xs px-2 py-0.5 ${
                  billingInterval === 'six_month' 
                    ? 'bg-[#F97316] text-white' 
                    : 'bg-[#F97316] text-white'
                }`}>
                  SAVE {formatPrice(getSixMonthSavingsCents(), plans[0]?.currency || 'USD')}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Plan Card - Brutalist Style */}
        {plan && (
          <div className="max-w-lg mx-auto">
            {/* Orange card for 6-month (bigger plan), dark card for weekly */}
            <div className={`relative ${isSixMonthSelected ? 'bg-[#F97316]' : 'bg-[#0A0A0A] border border-white/20'}`}>
              
              {/* Current Plan Badge - flush to edge */}
              {isCurrent && (
                <div className={`absolute top-0 right-0 px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                  isSixMonthSelected ? 'bg-[#0A0A0A] text-white' : 'bg-[#F97316] text-black'
                }`}>
                  Your Plan
                </div>
              )}

              <div className="p-10 md:p-12">
                
                {/* Plan Name */}
                <h2 className={`text-2xl font-black uppercase tracking-tight mb-2 ${
                  isSixMonthSelected ? 'text-[#0A0A0A]' : 'text-white'
                }`}>
                  You+ Pro
                </h2>

                <p className={`text-sm mb-8 ${isSixMonthSelected ? 'text-[#0A0A0A]/70' : 'text-white/50'}`}>
                  {isSixMonthSelected ? 'Best value - billed every 6 months' : 'Flexible weekly billing'}
                </p>

                {/* Price */}
                {isSixMonthSelected ? (
                  <div className="relative mb-6 inline-block">
                    {/* Offset shadow layer */}
                    <div className="absolute inset-0 bg-[#0A0A0A] translate-x-2 translate-y-2" />
                    {/* Main price block */}
                    <div className="relative bg-white px-5 py-4 border-4 border-[#0A0A0A]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl md:text-6xl font-black text-[#0A0A0A] tracking-tighter">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        <span className="text-lg font-bold text-[#0A0A0A]/60">
                          /{getIntervalSuffix(plan)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative mb-6 inline-block">
                    {/* Offset shadow layer */}
                    <div className="absolute inset-0 bg-[#F97316] translate-x-2 translate-y-2" />
                    {/* Main price block */}
                    <div className="relative bg-[#0A0A0A] px-5 py-4 border-4 border-[#F97316]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl md:text-6xl font-black text-[#F97316] tracking-tighter">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        <span className="text-lg font-bold text-[#F97316]/60">
                          /{getIntervalSuffix(plan)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {isSixMonthSelected && (
                  <p className="text-sm mb-8 text-[#0A0A0A]/60">
                    {formatPrice(plan.price, plan.currency)} billed every 6 months
                  </p>
                )}
                {!isSixMonthSelected && (
                  <p className="text-sm mb-8 text-white/40">
                    Billed weekly
                  </p>
                )}

                {/* Features */}
                <div className="space-y-4 mb-10">
                  {(plan.features.length > 0 ? plan.features : [
                    'Daily AI coaching calls',
                    'Personalized guidance',
                    'Progress tracking',
                    'Priority support',
                    'Unlimited access',
                  ]).map((feature, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-5 h-5 flex items-center justify-center ${
                        isSixMonthSelected ? 'bg-[#0A0A0A]' : 'bg-[#F97316]'
                      }`}>
                        <Check size={12} className={isSixMonthSelected ? 'text-[#F97316]' : 'text-black'} />
                      </div>
                      <span className={isSixMonthSelected ? 'text-[#0A0A0A]' : 'text-white/80'}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => isCurrent ? handleManageSubscription() : handlePlanAction(plan)}
                  disabled={isProcessing || authLoading}
                  className={`w-full py-5 font-black text-lg uppercase tracking-wide transition-colors flex items-center justify-center gap-3 disabled:opacity-50 ${
                    isSixMonthSelected
                      ? 'bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]' 
                      : 'bg-[#F97316] text-black hover:bg-[#FB923C]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isCurrent ? 'MANAGE SUBSCRIPTION' : buttonText}
                      {!isCurrent && <ArrowRight size={18} />}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm text-white/60 mb-2">
            Secure payment powered by DodoPayments
          </p>
          <p className="text-xs text-white/50">
            By subscribing, you agree to our{' '}
            <Link href="/legal/terms" className="underline hover:text-white">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/legal/privacy" className="underline hover:text-white">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
