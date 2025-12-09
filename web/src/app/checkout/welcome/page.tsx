'use client';

import React, { useState, useEffect } from 'react';
import { paymentService } from '@/services/payment';
import { storageService } from '@/services/storage';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { WitnessLogo } from '@/components/ui/WitnessLogo';
import { getPillarById, type PillarPreset } from '@/data/pillarPresets';
import { AuthGuard } from '@/components/shared/AuthGuard';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

interface OnboardingData {
  name?: string;
  selected_pillars?: string[];
  primary_pillar?: string;
  core_identity?: string;
  belief_score?: number;
  check_in_time?: string;
  // Pillar-specific answers
  [key: string]: unknown;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'pdt_NhtaHsMWnOV7xl3qHzBuE',
    name: 'Pro Monthly',
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

export default function WelcomeCheckoutPage() {
  return (
    <AuthGuard>
      <WelcomeCheckoutContent />
    </AuthGuard>
  );
}

function WelcomeCheckoutContent() {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  
  // Onboarding data
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [pillarsWithInfo, setPillarsWithInfo] = useState<PillarPreset[]>([]);

  // Load onboarding data
  useEffect(() => {
    const data = storageService.getData() as OnboardingData;
    
    // Get name from either field name or step ID
    const name = data?.name || (data?.[4] as string) || '';
    const selectedPillars = data?.selected_pillars || (data?.[8] as string[]) || [];
    const primaryPillar = data?.primary_pillar || (data?.[9] as string) || '';
    const coreIdentity = data?.core_identity || (data?.[21] as string) || '';
    const beliefScore = data?.belief_score || (data?.[27] as number) || 5;
    const checkInTime = data?.check_in_time || (data?.[24] as string) || '';
    
    setOnboardingData({
      ...data,
      name,
      selected_pillars: selectedPillars,
      primary_pillar: primaryPillar,
      core_identity: coreIdentity,
      belief_score: beliefScore,
      check_in_time: checkInTime,
    });

    // Get pillar info for display
    const pillars = selectedPillars.map(id => getPillarById(id)).filter(Boolean) as PillarPreset[];
    setPillarsWithInfo(pillars);
  }, []);

  // Get personalized features based on pillars and data
  const getPersonalizedFeatures = (): string[] => {
    const primaryPillar = onboardingData.primary_pillar;
    const pillar = primaryPillar ? getPillarById(primaryPillar) : null;
    
    const baseFeatures = [
      'Daily AI coaching calls',
      'Priority support',
      'Unlimited access',
    ];

    if (!pillar) return [...baseFeatures, 'Personalized guidance', 'Progress tracking'];

    // Add pillar-specific features
    const pillarFeatures: Record<string, string[]> = {
      gym: ['Workout accountability tracking', 'Physique progress milestones'],
      fighting: ['Training session tracking', 'Combat skill progression'],
      diet: ['Nutrition goal tracking', 'Meal habit accountability'],
      sleep: ['Sleep schedule coaching', 'Energy level monitoring'],
      running: ['Cardio progress tracking', 'Endurance milestones'],
      focus: ['Deep work session tracking', 'Distraction pattern analysis'],
      discipline: ['Daily discipline scoring', 'Habit streak tracking'],
      confidence: ['Confidence-building challenges', 'Social wins tracking'],
      anxiety: ['Anxiety trigger awareness', 'Mental calm coaching'],
      addiction: ['Streak tracking & protection', 'Relapse prevention support'],
      income: ['Income goal tracking', 'Financial milestone coaching'],
      business: ['Business goal accountability', 'Execution tracking'],
      investing: ['Investment habit building', 'Financial discipline'],
      career: ['Career milestone tracking', 'Professional growth coaching'],
      skills: ['Skill-building accountability', 'Learning streak tracking'],
      dating: ['Social confidence coaching', 'Dating goal tracking'],
      social: ['Social skill challenges', 'Connection tracking'],
      status: ['Reputation building goals', 'Influence tracking'],
      style: ['Style improvement tracking', 'First impression coaching'],
      nofap: ['Streak tracking & alerts', 'Energy redirection coaching'],
      dopamine: ['Screen time accountability', 'Dopamine reset coaching'],
      morning: ['Morning routine tracking', 'Wake-up accountability'],
      reading: ['Reading habit tracking', 'Book completion milestones'],
      journaling: ['Journaling streak tracking', 'Self-reflection coaching'],
      meditation: ['Meditation streak tracking', 'Mental clarity coaching'],
      cold_showers: ['Cold shower streak tracking', 'Mental toughness coaching'],
    };

    const specific = pillarFeatures[pillar.id] || ['Personalized guidance', 'Progress tracking'];
    return [...baseFeatures, ...specific];
  };

  // Get personalized tagline based on onboarding
  const getTagline = (): string => {
    const identity = onboardingData.core_identity;
    if (identity) {
      return `You said you're becoming "${identity}". Let's make it real.`;
    }
    return 'The call starts tonight. Lock in your transformation.';
  };

  // Get personalized CTA based on primary pillar
  const getCTA = (): string => {
    const primaryPillar = onboardingData.primary_pillar;
    const pillar = primaryPillar ? getPillarById(primaryPillar) : null;
    
    if (!pillar) return 'START MY TRANSFORMATION';
    
    const ctaMap: Record<string, string> = {
      gym: 'START GETTING JACKED',
      fighting: 'START MY TRAINING',
      diet: 'START EATING RIGHT',
      sleep: 'FIX MY SLEEP',
      running: 'BUILD MY ENDURANCE',
      focus: 'UNLOCK MY FOCUS',
      discipline: 'BUILD MY DISCIPLINE',
      confidence: 'BUILD MY CONFIDENCE',
      anxiety: 'TAKE CONTROL',
      addiction: 'BREAK FREE NOW',
      income: 'START MAKING MONEY',
      business: 'BUILD MY BUSINESS',
      investing: 'START INVESTING',
      career: 'LEVEL UP MY CAREER',
      skills: 'MASTER MY SKILLS',
      dating: 'FIX MY DATING LIFE',
      social: 'BECOME MAGNETIC',
      status: 'BUILD MY STATUS',
      style: 'UPGRADE MY STYLE',
      nofap: 'REWIRE MY BRAIN',
      dopamine: 'TAKE BACK CONTROL',
      morning: 'OWN MY MORNINGS',
      reading: 'START READING',
      journaling: 'START JOURNALING',
      meditation: 'FIND MY CALM',
      cold_showers: 'GET HARD',
    };
    
    return ctaMap[pillar.id] || 'START MY TRANSFORMATION';
  };

  // Fetch plans
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
              price: p.price_cents ?? p.price ?? defaultPlan?.price ?? 0,
              currency: p.currency || defaultPlan?.currency || 'INR',
              interval: p.interval || defaultPlan?.interval || 'month',
              features: (p.features && p.features.length > 0) 
                ? p.features 
                : defaultPlan?.features || [],
            };
          });
          setPlans(mappedPlans);
        }
      } catch (err) {
        console.error('[WelcomeCheckout] Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleCheckout = async (planId: string) => {
    setError(null);
    setCheckoutLoading(true);

    try {
      await paymentService.redirectToCheckout(planId);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const plan = getSelectedPlan();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </Link>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        
        {/* Header - Personalized for onboarding users */}
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316]">
            {onboardingData.name ? `You did it, ${onboardingData.name}` : 'You did it'}
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 mb-4">
            YOUR FUTURE SELF IS READY
          </h1>
          <p className="text-lg text-white/50 max-w-md mx-auto">
            {getTagline()}
          </p>
        </div>

        {/* Selected Pillars Display */}
        {pillarsWithInfo.length > 0 && (
          <div className="max-w-lg mx-auto mb-8">
            <div className="border border-white/10 p-6">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-4">
                YOUR FOCUS AREAS
              </p>
              <div className="flex flex-wrap gap-3">
                {pillarsWithInfo.map((pillar) => (
                  <div 
                    key={pillar.id}
                    className={`flex items-center gap-2 px-4 py-2 border ${
                      pillar.id === onboardingData.primary_pillar 
                        ? 'border-[#F97316] bg-white/5' 
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <span className="text-lg">{pillar.icon}</span>
                    <span className={`text-sm font-bold uppercase ${
                      pillar.id === onboardingData.primary_pillar ? 'text-[#F97316]' : 'text-white/80'
                    }`}>
                      {pillar.label}
                    </span>
                    {pillar.id === onboardingData.primary_pillar && (
                      <span className="text-[10px] text-[#F97316] ml-1">PRIMARY</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Your Commitment Summary */}
        {(onboardingData.core_identity || onboardingData.check_in_time) && (
          <div className="max-w-lg mx-auto mb-8">
            <div className="border border-white/10 p-6 space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">
                YOUR COMMITMENT
              </p>
              
              {onboardingData.core_identity && (
                <div>
                  <p className="text-xs text-white/40 mb-1">I AM BECOMING</p>
                  <p className="text-lg text-white font-bold">"{onboardingData.core_identity}"</p>
                </div>
              )}
              
              {onboardingData.check_in_time && (
                <div>
                  <p className="text-xs text-white/40 mb-1">DAILY CALL TIME</p>
                  <p className="text-lg text-white font-bold">{onboardingData.check_in_time}</p>
                </div>
              )}

              {onboardingData.belief_score && (
                <div>
                  <p className="text-xs text-white/40 mb-1">BELIEF SCORE</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10">
                      <div 
                        className="h-full bg-[#F97316]" 
                        style={{ width: `${(Number(onboardingData.belief_score) / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-[#F97316] font-bold">{onboardingData.belief_score}/10</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-lg mx-auto mb-8 p-4 border border-red-500/50 bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex border border-white/20">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-8 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                billingInterval === 'month'
                  ? 'bg-white text-black'
                  : 'bg-transparent text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-8 py-3 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2 ${
                billingInterval === 'year'
                  ? 'bg-white text-black'
                  : 'bg-transparent text-white/60 hover:text-white'
              }`}
            >
              Yearly
              {getYearlySavings() > 0 && (
                <span className={`text-xs px-2 py-0.5 ${
                  billingInterval === 'year' 
                    ? 'bg-[#F97316] text-white' 
                    : 'bg-[#F97316] text-white'
                }`}>
                  SAVE {formatPrice(getYearlySavings() * 100, plans[0]?.currency || 'USD')}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Plan Card - Same as real checkout */}
        {plan && (
          <div className="max-w-lg mx-auto">
            <div className={`relative ${plan.interval === 'year' ? 'bg-[#F97316]' : 'bg-[#0A0A0A] border border-white/20'}`}>

              <div className="p-10 md:p-12">
                
                {/* Plan Name */}
                <h2 className={`text-2xl font-black uppercase tracking-tight mb-2 ${
                  plan.interval === 'year' ? 'text-[#0A0A0A]' : 'text-white'
                }`}>
                  You+ Pro
                </h2>

                <p className={`text-sm mb-8 ${plan.interval === 'year' ? 'text-[#0A0A0A]/70' : 'text-white/50'}`}>
                  {plan.interval === 'year' ? 'Best value - billed annually' : 'Flexible monthly billing'}
                </p>

                {/* Price */}
                {plan.interval === 'year' ? (
                  <div className="relative mb-6 inline-block">
                    {/* Offset shadow layer */}
                    <div className="absolute inset-0 bg-[#0A0A0A] translate-x-2 translate-y-2" />
                    {/* Main price block */}
                    <div className="relative bg-white px-5 py-4 border-4 border-[#0A0A0A]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl md:text-6xl font-black text-[#0A0A0A] tracking-tighter">
                          {formatMonthlyPrice(plan)}
                        </span>
                        <span className="text-lg font-bold text-[#0A0A0A]/60">
                          /mo
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
                          {formatMonthlyPrice(plan)}
                        </span>
                        <span className="text-lg font-bold text-[#F97316]/60">
                          /mo
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {plan.interval === 'year' && (
                  <p className="text-sm mb-8 text-[#0A0A0A]/60">
                    {formatPrice(plan.price, plan.currency)} billed annually
                  </p>
                )}
                {plan.interval === 'month' && (
                  <p className="text-sm mb-8 text-white/40">
                    Billed monthly
                  </p>
                )}

                {/* Features */}
                <div className="space-y-4 mb-10">
                  {getPersonalizedFeatures().slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-5 h-5 flex items-center justify-center ${
                        plan.interval === 'year' ? 'bg-[#0A0A0A]' : 'bg-[#F97316]'
                      }`}>
                        <Check size={12} className={plan.interval === 'year' ? 'text-[#F97316]' : 'text-black'} />
                      </div>
                      <span className={plan.interval === 'year' ? 'text-[#0A0A0A]' : 'text-white/80'}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={checkoutLoading}
                  className={`w-full py-5 font-black text-lg uppercase tracking-wide transition-colors flex items-center justify-center gap-3 disabled:opacity-50 ${
                    plan.interval === 'year'
                      ? 'bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]' 
                      : 'bg-[#F97316] text-black hover:bg-[#FB923C]'
                  }`}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {getCTA()}
                      <ArrowRight size={18} />
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
