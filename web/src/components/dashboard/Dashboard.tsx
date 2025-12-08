
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDashboardData } from '@/hooks/useDashboardData';
import { HeroTimer } from '@/components/dashboard/HeroTimer';
import { AssessmentCard } from '@/components/dashboard/AssessmentCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { PillarGrid } from '@/components/dashboard/PillarGrid';
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
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-[#F97316] flex items-center justify-center animate-pulse">
          <span className="text-2xl font-black text-black">Y+</span>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-white/40">Loading...</p>
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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans relative overflow-hidden">
      
      {/* Background image with overlay */}
      <div className="fixed inset-0 z-0">
        <Image 
          src="/hopewindow.png" 
          alt="" 
          fill 
          className="object-cover object-center opacity-15"
        />
        <div className="absolute inset-0 bg-[#0A0A0A]/85" />
      </div>
      
      {/* Ambient glow */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#F97316] blur-[250px] opacity-[0.06] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#F97316] blur-[200px] opacity-[0.04] pointer-events-none" />
      
      {/* Onboarding Required Overlay */}
      {needsOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          <div className="relative z-10 bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#F97316]/50 p-8 md:p-12 max-w-md mx-4 shadow-[0_0_60px_rgba(249,115,22,0.2)]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FB923C] to-[#EA580C] flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgba(249,115,22,0.3)]">
                <Compass size={36} className="text-white" />
              </div>
              <h2 className="font-bold text-2xl md:text-3xl tracking-tight mb-3 text-white">
                Complete Your Setup
              </h2>
              <p className="text-sm text-white/60 mb-8 leading-relaxed">
                Define your future self and set up your pillars to get personalized AI coaching tailored just for you.
              </p>
              <Button
                onClick={() => router.push('/onboarding')}
                variant="primary"
                className="w-full"
              >
                Start Onboarding
              </Button>
              <button
                onClick={onLogout}
                className="mt-4 text-xs text-white/40 hover:text-white/60 transition-colors"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          <div className="relative z-10 bg-[#0A0A0A]/95 backdrop-blur-xl border border-red-500/50 p-8 md:p-12 max-w-md mx-4 shadow-[0_0_60px_rgba(239,68,68,0.15)]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgba(239,68,68,0.3)]">
                <span className="text-4xl font-bold text-white">!</span>
              </div>
              <h2 className="font-bold text-2xl md:text-3xl tracking-tight mb-3 text-white">
                Subscription Required
              </h2>
              <p className="text-sm text-white/60 mb-8 leading-relaxed">
                Unlock your potential with You+ Pro. Get daily AI coaching calls, personalized guidance, and track your transformation.
              </p>
              <Button
                onClick={() => router.push('/checkout')}
                variant="primary"
                className="w-full"
              >
                Subscribe Now
              </Button>
              <button
                onClick={onLogout}
                className="mt-4 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className={`sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 ${(!hasSubscription || needsOnboarding) ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-18 flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl md:text-2xl tracking-tight flex-shrink-0">
                You<span className="text-[#F97316]">+</span>
              </h1>
            </div>
            <span className="hidden md:block text-xs text-white/40 border-l border-white/10 pl-4 truncate">
              {data.futureSelf?.core_identity || 'Define your future self'}
            </span>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/account/settings')}
              className="p-2.5 rounded-md border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-200"
              aria-label="Settings"
            >
              <Settings size={18} className="text-white/60" />
            </button>
            <button 
              onClick={onLogout}
              className="p-2.5 rounded-md border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 transition-all duration-200"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 relative z-10 ${(!hasSubscription || needsOnboarding) ? 'blur-sm pointer-events-none' : ''}`}>
        
        {/* Welcome Section */}
        <div className="mb-8 md:mb-12">
          <p className="text-xs uppercase tracking-widest text-[#F97316] mb-2">Welcome back,</p>
          <h2 className="font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight">
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
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-bold text-lg md:text-xl tracking-tight">The Record</h3>
                <span className="text-xs text-white/30">Your Truth</span>
              </div>
              <StatsGrid stats={data.stats} hasCompletedFirstCall={hasCompletedFirstCall} />
            </div>
            
            {/* Pillars Section */}
            {data.pillars && data.pillars.length > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center">
                    <Compass size={16} className="text-[#F97316]" />
                  </div>
                  <h3 className="font-bold text-lg md:text-xl tracking-tight">Your Pillars</h3>
                  <span className="text-xs text-white/30">{data.pillars.length} Active</span>
                </div>
                <PillarGrid 
                  pillars={data.pillars} 
                  primaryPillar={data.futureSelf?.primary_pillar}
                  hasCompletedFirstCall={hasCompletedFirstCall}
                />
                {/* Identity Alignment Summary */}
                {data.pillarAlignment && (
                  <div className="mt-4 p-5 bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Identity Alignment</p>
                        <p className="font-bold text-3xl md:text-4xl">
                          {data.pillarAlignment.overall_alignment}%
                        </p>
                      </div>
                      <div className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 ${
                        data.pillarAlignment.transformation_status === 'becoming' ? 'bg-green-500/20 text-green-400' :
                        data.pillarAlignment.transformation_status === 'progressing' ? 'bg-blue-500/20 text-blue-400' :
                        data.pillarAlignment.transformation_status === 'struggling' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {data.pillarAlignment.transformation_status}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : data.futureSelf?.core_identity ? (
              <div className="border border-dashed border-white/20 p-6 bg-white/5 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Compass size={20} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Loading</p>
                    <h4 className="font-bold text-lg tracking-tight mb-2 text-white/60">
                      Awaiting pillars data...
                    </h4>
                    <p className="text-sm text-white/40 leading-relaxed">
                      Your pillars are being loaded.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-white/20 p-6 bg-white/5 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <Compass size={20} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Getting Started</p>
                    <h4 className="font-bold text-lg tracking-tight mb-2 text-white/60">
                      Complete onboarding to define your pillars
                    </h4>
                    <p className="text-sm text-white/40 leading-relaxed">
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
            <div className={`rounded-md p-6 relative overflow-hidden transition-all duration-300 ${
              isOnFire 
                ? 'bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white shadow-[0_8px_40px_rgba(249,115,22,0.3)]' 
                : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white'
            }`}>
              {/* Background decoration */}
              {isOnFire && (
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 blur-2xl" />
              )}
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isOnFire ? 'bg-white/20' : 'bg-white/5'}`}>
                      {isOnFire ? (
                        <Flame size={16} className="text-yellow-300" />
                      ) : (
                        <Trophy size={16} className="text-white/50" />
                      )}
                    </div>
                    <span className="text-xs uppercase tracking-widest text-white/60">Current Streak</span>
                  </div>
                  {data.stats.longestStreak > 0 && (
                    <span className="text-xs text-white/40">
                      Best: {data.stats.longestStreak}d
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-6xl md:text-7xl tracking-tighter leading-none">
                    {data.stats.currentStreak}
                  </span>
                  <span className="text-sm uppercase tracking-widest text-white/50">Days</span>
                </div>
                <p className="text-sm text-white/60 mt-4 leading-relaxed">
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
