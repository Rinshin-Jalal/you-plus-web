'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ArrowRight, Phone, X, Clock, Mic, Calendar, TrendingUp, Volume2, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [debugLogs, setDebugLogs] = useState<string[] | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check if we just came from a signout
    if (typeof window !== 'undefined') {
      const signoutComplete = sessionStorage.getItem('signout_complete');
      const logs = sessionStorage.getItem('signout_logs');
      
      if (signoutComplete && logs) {
        try {
          setDebugLogs(JSON.parse(logs));
        } catch (e) {
          console.error('Failed to parse signout logs', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const clearLogs = () => {
    setDebugLogs(null);
    sessionStorage.removeItem('signout_complete');
    sessionStorage.removeItem('signout_logs');
  };

  const startOnboarding = () => {
    router.push('/onboarding');
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('[LANDING] Sign out error:', error);
        return;
      }
    } catch (error) {
      console.error('[LANDING] Unexpected sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      
      {/* Debug Logs Viewer */}
      {debugLogs && (
        <div className="fixed top-4 left-4 right-4 z-[1000] bg-black text-white p-4 max-h-[50vh] overflow-auto font-mono text-xs">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-green-400">🔍 SIGN-OUT DEBUG LOGS</h3>
            <button onClick={clearLogs} className="text-red-400 hover:text-red-300">✕ Close</button>
          </div>
          <div className="space-y-1 bg-black/50 p-3 rounded">
            {debugLogs.map((log, i) => (
              <div key={i} className="border-l-2 border-green-500 pl-2 py-0.5">
                {log}
              </div>
            ))}
          </div>
          <div className="mt-3 text-yellow-400 text-xs">
            ⚠️ Share these logs with the developer to debug the sign-out issue
          </div>
        </div>
      )}
      
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-6 h-14 flex justify-between items-center">
          <div className="text-xl font-bold">You+</div>
          
          {/* Auth-aware nav button */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button 
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 group focus:outline-none"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                {user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border-2 border-black group-hover:border-black/50 transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-black text-white flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                    <User size={16} />
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:block group-hover:underline underline-offset-4">
                  {user?.user_metadata?.name?.split(' ')[0] || 'Dashboard'}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      router.push('/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-black/10"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center justify-between"
                  >
                    <span>Log out</span>
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => router.push('/auth/login')} className="text-sm hover:underline underline-offset-4">Login</button>
          )}
        </div>
      </nav>

      <main className="pt-14">
        
        {/* ============ HERO - WHITE ============ */}
        <section className="px-6 py-24 md:py-32 bg-white border-b-2 border-black">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left - Copy */}
              <div>
                <div className="inline-block border-2 border-black px-3 py-1 text-xs font-bold mb-8 tracking-wide">
                  FOR PEOPLE WHO ARE DONE WITH THEIR OWN BULLSHIT
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8">
                  I get a call every night from my future self.
                </h1>
                
                <p className="text-lg mb-4 leading-relaxed">
                  It's the only thing that's kept me consistent.
                </p>
                
                <p className="text-base text-black/60 mb-10 leading-relaxed max-w-md">
                  I've downloaded every productivity app. Tried journaling, habit trackers, 
                  accountability partners, "make your bed" videos. Still fell off. Every. Single. Time.
                  So I built something different.
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <button 
                    onClick={startOnboarding}
                    className="bg-black text-white px-8 py-4 text-sm font-bold border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 transition-all flex items-center gap-3"
                  >
                    <span>START YOUR FIRST CALL</span>
                    <ArrowRight size={18} />
                  </button>
                  
                  <div className="flex items-center gap-3 text-sm py-4">
                    <span className="w-2 h-2 bg-[#00FF00]" />
                    <span>2,847 started this week</span>
                  </div>
                </div>
              </div>

              {/* Right - Phone mockup */}
              <div className="relative">
                <div className="border-2 border-black bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                  {/* Phone header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-2 border-white flex items-center justify-center">
                        <Phone size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold">INCOMING CALL</div>
                        <div className="text-xs text-white/50">You+ Accountability</div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">9:47 PM</div>
                  </div>
                  
                  {/* Call content */}
                  <div className="space-y-3 mb-6">
                    <div className="text-xs text-white/50 uppercase tracking-wider">Tonight's Audit</div>
                    <div className="text-base font-bold leading-snug">
                      "You said you'd hit the gym and finish the proposal. Did you do it?"
                    </div>
                  </div>
                  
                  {/* Voice visualization */}
                  <div className="flex items-center justify-center gap-1 py-6">
                    {[40, 70, 50, 80, 60, 90, 45, 75, 55, 85, 65, 40].map((h, i) => (
                      <div key={i} className="w-1 bg-white/70" style={{ height: `${h * 0.4}px` }} />
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button className="border-2 border-white/30 py-3 text-sm font-bold hover:bg-white hover:text-black transition-colors">
                      I DID IT
                    </button>
                    <button className="border-2 border-red-500 text-red-500 py-3 text-sm font-bold hover:bg-red-500 hover:text-white transition-colors">
                      I DIDN'T
                    </button>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-3 -right-3 w-6 h-6 border-2 border-black bg-white" />
                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-black" />
              </div>
            </div>
          </div>
        </section>

        {/* ============ THE PROBLEM - BLACK ============ */}
        <section className="px-6 py-24 bg-black text-white border-b-2 border-black">
          <div className="max-w-5xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* Left - The cycle */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-10 leading-tight">
                  You know the cycle.
                </h2>
                
                <div className="space-y-8">
                  <div className="border-l-4 border-red-500 pl-6">
                    <div className="font-bold text-lg mb-2">Sunday night motivation</div>
                    <p className="text-sm text-white/60 leading-relaxed">"This week is going to be different. I'm going to wake up at 6am, hit the gym, eat clean, finish that project."</p>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-6">
                    <div className="font-bold text-lg mb-2">Monday reality</div>
                    <p className="text-sm text-white/60 leading-relaxed">Snoozed the alarm. Skipped the gym. Ordered takeout. Scrolled until 2am. Told yourself "I'll start tomorrow."</p>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-6">
                    <div className="font-bold text-lg mb-2">The guilt spiral</div>
                    <p className="text-sm text-white/60 leading-relaxed">You're not lazy. You're not broken. You just have no one to answer to except yourself. And you've learned to lie to yourself really well.</p>
                  </div>
                </div>
              </div>
              
              {/* Right - What failed */}
              <div>
                <h2 className="text-base font-bold mb-8 flex items-center gap-3">
                  <X size={20} className="text-red-500" />
                  What you've already tried
                </h2>
                
                <div className="space-y-0">
                  {[
                    { thing: "Productivity apps", why: "Abandoned after 3 days. Too easy to ignore." },
                    { thing: "Habit trackers", why: "Broke the streak, felt guilty, deleted it." },
                    { thing: "Accountability partners", why: "They got busy. Stopped asking." },
                    { thing: "Journaling", why: "Blank pages. Broken promises." },
                    { thing: "\"Wake up earlier\"", why: "Snoozed 47 times." },
                    { thing: "Motivational content", why: "Felt good. Changed nothing." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 py-4 border-b border-white/10">
                      <X size={16} className="text-red-500 flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-sm font-bold">{item.thing}</div>
                        <div className="text-sm text-white/50">{item.why}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ THE INSIGHT - WHITE ============ */}
        <section className="px-6 py-32 bg-white text-black border-b-2 border-black relative overflow-hidden">
          {/* Large background text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[20vw] font-bold text-black/[0.03] leading-none">VOICE</span>
          </div>
          
          <div className="max-w-4xl mx-auto relative z-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              
              {/* Left - The lies */}
              <div className="space-y-6">
                <div className="text-xs uppercase tracking-widest text-black/40 mb-2">What you can lie to</div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-black/5 border-l-4 border-black/20">
                    <X size={20} className="text-black/30" />
                    <span className="text-base text-black/50 line-through">Apps & notifications</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-black/5 border-l-4 border-black/20">
                    <X size={20} className="text-black/30" />
                    <span className="text-base text-black/50 line-through">Checkboxes & streaks</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-black/5 border-l-4 border-black/20">
                    <X size={20} className="text-black/30" />
                    <span className="text-base text-black/50 line-through">The voice in your head</span>
                  </div>
                </div>
              </div>
              
              {/* Right - The truth */}
              <div className="border-4 border-black p-8 bg-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase tracking-widest text-white/40 mb-6">What you can't lie to</div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 border-2 border-[#00FF00] flex items-center justify-center">
                    <Mic size={28} className="text-[#00FF00]" />
                  </div>
                  <span className="text-2xl font-bold">Your own voice</span>
                </div>
                
                <p className="text-base text-white/70 leading-relaxed mb-6">
                  When you have to say it out loud — "I didn't do it" — something changes. 
                  You can't rationalize. You can't minimize. You hear the truth.
                </p>
                
                <div className="pt-6 border-t border-white/20">
                  <p className="text-sm text-white/50 italic">
                    "That's why I built this. Not an app you check. A call you answer. 
                    Your voice. Your truth. Every night."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS - WHITE ============ */}
        <section className="px-6 py-24 bg-white text-black border-b-2 border-black">
          <div className="max-w-5xl mx-auto">
            
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">How it actually works</h2>
              <p className="text-base text-black/60 max-w-lg mx-auto">No complex setup. No gamification. No streaks to protect. Just one call every night that changes everything.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              
              {/* Step 1 */}
              <div className="border-2 border-black p-8 md:border-r-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-black text-white flex items-center justify-center text-lg font-bold">1</div>
                  <Clock size={24} />
                </div>
                <h3 className="text-base font-bold mb-3">DAY: THE WEIGHT</h3>
                <p className="text-sm text-black/60 mb-5 leading-relaxed">
                  Live your day knowing the call is coming tonight. No app to check. No boxes to tick. 
                  Just the quiet knowledge that you'll have to answer for what you did.
                </p>
                <div className="bg-black text-white p-4 text-sm">
                  <div className="text-white/40 mb-2">The feeling:</div>
                  You can't escape it. The audit is coming.
                </div>
              </div>

              {/* Step 2 */}
              <div className="border-2 border-black p-8 md:border-r-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-black text-white flex items-center justify-center text-lg font-bold">2</div>
                  <Phone size={24} />
                </div>
                <h3 className="text-base font-bold mb-3">NIGHT: THE AUDIT</h3>
                <p className="text-sm text-black/60 mb-5 leading-relaxed">
                  Your phone rings. The AI remembers exactly what you committed to. 
                  Now you have to say out loud whether you did it. No dodging. Just truth.
                </p>
                <div className="bg-black text-white p-4 text-sm">
                  <div className="text-white/40 mb-2">The question:</div>
                  "You said gym and side project. Did you do it?"
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-2 border-black p-8 bg-black text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-white text-black flex items-center justify-center text-lg font-bold">3</div>
                  <ArrowRight size={24} />
                </div>
                <h3 className="text-base font-bold mb-3">THEN: TOMORROW'S PLAN</h3>
                <p className="text-sm text-white/60 mb-5 leading-relaxed">
                  After the audit, you set tomorrow's commitments. Say them out loud. 
                  The AI remembers. Tomorrow night, you'll answer for these too.
                </p>
                <div className="bg-white text-black p-4 text-sm">
                  <div className="text-black/40 mb-2">Your commitment:</div>
                  "Tomorrow I'll wake up at 7, finish the report, and call mom."
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES - WHITE continues ============ */}
        <section className="px-6 py-24 bg-white text-black border-b-2 border-black">
          <div className="max-w-5xl mx-auto">
            
            <h2 className="text-lg font-bold mb-12 text-center">What makes this different</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="border-2 border-black p-6">
                <div className="w-10 h-10 border-2 border-black flex items-center justify-center mb-4">
                  <Mic size={20} />
                </div>
                <h3 className="text-sm font-bold mb-2">VOICE-FIRST</h3>
                <p className="text-sm text-black/60 leading-relaxed">No typing. You have to say it out loud. There's power in hearing your own voice commit.</p>
              </div>

              <div className="border-2 border-black p-6">
                <div className="w-10 h-10 border-2 border-black flex items-center justify-center mb-4">
                  <Volume2 size={20} />
                </div>
                <h3 className="text-sm font-bold mb-2">REAL CALLS</h3>
                <p className="text-sm text-black/60 leading-relaxed">Not notifications. Real calls you have to pick up. Can't swipe away.</p>
              </div>

              <div className="border-2 border-black p-6">
                <div className="w-10 h-10 border-2 border-black flex items-center justify-center mb-4">
                  <Calendar size={20} />
                </div>
                <h3 className="text-sm font-bold mb-2">AI MEMORY</h3>
                <p className="text-sm text-black/60 leading-relaxed">It remembers everything. Your patterns. Your excuses. You can't gaslight it.</p>
              </div>

              <div className="border-2 border-black p-6 bg-black text-white">
                <div className="w-10 h-10 border-2 border-white flex items-center justify-center mb-4">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-sm font-bold mb-2">WEEKLY AUDITS</h3>
                <p className="text-sm text-white/60 leading-relaxed">Every week, face your track record. How many times did you keep your word?</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ IS THIS YOU - WHITE continues ============ */}
        <section className="px-6 py-24 bg-white border-b-2 border-black">
          <div className="max-w-5xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Is this you?</h2>
                <p className="text-base text-black/60 mb-8">If any of these hit close to home, you might be exactly who this is for.</p>
                
                <div className="space-y-3">
                  {[
                    "You've said \"I'll start Monday\" more times than you can count",
                    "You know exactly what you need to do - you just don't do it",
                    "You've downloaded dozens of apps and abandoned them all",
                    "You're tired of making promises to yourself and breaking them",
                    "You've lost trust in your own word",
                    "You're done with gentle approaches - you need something real"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border-2 border-black">
                      <Check size={18} className="flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right - Results mockup */}
              <div className="border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase tracking-wider text-black/40 mb-6">Your weekly audit - Week 3</div>
                
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-center">
                      <div className="text-xs text-black/40 mb-2">{day}</div>
                      <div className={`w-full aspect-square border-2 border-black flex items-center justify-center ${i < 5 ? 'bg-black' : i === 5 ? 'bg-white' : 'bg-black/5'}`}>
                        {i < 5 && <Check size={16} className="text-white" />}
                        {i === 5 && <X size={16} className="text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 border-t-2 border-black pt-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black/60">Commitments kept</span>
                    <span className="font-bold">5/6 (83%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Current streak</span>
                    <span className="font-bold">12 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Total audits</span>
                    <span className="font-bold">21</span>
                  </div>
                </div>
                
                <div className="mt-5 p-4 bg-black text-white text-sm">
                  <div className="font-bold mb-2">AI Note:</div>
                  <p className="text-white/70 leading-relaxed">"Saturday you said the wedding threw off your schedule. Pattern: social events disrupt routine. Consider lighter goals on event days."</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CTA + PRICING - BLACK ============ */}
        <section className="bg-black text-white border-b-2 border-black">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2">
            
            {/* CTA - Left */}
            <div className="px-6 py-24 flex items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                  THE CALL<br />IS COMING.
                </h2>
                <p className="text-lg text-white/60 mb-4">
                  Tonight at 9pm, your phone will ring.
                </p>
                <p className="text-sm text-white/50 mb-10 leading-relaxed max-w-sm">
                  You'll hear the question: "Did you do what you said you would do?"
                  And for the first time, you won't be able to lie.
                </p>
                <button 
                  onClick={startOnboarding}
                  className="bg-white text-black px-8 py-4 text-sm font-bold border-2 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 transition-all inline-flex items-center gap-3"
                >
                  <span>ANSWER THE CALL</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Pricing - Right */}
            <div className="px-6 py-24 flex items-center justify-center border-t-2 lg:border-t-0 lg:border-l-2 border-white/20">
              <div className="w-full max-w-sm">
                
                <div className="border-2 border-white p-8">
                  
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-4">Simple pricing</div>
                  
                  <div className="text-5xl font-bold mb-2">$6.99</div>
                  <p className="text-sm text-white/60 mb-8">/week after 7-day free trial</p>

                  <div className="space-y-3 mb-8 py-6 border-y-2 border-white/20 text-sm">
                    {[
                      'Nightly accountability calls',
                      'AI that remembers everything',
                      'Weekly performance audits',
                      'Pattern recognition',
                      'Cancel anytime'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check size={16} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={startOnboarding}
                    className="w-full bg-white text-black py-4 text-sm font-bold border-2 border-white hover:bg-black hover:text-white transition-colors"
                  >
                    START FREE TRIAL
                  </button>
                  
                  <p className="text-center text-xs text-white/40 mt-4">No credit card required</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FAQ - WHITE ============ */}
        <section className="px-6 py-24 bg-white text-black border-b-2 border-black">
          <div className="max-w-3xl mx-auto">
            
            <h2 className="text-lg font-bold mb-12">Questions you might have</h2>
            
            <div className="space-y-0">
              {[
                { q: "Is this actually a real phone call?", a: "Yes. Your phone rings. You pick up. You speak. It's not a notification you can swipe away." },
                { q: "What if I miss a call?", a: "We'll try again. But when you know the call is coming, you don't want to miss it. That's the point." },
                { q: "This sounds kind of intense.", a: "It is. That's why it works. You've tried gentle. None of it worked because none of it had real weight." },
                { q: "What does the AI remember?", a: "Everything. Your commitments, results, patterns, excuses. It builds a picture of who you're trying to become." },
                { q: "Is this actually healthy?", a: "Honestly? Not sure. But it has broken cycles that people have been stuck in for years." },
                { q: "Can I cancel anytime?", a: "Yes. But most people don't. Not because they're trapped, but because it's actually working." },
              ].map((item, i) => (
                <div key={i} className="py-6 border-b-2 border-black">
                  <h3 className="text-base font-bold mb-2">{item.q}</h3>
                  <p className="text-sm text-black/60 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA - BLACK ============ */}
        <section className="px-6 py-24 bg-black text-white text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Stop lying to yourself.</h2>
            <p className="text-base text-white/60 mb-10">The call is coming. Will you answer?</p>
            <button 
              onClick={startOnboarding}
              className="bg-white text-black px-8 py-4 text-sm font-bold border-2 border-white hover:bg-black hover:text-white transition-all inline-flex items-center gap-3"
            >
              <span>START YOUR FIRST CALL</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 bg-black text-white border-t-2 border-white/20">
          <div className="max-w-3xl mx-auto flex justify-between items-center text-sm">
            <span className="font-bold">You+</span>
            <div className="flex gap-8">
              <a href="mailto:support@youplus.app" className="text-white/50 hover:text-white">Contact</a>
              <a href="/legal/terms" className="text-white/40 hover:text-white">Terms</a>
              <a href="/legal/privacy" className="text-white/40 hover:text-white">Privacy</a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
