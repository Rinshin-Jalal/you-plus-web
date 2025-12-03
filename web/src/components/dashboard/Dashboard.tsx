
import React from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/useDashboardData';
import { HeroTimer } from '@/components/dashboard/HeroTimer';
import { AssessmentCard } from '@/components/dashboard/AssessmentCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { Button } from '@/components/ui/Button';
import { LogOut, Target, Settings, Flame } from 'lucide-react';

export default function Dashboard({ onLogout, onJoinCall }: { onLogout: () => void, onJoinCall: () => void }) {
  const router = useRouter();
  const { data, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-black border-t-transparent animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-black/50">Loading System Data...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <GrainOverlay />
      
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b-2 border-black">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="font-display font-extrabold text-2xl uppercase tracking-tight italic">
              You<span className="text-black/30">+</span>
            </h1>
            <span className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-black/40 border-l-2 border-black/10 pl-4">
              {data.user.name} // {data.user.identity}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10">
        
        {/* Welcome */}
        <div className="mb-8 md:mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-black/40 mb-2">Welcome back,</p>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl uppercase tracking-tight">
            {data.user.name}
          </h2>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Left Column - Timer & Stats */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* Timer Card */}
            <HeroTimer targetDate={data.nextCallTime} onJoinCall={onJoinCall} />
            
            {/* Stats */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-display font-extrabold text-xl uppercase tracking-tight">The Record</h3>
                <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">// Your Truth</span>
              </div>
              <StatsGrid stats={data.stats} />
            </div>
            
            {/* Mission Card */}
            <div className="border-2 border-black p-6 md:p-8 bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-black flex items-center justify-center flex-shrink-0">
                  <Target size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1">Your Mission</p>
                  <h4 className="font-display font-extrabold text-xl md:text-2xl uppercase tracking-tight mb-3">
                    {data.user.identity}
                  </h4>
                  <div className="w-full h-3 bg-black/10 border border-black/20">
                    <div 
                      className="h-full bg-black transition-all duration-500"
                      style={{ width: `${data.stats.trustScore}%` }}
                    />
                  </div>
                  <p className="font-mono text-xs text-black/40 mt-2">
                    {data.stats.trustScore}% aligned with stated identity
                  </p>
                </div>
              </div>
            </div>
            
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6 md:space-y-8">
            
            {/* Status Card */}
            <AssessmentCard status={data.identityStatus} trustScore={data.stats.trustScore} />

            {/* Daily Streak */}
            <div className="border-2 border-black bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-3 mb-4">
                <Flame size={20} className="text-orange-500" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">Current Streak</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-6xl tracking-tighter leading-none">
                  {data.stats.streak}
                </span>
                <span className="font-mono text-sm uppercase tracking-widest text-white/40">Days</span>
              </div>
              <p className="font-mono text-xs text-white/40 mt-4">
                {data.stats.streak === 0 
                  ? "Start building momentum today." 
                  : "Don't break the chain."}
              </p>
            </div>

            {/* Settings Button */}
            <button 
              onClick={() => router.push('/account/settings')}
              className="w-full p-4 border-2 border-black/20 hover:border-black flex items-center justify-center gap-2 transition-colors hover:bg-black hover:text-white"
            >
              <Settings size={16} />
              <span className="font-mono text-xs uppercase tracking-widest">Settings</span>
            </button>

            {/* Sign Out Button */}
            <button 
              onClick={onLogout}
              className="w-full p-4 border-2 border-red-600/20 hover:border-red-600 flex items-center justify-center gap-2 transition-colors hover:bg-red-600 hover:text-white text-red-600"
            >
              <LogOut size={16} />
              <span className="font-mono text-xs uppercase tracking-widest">Sign Out</span>
            </button>

          </div>
        </div>

      </main>
    </div>
  );
}
