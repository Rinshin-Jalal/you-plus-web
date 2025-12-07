
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/useDashboardData';
import { HeroTimer } from '@/components/dashboard/HeroTimer';
import { AssessmentCard } from '@/components/dashboard/AssessmentCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { PillarGrid } from '@/components/dashboard/PillarGrid';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { LogOut, Settings, Flame, Compass, Trophy } from 'lucide-react';
import { paymentService, type SubscriptionStatus } from '@/services/payment';
import { Button } from '@/components/ui/Button';

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const { data, loading } = useDashboardData();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  // Fetch subscription status
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

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-black border-t-transparent animate-spin" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-black/40">Loading...</p>
      </div>
    );
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
    <div className="min-h-screen bg-white text-black font-sans relative">
      <GrainOverlay />
      
      {/* Onboarding Required Overlay */}
      {needsOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-md" />
          
          {/* Popup Card */}
          <div className="relative z-10 bg-emerald-600 border-4 border-emerald-800 p-8 md:p-12 max-w-md mx-4 shadow-[12px_12px_0px_0px_rgba(6,78,59,1)]">
            <div className="text-center">
              <div className="w-16 h-16 bg-white text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <Compass size={32} />
              </div>
              <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-3 text-white">
                Complete Your Setup
              </h2>
              <p className="font-mono text-sm text-white/80 mb-8 leading-relaxed">
                Define your future self and set up your pillars to get personalized AI coaching tailored just for you.
              </p>
              <Button
                onClick={() => router.push('/onboarding')}
                className="w-full bg-white text-emerald-600 hover:bg-white/90"
                variant="outline"
              >
                Start Onboarding
              </Button>
              <button
                onClick={onLogout}
                className="mt-4 font-mono text-xs text-white/60 hover:text-white/80 underline"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription Required Overlay */}
      {!hasSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md" />
          
          {/* Popup Card */}
          <div className="relative z-10 bg-red-950 border-4 border-red-900 p-8 md:p-12 max-w-md mx-4 shadow-[12px_12px_0px_0px_rgba(69,10,10,1)]">
            <div className="text-center">
              <div className="w-16 h-16 bg-white text-red-950 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold">!</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-3 text-white">
                Subscription Required
              </h2>
              <p className="font-mono text-sm text-white/70 mb-8 leading-relaxed">
                Unlock your potential with You+ Pro. Get daily AI coaching calls, personalized guidance, and track your transformation.
              </p>
              <Button
                onClick={() => router.push('/checkout')}
                className="w-full bg-white text-red-950 hover:bg-white/90"
                variant="outline"
              >
                Subscribe Now
              </Button>
              <button
                onClick={onLogout}
                className="mt-4 font-mono text-xs text-white/50 hover:text-white/70 underline"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className={`sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b-2 border-black ${(!hasSubscription || needsOnboarding) ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <h1 className="font-display font-extrabold text-xl md:text-2xl uppercase tracking-tight italic flex-shrink-0">
              You<span className="text-black/30">+</span>
            </h1>
            <span className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-black/40 border-l-2 border-black/10 pl-4 truncate">
              {data.futureSelf?.core_identity || 'Define your future self'}
            </span>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/account/settings')}
              className="p-2.5 border border-black/10 hover:border-black hover:bg-black hover:text-white transition-all"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
            <button 
              onClick={onLogout}
              className="p-2.5 border border-red-600/20 hover:border-red-600 hover:bg-red-600 hover:text-white text-red-600 transition-all"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 relative z-10 ${(!hasSubscription || needsOnboarding) ? 'blur-sm pointer-events-none' : ''}`}>
        
        {/* Welcome Section */}
        <div className="mb-6 md:mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1">Welcome back,</p>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight">
            {data.user?.name}
          </h2>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          
          {/* Left Column - Timer & Content */}
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
            
            {/* Timer Card */}
            <HeroTimer targetDate={data.nextCallTime} />
            
            {/* Stats Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <h3 className="font-display font-extrabold text-lg md:text-xl uppercase tracking-tight">The Record</h3>
                <span className="font-mono text-[9px] uppercase tracking-widest text-black/40">// Your Truth</span>
              </div>
              <StatsGrid stats={data.stats} hasCompletedFirstCall={hasCompletedFirstCall} />
            </div>
            
            {/* Pillars Section */}
            {data.pillars && data.pillars.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Compass size={16} className="text-black/50" />
                  <h3 className="font-display font-extrabold text-lg md:text-xl uppercase tracking-tight">Your Pillars</h3>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-black/40">// {data.pillars.length} Active</span>
                </div>
                <PillarGrid 
                  pillars={data.pillars} 
                  primaryPillar={data.futureSelf?.primary_pillar}
                />
                {/* Identity Alignment Summary */}
                {data.pillarAlignment && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-black/5 to-transparent border-2 border-black/15">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-widest text-black/40 mb-1">Identity Alignment</p>
                        <p className="font-display font-extrabold text-2xl md:text-3xl">
                          {data.pillarAlignment.overall_alignment}%
                        </p>
                      </div>
                      <div className={`font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 ${
                        data.pillarAlignment.transformation_status === 'becoming' ? 'bg-green-500 text-white' :
                        data.pillarAlignment.transformation_status === 'progressing' ? 'bg-blue-500 text-white' :
                        data.pillarAlignment.transformation_status === 'struggling' ? 'bg-yellow-500 text-black' :
                        'bg-red-500 text-white'
                      }`}>
                        {data.pillarAlignment.transformation_status}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state - no pillars set up yet */
              <div className="border-2 border-dashed border-black/25 p-5 md:p-6 bg-gray-50/30">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-black/10 flex items-center justify-center flex-shrink-0">
                    <Compass size={20} className="text-black/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-black/40 mb-1">Getting Started</p>
                    <h4 className="font-display font-extrabold text-lg md:text-xl uppercase tracking-tight mb-2 text-black/60">
                      Complete onboarding to define your pillars
                    </h4>
                    <p className="font-mono text-[11px] text-black/40 leading-relaxed">
                      Choose 2-5 areas of life that matter most to you.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Right Column - Status & Streak */}
          <div className="space-y-5 md:space-y-6">
            
            {/* Status Card */}
            <AssessmentCard status={data.status} trustScore={data.stats.trustScore} hasCompletedFirstCall={hasCompletedFirstCall} />

            {/* Streak Card */}
            <div className={`border-2 border-black p-5 md:p-6 relative overflow-hidden transition-all ${
              isOnFire 
                ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[6px_6px_0px_0px_rgba(234,88,12,0.4)]' 
                : 'bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]'
            }`}>
              {/* Background decoration */}
              {isOnFire && (
                <div className="absolute -top-4 -right-4 text-[8rem] opacity-10 pointer-events-none select-none">
                  🔥
                </div>
              )}
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {isOnFire ? (
                      <Flame size={18} className="text-yellow-300" />
                    ) : (
                      <Trophy size={18} className="text-white/50" />
                    )}
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/60">Current Streak</span>
                  </div>
                  {data.stats.longestStreak > 0 && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                      Best: {data.stats.longestStreak}d
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-5xl md:text-6xl tracking-tighter leading-none">
                    {data.stats.currentStreak}
                  </span>
                  <span className="font-mono text-sm uppercase tracking-widest text-white/50">Days</span>
                </div>
                <p className="font-mono text-[11px] text-white/50 mt-3 leading-relaxed">
                  {streakMessage}
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
