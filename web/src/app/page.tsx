'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Phone, X, Mic, User, LogOut, Brain, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { WitnessLogo } from '@/components/ui/WitnessLogo';

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState('9:00 PM');
  
  // Update time display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      // Show "Tonight" time as 9 PM if before 9, or next hour if after
      if (hours < 21) {
        setCurrentTime('9:00 PM');
      } else {
        setCurrentTime('Tomorrow 9:00 PM');
      }
    };
    updateTime();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const startOnboarding = () => router.push('/onboarding');

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    try {
      await signOut();
    } catch (error) {
      console.error('[LANDING] Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      
      {/* ══════════════════════════════════════════════════════════════════════
          NAVIGATION - Minimal, asymmetric
      ══════════════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </div>
          
          {authLoading ? (
            <div className="w-8 h-8 rounded-md bg-white/10 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex items-center gap-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-md" />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-[#F97316] flex items-center justify-center">
                    <User size={14} />
                  </div>
                )}
                <span className="hidden sm:block">{user?.user_metadata?.name?.split(' ')[0] || 'Account'}</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-[#1A1A1A] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); router.push('/dashboard'); }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/5"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center justify-between border-t border-white/5"
                  >
                    <span>Log out</span>
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/auth/login')} 
                className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
              >
                Login
              </button>
              <button 
                onClick={() => router.push('/onboarding')} 
                className="bg-[#F97316] text-black px-5 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO - Centered, dramatic, mascot-focused
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A] to-[#111]" />
        
        {/* Radial glow behind mascot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F97316] rounded-full blur-[300px] opacity-[0.08]" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        
        <div className="max-w-[1000px] mx-auto px-6 md:px-12 w-full relative z-10 pt-32 pb-20">
          <div className="flex flex-col items-center text-center">
            
            {/* The Witness mascot - large and prominent */}
            <div className="mb-8 relative">
              {/* Pulsing ring behind mascot */}
              <div className="absolute inset-[-20px] rounded-full border-2 border-[#F97316]/20 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-[-40px] rounded-full border border-[#F97316]/10 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
              <WitnessLogo size="2xl" animate={true} />
            </div>
            
            {/* Eyebrow */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-[#F97316] border border-[#F97316]/30 bg-[#F97316]/5">
                For people done with excuses
              </span>
            </div>
            
            {/* Headline - BIG and centered */}
            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.95] tracking-tighter mb-6">
              <span className="block text-white">YOUR</span>
              <span className="block text-[#F97316]">FUTURE SELF</span>
              <span className="block text-white">CALLS TONIGHT.</span>
            </h1>
            
            {/* Subtext */}
            <p className="text-lg md:text-xl text-white/50 max-w-xl mb-4 leading-relaxed">
              Every night at <span className="text-[#F97316] font-semibold">{currentTime}</span>, your phone rings.
              <br className="hidden sm:block" />
              You have to answer for what you did today.
            </p>
            
            <p className="text-base text-white/30 max-w-lg mb-10 leading-relaxed">
              No more lying to apps. No more broken streaks. No more excuses.
              <br className="hidden sm:block" />
              Just you, your voice, and the truth.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
              <button 
                onClick={startOnboarding}
                className="group relative bg-[#F97316] text-black font-black text-lg px-10 py-5 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] active:scale-100"
              >
                <span className="flex items-center gap-3">
                  ANSWER THE CALL
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button 
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-white/60 hover:text-white font-medium px-6 py-4 transition-colors"
              >
                See how it works
              </button>
            </div>
            
            {/* Social proof */}
            <div className="flex items-center gap-4 text-sm text-white/40">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#333] to-[#222] border-2 border-[#0A0A0A] flex items-center justify-center text-[10px] font-bold text-white/60">
                    {['M', 'A', 'J', 'S', 'K'][i-1]}
                  </div>
                ))}
              </div>
              <span>
                <span className="text-white font-semibold">2,847</span> calls answered this week
              </span>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          THE PROBLEM - Diagonal split, high contrast
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden bg-[#F97316]">
        
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left - Dark card */}
            <div className="bg-[#0A0A0A] p-10 md:p-12 -rotate-1 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight">
                YOU KNOW<br />THE CYCLE.
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-[#F97316] pl-6 py-2">
                  <div className="font-bold text-lg mb-1">Sunday night motivation</div>
                  <p className="text-sm text-white/60">&quot;This week is going to be different. I&apos;m going to wake up at 6am, hit the gym, eat clean...&quot;</p>
                </div>
                
                <div className="border-l-4 border-white/20 pl-6 py-2">
                  <div className="font-bold text-lg mb-1">Monday reality</div>
                  <p className="text-sm text-white/60">Snoozed the alarm. Skipped the gym. Ordered takeout. Told yourself &quot;I&apos;ll start tomorrow.&quot;</p>
                </div>
                
                <div className="border-l-4 border-white/30 pl-6 py-2">
                  <div className="font-bold text-lg mb-1">The guilt spiral</div>
                  <p className="text-sm text-white/60">You&apos;re not lazy. You just have no one to answer to except yourself. And you&apos;ve learned to lie to yourself really well.</p>
                </div>
              </div>
            </div>
            
            {/* Right - What failed */}
            <div className="bg-[#0A0A0A] p-10 md:p-12 rotate-1 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-red-500 flex items-center justify-center">
                  <X size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-black">WHAT YOU&apos;VE TRIED</h2>
              </div>
              
              <div className="space-y-0">
                {[
                  { thing: "Productivity apps", why: "Abandoned after 3 days" },
                  { thing: "Habit trackers", why: "Broke the streak, deleted it" },
                  { thing: "Accountability partners", why: "They got busy" },
                  { thing: "Journaling", why: "Blank pages" },
                  { thing: '"Wake up earlier"', why: "Snoozed 47 times" },
                  { thing: "Motivational content", why: "Changed nothing" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 py-4 border-b border-white/10 last:border-0">
                    <X size={14} className="text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-white/80">{item.thing}</div>
                      <div className="text-xs text-white/40">{item.why}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          THE INSIGHT - Split layout, left/right
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0A0A0A]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-24 lg:py-32">
            
            {/* Left Side - What doesn't work (just text, no card) */}
            <div className="flex flex-col justify-center text-center lg:text-left">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-8">
                What didn&apos;t work
              </p>
              <div className="space-y-5 lg:space-y-6 max-w-md mx-auto lg:mx-0">
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-white/30 line-through decoration-white/20">
                  • Lie to apps
                </p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-white/30 line-through decoration-white/20">
                  • Lie to journals
                </p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-white/30 line-through decoration-white/20">
                  • Lie to yourself
                </p>
              </div>
            </div>
            
            {/* Right Side - The solution (Orange card on black) */}
            <div className="flex flex-col justify-center items-center lg:items-start">
              <div className="relative">
                {/* Offset shadow */}
                <div className="absolute inset-0 bg-[#0A0A0A] translate-x-3 translate-y-3" />
                {/* Orange card */}
                <div className="relative bg-[#F97316] border-4 border-[#0A0A0A] p-8 md:p-10 max-w-md">
                  <h2 className="text-2xl md:text-3xl font-black text-[#0A0A0A] leading-tight mb-4">
                    YOU CAN&apos;T LIE TO YOUR OWN VOICE.
                  </h2>
                  <p className="text-base text-[#0A0A0A]/70 leading-relaxed">
                    When you have to say it out loud — &quot;I didn&apos;t do it&quot; — something changes. You hear the truth.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS - Numbered steps, stark contrast
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-32 bg-white text-[#0A0A0A] relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <Image 
            src="/alarm.png" 
            alt="" 
            fill 
            className="object-cover object-center opacity-10"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-white/80" />
        </div>
        
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
          
          <div className="mb-16">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316]">How it works</span>
            <h2 className="text-3xl md:text-4xl font-black mt-2">THREE MOMENTS. EVERY DAY.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            
            {/* Step 1 */}
            <div className="border-b md:border-b-0 md:border-r border-[#0A0A0A]/10 p-10">
              <div className="text-[120px] font-black leading-none text-[#0A0A0A]/5 -mb-8">01</div>
              <h3 className="text-xl font-black mb-4">THE WEIGHT</h3>
              <p className="text-[#0A0A0A]/60 leading-relaxed">
                Live your day knowing the call is coming tonight. No app to check. Just the quiet knowledge that you&apos;ll have to answer for what you did.
              </p>
            </div>

            {/* Step 2 */}
            <div className="border-b md:border-b-0 md:border-r border-[#0A0A0A]/10 p-10">
              <div className="text-[120px] font-black leading-none text-[#0A0A0A]/5 -mb-8">02</div>
              <h3 className="text-xl font-black mb-4">THE AUDIT</h3>
              <p className="text-[#0A0A0A]/60 leading-relaxed">
                Your phone rings. The AI remembers exactly what you committed to. Now you have to say out loud whether you did it.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-10 bg-[#F97316]">
              <div className="text-[120px] font-black leading-none text-[#0A0A0A]/10 -mb-8">03</div>
              <h3 className="text-xl font-black mb-4">TOMORROW&apos;S PLAN</h3>
              <p className="text-[#0A0A0A]/70 leading-relaxed">
                After the audit, you set tomorrow&apos;s commitments. Say them out loud. The AI remembers. Tomorrow night, you&apos;ll answer for these too.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES - Minimal grid
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-32">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          <h2 className="text-lg font-black mb-12 text-white/50">WHAT MAKES THIS DIFFERENT</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/10">
            <div className="bg-[#0A0A0A] p-8 hover:bg-[#111] transition-colors">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-6">
                <Mic size={20} />
              </div>
              <h3 className="text-sm font-black mb-2">VOICE-FIRST</h3>
              <p className="text-sm text-white/50">No typing. You have to say it out loud.</p>
            </div>
            
            <div className="bg-[#0A0A0A] p-8 hover:bg-[#111] transition-colors">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-6">
                <Phone size={20} />
              </div>
              <h3 className="text-sm font-black mb-2">REAL CALLS</h3>
              <p className="text-sm text-white/50">Not notifications. Can&apos;t swipe away.</p>
            </div>
            
            <div className="bg-[#0A0A0A] p-8 hover:bg-[#111] transition-colors">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-6">
                <Brain size={20} />
              </div>
              <h3 className="text-sm font-black mb-2">AI MEMORY</h3>
              <p className="text-sm text-white/50">It remembers everything. Your patterns. Your excuses.</p>
            </div>
            
            <div className="bg-[#0A0A0A] p-8 hover:bg-[#111] transition-colors">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-6">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-sm font-black mb-2">WEEKLY AUDITS</h3>
              <p className="text-sm text-white/50">Face your track record. How many times did you keep your word?</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING - Split, dramatic
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          
          {/* Left - CTA with background */}
          <div className="relative p-12 md:p-20 flex items-center">
            {/* Background image */}
            <div className="absolute inset-0">
              <Image 
                src="/2sides.png" 
                alt="" 
                fill 
                className="object-cover object-center opacity-20"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-[#0A0A0A]/75" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                THE CALL IS<br />
                <span className="text-[#F97316]">COMING.</span>
              </h2>
              
              <p className="text-xl text-white/60 mb-4">Tonight at 9pm, your phone will ring.</p>
              <p className="text-base text-white/40 max-w-md mb-12 leading-relaxed">
                You&apos;ll hear the question: &quot;Did you do what you said you would do?&quot;
                And for the first time, you won&apos;t be able to lie.
              </p>
              
              <button 
                onClick={startOnboarding}
                className="bg-[#F97316] text-black font-black text-lg px-10 py-5 hover:bg-[#FB923C] transition-colors flex items-center gap-3"
              >
                ANSWER THE CALL
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
          
          {/* Right - Pricing */}
          <div className="bg-[#F97316] p-12 md:p-20 flex items-center justify-center text-[#0A0A0A]">
            <div className="max-w-sm w-full">
              
              <div className="text-xs font-mono uppercase tracking-widest mb-4 opacity-60">Simple pricing</div>
              
              <div className="text-7xl font-black mb-2">$6.99</div>
              <p className="text-lg opacity-60 mb-10">/week after 7-day free trial</p>
              
              <div className="space-y-4 mb-10">
                {[
                  'Nightly accountability calls',
                  'AI that remembers everything',
                  'Weekly performance audits',
                  'Pattern recognition',
                  'Cancel anytime'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-[#0A0A0A] flex items-center justify-center">
                      <ArrowRight size={12} className="text-[#F97316]" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={startOnboarding}
                className="w-full bg-[#0A0A0A] text-white font-black text-lg py-5 hover:bg-[#1A1A1A] transition-colors"
              >
                START FREE TRIAL
              </button>
              
              <p className="text-center text-sm mt-4 opacity-50">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FAQ - Minimal
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-32 bg-[#0A0A0A]">
        <div className="max-w-[800px] mx-auto px-6 md:px-12">
          
          <h2 className="text-lg font-black mb-12 text-white/50">QUESTIONS</h2>
          
          <div className="divide-y divide-white/10">
            {[
              { q: "Is this actually a real phone call?", a: "Yes. Your phone rings. You pick up. You speak. It's not a notification you can swipe away." },
              { q: "What if I miss a call?", a: "We'll try again. But when you know the call is coming, you don't want to miss it. That's the point." },
              { q: "This sounds kind of intense.", a: "It is. That's why it works. You've tried gentle. It didn't work." },
              { q: "What does the AI remember?", a: "Everything. Your commitments, results, patterns, excuses. It builds a picture of who you're trying to become." },
              { q: "Can I cancel anytime?", a: "Yes. But most people don't. Not because they're trapped, but because it's working." },
            ].map((item, i) => (
              <div key={i} className="py-8">
                <h3 className="text-base font-bold mb-3">{item.q}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-40 text-center relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <Image 
            src="/tabe.png" 
            alt="" 
            fill 
            className="object-cover object-center opacity-25"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#0A0A0A]/70" />
        </div>
        
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F97316] rounded-full blur-[250px] opacity-[0.1]" />
        
        <div className="max-w-[600px] mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            STOP LYING<br />TO YOURSELF.
          </h2>
          <p className="text-lg text-white/50 mb-10">The call is coming. Will you answer?</p>
          
          <button 
            onClick={startOnboarding}
            className="bg-[#F97316] text-black font-black text-lg px-12 py-6 hover:bg-[#FB923C] transition-colors inline-flex items-center gap-3"
          >
            START YOUR FIRST CALL
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER - Minimal
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <WitnessLogo size="sm" showWordmark />
          </div>
          <div className="flex gap-8 text-sm text-white/40">
            <a href="mailto:support@youplus.app" className="hover:text-white transition-colors">Contact</a>
            <a href="/legal/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/legal/privacy" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
