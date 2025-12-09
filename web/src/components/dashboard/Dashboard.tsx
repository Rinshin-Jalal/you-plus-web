'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';
import { HeroTimer } from '@/components/dashboard/HeroTimer';
import { AssessmentCard } from '@/components/dashboard/AssessmentCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { PillarGrid } from '@/components/dashboard/PillarGrid';
import { WitnessLogo } from '@/components/ui/WitnessLogo';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { LogOut, Settings, Flame, Compass, Trophy, ArrowRight } from 'lucide-react';
import { paymentService, type SubscriptionStatus } from '@/services/payment';
import { FullPageLoader } from '@/components/ui/Loaders';

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const { data, loading } = useDashboardData();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const sub = await paymentService.getSubscriptionStatus();
        setSubscription(sub);
      } catch (err) {
        console.error('[Dashboard] Error fetching subscription:', err);
      } finally {
        setSubLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const isPriming = !data && (loading || subLoading);
  const isRefreshing = !!data && (loading || subLoading);

  if (isPriming) {
    return <FullPageLoader message="Preparing your dashboard" />;
  }

  if (!data) return null;

  const hasCompletedFirstCall = data.stats.totalCalls > 0;
  const isOnFire = data.stats.currentStreak >= 7;
  const streakMessage = data.stats.currentStreak === 0 
    ? "Complete your first call to start." 
    : data.stats.currentStreak >= 30 
    ? "Legendary. Keep going."
    : data.stats.currentStreak >= 7 
    ? "You're on fire. Don't stop now."
    : "Don't break the chain.";

  const hasSubscription = subscription?.hasActiveSubscription;
  const hasCompletedOnboarding = data.futureSelf?.core_identity || (data.pillars && data.pillars.length > 0);
  const needsOnboarding = hasSubscription && !hasCompletedOnboarding;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] relative">
      <GrainOverlay />
      

      
      {/* Onboarding Required Overlay */}
      {needsOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative z-10 bg-[#0A0A0A] border-2 border-[#F97316] p-10 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#F97316] flex items-center justify-center mx-auto mb-6">
                <Compass size={32} className="text-black" />
              </div>
              <h2 className="font-black text-2xl md:text-3xl tracking-tight mb-3 uppercase">
                Complete Your Setup
              </h2>
              <p className="text-sm text-white/60 mb-8 leading-relaxed">
                Define your future self and set up your pillars to get personalized AI coaching.
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="w-full bg-[#F97316] text-black px-8 py-4 text-sm font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors flex items-center justify-center gap-3"
              >
                <span>Start Onboarding</span>
                <ArrowRight size={18} />
              </button>
              <button onClick={onLogout} className="mt-4 text-xs text-white/40 hover:text-white/60 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription Required Overlay */}
      {!hasSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative z-10 bg-[#0A0A0A] border-2 border-[#F97316] p-10 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#F97316] flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-black">!</span>
              </div>
              <h2 className="font-black text-2xl md:text-3xl tracking-tight mb-3 uppercase">
                Subscription Required
              </h2>
              <p className="text-sm text-white/60 mb-8 leading-relaxed">
                Unlock your potential with You+ Pro. Get daily AI coaching calls and track your transformation.
              </p>
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-[#F97316] text-black px-8 py-4 text-sm font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors flex items-center justify-center gap-3"
              >
                <span>Subscribe Now</span>
                <ArrowRight size={18} />
              </button>
              <button onClick={onLogout} className="mt-4 text-xs text-white/40 hover:text-white/60 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 ${(!hasSubscription || needsOnboarding) ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/account/settings')}
              className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button 
              onClick={onLogout}
              className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className={`pt-16 relative z-10 ${(!hasSubscription || needsOnboarding) ? 'blur-sm pointer-events-none' : ''}`}>
        
        {/* Welcome */}
        <section className="px-6 py-12 md:py-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="inline-block border border-[#F97316]/50 bg-[#F97316]/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-[#F97316] mb-4">
              WELCOME BACK
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight">
              {data.user?.name?.split(' ')[0] || 'User'}
            </h1>
          </div>
        </section>

        {/* Main Two-Column Layout */}
        <section className="px-6 pb-24">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN - Timer, Record, Pillars */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Timer */}
                <HeroTimer targetDate={data.nextCallTime} />
                
                {/* Record Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#F97316]">THE RECORD</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <StatsGrid stats={data.stats} hasCompletedFirstCall={hasCompletedFirstCall} isLoading={isRefreshing} />
                </div>
                
                {/* Pillars Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#F97316]">YOUR PILLARS</span>
                    <div className="flex-1 h-px bg-white/10" />
                    {data.pillars && data.pillars.length > 0 && (
                      <span className="text-xs text-white/40">{data.pillars.length} Active</span>
                    )}
                  </div>
                  
                  {data.pillars && data.pillars.length > 0 ? (
                    <PillarGrid 
                      pillars={data.pillars} 
                      primaryPillar={data.futureSelf?.primary_pillar}
                      hasCompletedFirstCall={hasCompletedFirstCall}
                    />
                  ) : (
                    <div className="border border-dashed border-white/20 p-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Compass size={24} className="text-white/40" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg tracking-tight mb-2 text-white/60">
                            No pillars defined
                          </h4>
                          <p className="text-sm text-white/40">
                            Complete onboarding to set up your pillars.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN - Trust & Streak */}
              <div className="space-y-6">
                
                {/* Trust Score Card */}
                <AssessmentCard 
                  status={data.status} 
                  trustScore={data.stats.trustScore} 
                  hasCompletedFirstCall={hasCompletedFirstCall} 
                />

                {/* Streak Card */}
                <div className={`p-6 relative overflow-hidden ${
                  isOnFire 
                    ? 'bg-[#F97316] text-black' 
                    : 'bg-[#0A0A0A] border border-white/10 text-white'
                }`}>
                  {isOnFire && (
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-black/10 blur-2xl" />
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 flex items-center justify-center ${isOnFire ? 'bg-black/20' : 'bg-white/10'}`}>
                          {isOnFire ? (
                            <Flame size={20} className="text-white" />
                          ) : (
                            <Trophy size={20} className="text-white/50" />
                          )}
                        </div>
                        <span className={`text-xs font-mono uppercase tracking-[0.2em] ${isOnFire ? 'text-black/60' : 'text-white/50'}`}>
                          Streak
                        </span>
                      </div>
                      {data.stats.longestStreak > 0 && (
                        <span className={`text-xs ${isOnFire ? 'text-black/50' : 'text-white/40'}`}>
                          Best: {data.stats.longestStreak}d
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-black text-6xl tracking-tighter leading-none">
                        {data.stats.currentStreak}
                      </span>
                      <span className={`text-sm uppercase tracking-widest ${isOnFire ? 'text-black/50' : 'text-white/50'}`}>
                        Days
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isOnFire ? 'text-black/70' : 'text-white/50'}`}>
                      {streakMessage}
                    </p>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
