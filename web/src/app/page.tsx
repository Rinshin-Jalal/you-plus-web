'use client';

import React from 'react';
import { Check, ArrowRight, Phone, X, Clock, Mic, Calendar, TrendingUp, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { WitnessLogo } from '@/components/ui/WitnessLogo';
import { LegalFooter } from '@/components/shared/LegalFooter';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const startOnboarding = () => {
    router.push('/onboarding');
  };

  // Get user display info
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] relative">
      <GrainOverlay />
      
      {/* Dev buttons */}
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2">
        <button onClick={() => router.push('/dashboard')} className="bg-white/10 text-white text-xs px-3 py-1.5 backdrop-blur font-mono">[Dev] Dashboard</button>
        <button onClick={() => router.push('/call')} className="bg-[#F97316] text-black text-xs px-3 py-1.5 font-mono">[Dev] Call</button>
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </Link>
          <div className="flex items-center gap-4">
            {loading ? (
              // Loading state
              <div className="w-8 h-8 bg-white/10 animate-pulse" />
            ) : isAuthenticated && user ? (
              // Logged in - show user info
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 hover:bg-white/5 px-3 py-2 transition-colors"
              >
                {getUserAvatar() ? (
                  <img 
                    src={getUserAvatar()!} 
                    alt={getUserDisplayName()} 
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 bg-[#F97316] flex items-center justify-center text-black font-bold text-sm">
                    {getUserInitial()}
                  </div>
                )}
                <span className="text-sm text-white/80 font-medium hidden sm:block">
                  {getUserDisplayName()}
                </span>
              </Link>
            ) : (
              // Not logged in - show login/signup buttons
              <>
                <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors">
                  Login
                </Link>
                <button 
                  onClick={startOnboarding} 
                  className="bg-[#F97316] text-black px-5 py-2 text-sm font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors"
                >
                  GET STARTED
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16 relative z-10">
        
        {/* ============ HERO - CENTERED ============ */}
        <section className="relative min-h-[95vh] flex items-center justify-center px-6 py-24 overflow-hidden">
          {/* Phone background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: 'url(/phone.png)' }}
          />
          {/* Dark overlay on top of image */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/60 via-[#0A0A0A]/75 to-[#0A0A0A]" />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-block border border-[#F97316]/50 bg-[#F97316]/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-[#F97316] mb-8">
              FOR PEOPLE DONE WITH EXCUSES
            </div>
            
            {/* Main headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-8 tracking-tight">
              <span className="block text-white">YOUR</span>
              <span className="block text-[#F97316]">FUTURE SELF</span>
              <span className="block text-white">CALLS TONIGHT.</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/70 mb-3 max-w-xl mx-auto">
              Every night at <span className="text-[#F97316] font-semibold">9:00 PM</span>, your phone rings.
              <br />You have to answer for what you did today.
            </p>
            
            <p className="text-xs md:text-sm text-white/40 mb-10 max-w-lg mx-auto">
              Just you, your voice, and the truth.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={startOnboarding}
                className="bg-[#F97316] text-black px-8 py-4 text-sm font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors flex items-center gap-3"
              >
                <span>ANSWER THE CALL</span>
                <ArrowRight size={18} />
              </button>
              
              <button className="text-white/60 hover:text-white text-sm transition-colors px-4 py-4">
                See how it works
              </button>
            </div>
            
            {/* Social proof - Score Indicator */}
            <div className="flex items-center justify-center gap-3 mt-12">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#F97316] border-2 border-[#0A0A0A] flex items-center justify-center text-xs font-bold text-black">M</div>
                <div className="w-8 h-8 rounded-full bg-[#F97316]/80 border-2 border-[#0A0A0A] flex items-center justify-center text-xs font-bold text-black">J</div>
                <div className="w-8 h-8 rounded-full bg-[#F97316]/60 border-2 border-[#0A0A0A] flex items-center justify-center text-xs font-bold text-black/80">K</div>
              </div>
              <span className="text-sm text-white/40">2,847 this week</span>
            </div>
            
            {/* Scroll indicator */}
            <div className="hidden md:flex absolute -bottom-24 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-white/30">
              <svg 
                className="w-6 h-10 animate-bounce" 
                viewBox="0 0 24 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="1" y="1" width="22" height="38" rx="11" stroke="currentColor" strokeWidth="2" />
                <circle className="animate-pulse" cx="12" cy="12" r="4" fill="currentColor">
                  <animate 
                    attributeName="cy" 
                    values="10;20;10" 
                    dur="1.5s" 
                    repeatCount="indefinite" 
                  />
                </circle>
              </svg>
            </div>
          </div>
        </section>

        {/* ============ THE PROBLEM ============ */}
        <section className="px-6 py-24 bg-[#F97316] relative">
          
          <div className="max-w-5xl mx-auto relative z-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* Left - The cycle */}
              <div className="bg-[#0A0A0A] p-10 -rotate-1">
                <h2 className="text-3xl md:text-4xl font-black mb-10 leading-tight tracking-tight">
                  YOU KNOW<br />THE CYCLE.
                </h2>
                
                <div className="space-y-8">
                  <div className="border-l-4 border-white/30 pl-6 hover:border-[#DC2626] transition-colors cursor-default">
                    <div className="font-bold text-xl mb-2">Sunday night motivation</div>
                    <p className="text-base text-white/60 leading-relaxed">"This week is going to be different. I'm going to wake up at 6am, hit the gym, eat clean..."</p>
                  </div>
                  
                  <div className="border-l-4 border-white/30 pl-6 hover:border-[#DC2626] transition-colors cursor-default">
                    <div className="font-bold text-xl mb-2">Monday reality</div>
                    <p className="text-base text-white/60 leading-relaxed">Snoozed the alarm. Skipped the gym. Ordered takeout. Told yourself "I'll start tomorrow."</p>
                  </div>
                  
                  <div className="border-l-4 border-white/30 pl-6 hover:border-[#DC2626] transition-colors cursor-default">
                    <div className="font-bold text-xl mb-2">The guilt spiral</div>
                    <p className="text-base text-white/60 leading-relaxed">You're not lazy. You just have no one to answer to except yourself. And you've learned to lie to yourself really well.</p>
                  </div>
                </div>
              </div>
              
              {/* Right - What failed */}
              <div className="bg-[#0A0A0A] p-10 rotate-1">
                <h2 className="text-xl font-bold mb-10 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#B91C1C] flex items-center justify-center">
                    <X size={18} className="text-white" />
                  </div>
                  <span className="uppercase tracking-wide">WHAT YOU'VE TRIED</span>
                </h2>
                
                <div className="space-y-5">
                  {[
                    { thing: "Productivity apps", why: "Abandoned after 3 days" },
                    { thing: "Habit trackers", why: "Broke the streak, deleted it" },
                    { thing: "Accountability partners", why: "They got busy" },
                    { thing: "Journaling", why: "Blank pages" },
                    { thing: "\"Wake up earlier\"", why: "Snoozed 47 times" },
                    { thing: "Motivational content", why: "Changed nothing" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <X size={16} className="text-[#B91C1C] flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-semibold text-white">{item.thing}</div>
                        <div className="text-sm text-white/40">{item.why}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ THE INSIGHT ============ */}
        <section className="px-6 py-24 bg-[#0A0A0A] relative overflow-hidden">
          
          <div className="max-w-5xl mx-auto relative z-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              
              {/* Left - The lies */}
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/40 mb-8">WHAT YOU CAN LIE TO</div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-5 bg-white/[0.03]">
                    <X size={18} className="text-white/30" />
                    <span className="text-lg text-white/50">Apps & notifications</span>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-white/[0.05]">
                    <X size={18} className="text-white/30" />
                    <span className="text-lg text-white/50">Checkboxes & streaks</span>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-white/[0.03]">
                    <X size={18} className="text-white/30" />
                    <span className="text-lg text-white/50">The voice in your head</span>
                  </div>
                </div>
              </div>
              
              {/* Right - The truth */}
              <div className="bg-[#F97316] p-10 text-black">
                <div className="text-xs font-mono uppercase tracking-[0.3em] text-black/50 mb-8">WHAT YOU CAN'T LIE TO</div>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-black/20 flex items-center justify-center">
                    <Mic size={24} className="text-black" />
                  </div>
                  <span className="text-2xl font-black">Your own voice</span>
                </div>
                
                <p className="text-lg text-black/80 leading-relaxed">
                  When you have to say it out loud — "I didn't do it" — something changes. You can't rationalize. You can't minimize. You hear the truth.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="px-6 py-24 bg-[#F5F5F5] relative">
          
          <div className="max-w-6xl mx-auto relative z-10">
            
            <div className="mb-16">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#F97316]">HOW IT WORKS</span>
              <h2 className="text-3xl md:text-5xl font-black mt-4 text-[#1A1A1A] tracking-tight">THREE MOMENTS. EVERY DAY.</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              
              {/* Step 1 - The Weight */}
              <div className="relative px-8 py-10 border-r border-[#E5E5E5]">
                <div className="absolute top-6 left-8 text-[120px] font-black text-[#E5E5E5] leading-none select-none pointer-events-none" style={{ fontFamily: 'system-ui' }}>01</div>
                <div className="relative z-10 pt-24">
                  <h3 className="text-lg font-black mb-4 text-[#1A1A1A] uppercase tracking-wide">THE WEIGHT</h3>
                  <p className="text-base text-[#4A4A4A] leading-relaxed">
                    Live your day knowing the call is coming tonight. No app to check. Just the quiet knowledge that you'll have to answer for what you did.
                  </p>
                </div>
              </div>

              {/* Step 2 - The Audit */}
              <div className="relative px-8 py-10 border-r border-[#E5E5E5]">
                <div className="absolute top-6 left-8 text-[120px] font-black text-[#E5E5E5] leading-none select-none pointer-events-none" style={{ fontFamily: 'system-ui' }}>02</div>
                <div className="relative z-10 pt-24">
                  <h3 className="text-lg font-black mb-4 text-[#1A1A1A] uppercase tracking-wide">THE AUDIT</h3>
                  <p className="text-base text-[#4A4A4A] leading-relaxed">
                    Your phone rings. The AI remembers exactly what you committed to. Now you have to say out loud whether you did it.
                  </p>
                </div>
              </div>

              {/* Step 3 - Tomorrow's Plan (Orange) */}
              <div className="relative px-8 py-10 bg-[#F97316]">
                <div className="absolute top-6 left-8 text-[120px] font-black text-[#EA580C]/30 leading-none select-none pointer-events-none" style={{ fontFamily: 'system-ui' }}>03</div>
                <div className="relative z-10 pt-24">
                  <h3 className="text-lg font-black mb-4 text-white uppercase tracking-wide">TOMORROW'S PLAN</h3>
                  <p className="text-base text-white/90 leading-relaxed">
                    After the audit, you set tomorrow's commitments. Say them out loud. The AI remembers. Tomorrow night, you'll answer for these too.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES + IS THIS YOU (shared background) ============ */}
        <section className="bg-[#0A0A0A] relative overflow-hidden">
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-20 scale-150"
            style={{ backgroundImage: 'url(/hopewindow.png)' }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#0A0A0A]/80" />
          
          {/* FEATURES */}
          <div className="px-6 py-12 relative z-10">
            <div className="max-w-6xl mx-auto">
              
              <h2 className="text-2xl md:text-3xl font-black mb-10 uppercase tracking-wide text-white">WHAT MAKES THIS DIFFERENT</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4">
                
                <div className="px-6 py-4 border-r border-white/10 hover:bg-white/5 transition-colors cursor-default">
                  <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4">
                    <Mic size={20} className="text-white" />
                  </div>
                  <h3 className="text-sm font-black mb-2 uppercase tracking-wide text-white">VOICE-FIRST</h3>
                  <p className="text-sm text-white/60 leading-relaxed">No typing. You have to say it out loud.</p>
                </div>

                <div className="px-6 py-4 border-r border-white/10 hover:bg-white/5 transition-colors cursor-default">
                  <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4">
                    <Phone size={20} className="text-white" />
                  </div>
                  <h3 className="text-sm font-black mb-2 uppercase tracking-wide text-white">REAL CALLS</h3>
                  <p className="text-sm text-white/60 leading-relaxed">Not notifications. Can't swipe away.</p>
                </div>

                <div className="px-6 py-4 border-r border-white/10 hover:bg-white/5 transition-colors cursor-default">
                  <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <h3 className="text-sm font-black mb-2 uppercase tracking-wide text-white">AI MEMORY</h3>
                  <p className="text-sm text-white/60 leading-relaxed">It remembers everything. Your patterns. Your excuses.</p>
                </div>

                <div className="px-6 py-4 hover:bg-white/5 transition-colors cursor-default">
                  <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <h3 className="text-sm font-black mb-2 uppercase tracking-wide text-white">WEEKLY AUDITS</h3>
                  <p className="text-sm text-white/60 leading-relaxed">Face your track record. How many times did you keep your word?</p>
                </div>
              </div>
            </div>
          </div>

          {/* IS THIS YOU */}
          <div className="px-6 pt-8 pb-24 relative z-10">
            <div className="max-w-6xl mx-auto">
              
              <div className="mb-16">
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#F97316]">SOUND FAMILIAR?</span>
                <h2 className="text-3xl md:text-5xl font-black mt-4 text-white tracking-tight">IS THIS YOU?</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left - Checklist */}
                <div className="space-y-0">
                  {[
                    "You've said \"I'll start Monday\" more times than you can count",
                    "You know exactly what you need to do — you just don't do it",
                    "You've downloaded dozens of apps and abandoned them all",
                    "You're tired of making promises to yourself and breaking them",
                    "You've lost trust in your own word",
                    "You're done with gentle approaches — you need something real"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 border-b border-white/10">
                      <Check size={20} className="flex-shrink-0 text-[#F97316]" />
                      <span className="text-base text-white/80">{item}</span>
                    </div>
                  ))}
                </div>
                
                {/* Right - Orange CTA card */}
                <div className="bg-[#F97316] p-10 flex flex-col justify-center">
                  <h3 className="text-2xl md:text-3xl font-black text-black mb-6">
                    THEN THIS IS FOR YOU.
                  </h3>
                  <p className="text-lg text-black/70 mb-8 leading-relaxed">
                    No more apps. No more streaks. Just one call every night that changes everything.
                  </p>
                  <button 
                    onClick={startOnboarding}
                    className="bg-black text-white px-8 py-4 text-sm font-bold uppercase tracking-wide hover:bg-black/80 transition-colors w-fit flex items-center gap-3"
                  >
                    <span>GET STARTED</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MEET THE WITNESS ============ */}
        <section className="px-6 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              
              {/* Left - Mascot */}
              <div className="flex justify-center">
                <WitnessLogo size="4xl" />
              </div>
              
              {/* Right - Info */}
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#F97316]">YOUR COMPANION</span>
                <h2 className="text-3xl md:text-4xl font-black mt-4 text-[#1A1A1A] tracking-tight mb-6">MEET THE WITNESS</h2>
                <p className="text-lg text-[#4A4A4A] leading-relaxed mb-6">
                  Your accountability companion. It watches, remembers, and reflects your journey back at you.
                </p>
                <p className="text-base text-[#6A6A6A] leading-relaxed mb-8">
                  The more honest you are, the more it evolves. Unlock new forms and accessories as you prove your commitment.
                </p>
                <button 
                  onClick={() => router.push('/witness')}
                  className="text-[#F97316] font-bold text-sm uppercase tracking-wide hover:text-[#EA580C] transition-colors flex items-center gap-2"
                >
                  <span>LEARN MORE</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CTA + PRICING ============ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          
          {/* Left - CTA (Dark) */}
          <div className="bg-[#0A0A0A] px-8 md:px-16 py-24 flex items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-white">
                THE CALL IS<br /><span className="text-[#F97316]">COMING.</span>
              </h2>
              <p className="text-xl text-white/70 mb-4">
                Tonight at 9pm, your phone will ring.
              </p>
              <p className="text-base text-white/50 mb-10 leading-relaxed max-w-md">
                You'll hear the question: "Did you do what you said you would do?" And for the first time, you won't be able to lie.
              </p>
              <button 
                onClick={startOnboarding}
                className="bg-[#F97316] text-black px-8 py-4 text-sm font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors inline-flex items-center gap-3"
              >
                <span>ANSWER THE CALL</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Right - Pricing (Orange) */}
          <div className="bg-[#F97316] px-8 md:px-16 py-24 flex items-center">
            <div className="w-full max-w-md">
              
              <div className="text-xs font-mono uppercase tracking-[0.3em] text-black/50 mb-4">SIMPLE PRICING</div>
              
              <div className="text-6xl md:text-7xl font-black text-black mb-2">$6.99</div>
              <p className="text-lg text-black/60 mb-10">/week after 7-day free trial</p>

              <div className="space-y-4 mb-10">
                {[
                  'Nightly accountability calls',
                  'AI that remembers everything',
                  'Weekly performance audits',
                  'Pattern recognition',
                  'Cancel anytime'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ArrowRight size={16} className="text-black/70" />
                    <span className="text-base font-semibold text-black">{item}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={startOnboarding}
                className="w-full bg-black text-white py-5 text-sm font-bold uppercase tracking-wide hover:bg-black/80 transition-colors"
              >
                START FREE TRIAL
              </button>
              
              <p className="text-center text-sm text-black/50 mt-4">No credit card required</p>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="px-6 py-24 bg-[#0A0A0A]">
          <div className="max-w-3xl mx-auto">
            
            <h2 className="text-lg font-bold mb-12 uppercase tracking-wide">Questions you might have</h2>
            
            <div className="space-y-0">
              {[
                { q: "Is this actually a real phone call?", a: "Yes. Your phone rings. You pick up. You speak. It's not a notification you can swipe away." },
                { q: "What if I miss a call?", a: "We'll try again. But when you know the call is coming, you don't want to miss it. That's the point." },
                { q: "This sounds kind of intense.", a: "It is. That's why it works. You've tried gentle. None of it worked because none of it had real weight." },
                { q: "What does the AI remember?", a: "Everything. Your commitments, results, patterns, excuses. It builds a picture of who you're trying to become." },
                { q: "Is this actually healthy?", a: "Honestly? Not sure. But it has broken cycles that people have been stuck in for years." },
                { q: "Can I cancel anytime?", a: "Yes. But most people don't. Not because they're trapped, but because it's actually working." },
              ].map((item, i) => (
                <div key={i} className="py-6 border-b border-white/10">
                  <h3 className="text-base font-bold mb-2">{item.q}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="px-6 min-h-screen bg-[#0A0A0A] text-center relative overflow-hidden flex flex-col">
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: 'url(/tabe.png)' }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#0A0A0A]/70" />
          
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-xl mx-auto relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase">Stop lying<br />to yourself.</h2>
              <p className="text-lg text-white/50 mb-10">The call is coming. Will you answer?</p>
              <button 
                onClick={startOnboarding}
                className="bg-[#F97316] text-black px-10 py-5 text-sm font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors inline-flex items-center gap-3"
              >
                <span>START YOUR FIRST CALL</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          
          {/* Footer inside the section */}
          <div className="relative z-10 py-6 px-4">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
              <p className="text-white/40">
                © {new Date().getFullYear()} You+. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="/legal/privacy" className="text-white/40 hover:text-white/70 transition-colors">
                  Privacy Policy
                </a>
                <a href="/legal/terms" className="text-white/40 hover:text-white/70 transition-colors">
                  Terms of Service
                </a>
                <a href="mailto:support@youplus.app" className="text-white/40 hover:text-white/70 transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
