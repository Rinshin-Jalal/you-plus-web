'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ArrowRight, Phone, X, Clock, Mic, Calendar, TrendingUp, Volume2, User, LogOut, MicOff, PhoneOff, Video, Pause } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';

// Call states for animation
type CallState = 'incoming' | 'connecting' | 'active';

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  
  // Animated call state
  const [callState, setCallState] = useState<CallState>('incoming');
  const [callDuration, setCallDuration] = useState(0);
  
  // Animation loop: incoming (3s) -> connecting (1s) -> active (5s) -> reset
  useEffect(() => {
    const animationLoop = () => {
      // Start with incoming
      setCallState('incoming');
      setCallDuration(0);
      
      // After 3s, show connecting
      const connectingTimeout = setTimeout(() => {
        setCallState('connecting');
      }, 3000);
      
      // After 4s total, show active call
      const activeTimeout = setTimeout(() => {
        setCallState('active');
      }, 4000);
      
      // Reset after 9s total (5s of active call)
      const resetTimeout = setTimeout(() => {
        animationLoop();
      }, 9000);
      
      return () => {
        clearTimeout(connectingTimeout);
        clearTimeout(activeTimeout);
        clearTimeout(resetTimeout);
      };
    };
    
    const cleanup = animationLoop();
    return cleanup;
  }, []);
  
  // Timer for active call
  useEffect(() => {
    if (callState === 'active') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [callState]);
  
  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    <div className="min-h-screen text-white" style={{ background: '#0D0D0D' }}>
      <GrainOverlay />
      
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" style={{ background: 'rgba(13, 13, 13, 0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex justify-between items-center">
          <div className="text-xl font-bold tracking-tight">
            You<span className="text-[#F97316]">+</span>
          </div>
          
          {/* Auth-aware nav button */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
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
                    className="w-8 h-8 rounded-full border border-white/30 group-hover:border-white transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-white/30 bg-white/10 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                    <User size={16} />
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:block group-hover:text-white/80 transition-colors">
                  {user?.user_metadata?.name?.split(' ')[0] || 'Dashboard'}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 border border-white/20 bg-[#0D0D0D] shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      router.push('/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white hover:text-black transition-colors border-b border-white/10"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <span>Log out</span>
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => router.push('/auth/login')} 
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      <main className="pt-14 relative z-10">
        
        {/* ============ HERO ============ */}
        <section 
          className="px-6 py-24 md:py-32 border-b border-white/10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0D0D0D 0%, #080808 100%)'
          }}
        >
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left - Copy */}
              <div>
                <div className="inline-block border border-white/30 px-4 py-1.5 text-xs font-medium mb-8 tracking-widest text-white/80 uppercase">
                  For people who are done with their own bullshit
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-8 tracking-tight">
                  I get a call every night from my{' '}
                  <span className="text-[#F97316]">future self.</span>
                </h1>
                
                <p className="text-lg md:text-xl mb-4 leading-relaxed text-white font-medium">
                  It&apos;s the only thing that&apos;s kept me consistent.
                </p>
                
                <p className="text-base text-white/70 mb-12 leading-relaxed max-w-md">
                  I&apos;ve downloaded every productivity app. Tried journaling, habit trackers, 
                  accountability partners, &quot;make your bed&quot; videos. Still fell off. Every. Single. Time.
                  So I built something different.
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <button 
                    onClick={startOnboarding}
                    className="px-10 py-5 text-base font-bold border-2 border-[#F97316] transition-all flex items-center gap-4 uppercase tracking-wide bg-[#F97316] text-black"
                    style={{
                      boxShadow: '6px 6px 0px 0px #EA580C'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translate(6px, 6px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '6px 6px 0px 0px #EA580C';
                      e.currentTarget.style.transform = 'translate(0, 0)';
                    }}
                  >
                    <span>Start Your First Call</span>
                    <ArrowRight size={20} />
                  </button>
                  
                  <div className="flex items-center gap-3 text-sm py-5">
                    <span className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
                    <span className="text-white/70">Join 2,847 people taking control this week</span>
                  </div>
                </div>
              </div>

              {/* Right - Animated iPhone Call Screen */}
              <div className="relative mx-auto" style={{ width: '300px' }}>
                {/* iPhone 15 Pro Frame */}
                <div 
                  className="rounded-[55px] p-[3px] relative"
                  style={{
                    background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)',
                    boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)'
                  }}
                >
                  {/* Side buttons - Volume */}
                  <div className="absolute -left-[3px] top-[120px] w-[3px] h-[30px] bg-[#2a2a2a] rounded-l-sm" />
                  <div className="absolute -left-[3px] top-[160px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l-sm" />
                  <div className="absolute -left-[3px] top-[230px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l-sm" />
                  {/* Side button - Power */}
                  <div className="absolute -right-[3px] top-[180px] w-[3px] h-[80px] bg-[#2a2a2a] rounded-r-sm" />
                  
                  {/* Inner bezel */}
                  <div 
                    className="rounded-[52px] p-[10px]"
                    style={{ background: '#000' }}
                  >
                    {/* Screen */}
                    <div 
                      className="rounded-[42px] overflow-hidden relative"
                      style={{
                        aspectRatio: '9/19.5',
                        background: 'linear-gradient(180deg, #1c1c1e 0%, #000000 100%)'
                      }}
                    >
                      {/* Status Bar - only show when NOT active */}
                      <div className={`absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 pt-3 z-10 transition-opacity duration-300 ${
                        callState === 'active' ? 'opacity-0' : 'opacity-100'
                      }`}>
                        <span className="text-[13px] font-semibold text-white">9:41</span>
                        <div className="flex items-center gap-1">
                          {/* Signal */}
                          <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
                            <rect x="0" y="6" width="3" height="6" rx="1" fillOpacity="0.3"/>
                            <rect x="5" y="4" width="3" height="8" rx="1" fillOpacity="0.3"/>
                            <rect x="10" y="2" width="3" height="10" rx="1" fillOpacity="1"/>
                            <rect x="15" y="0" width="3" height="12" rx="1" fillOpacity="1"/>
                          </svg>
                          {/* WiFi */}
                          <svg width="17" height="12" viewBox="0 0 17 12" fill="white" className="ml-1">
                            <path d="M8.5 2.5C11.5 2.5 14 4 15.5 6L14 7.5C12.8 5.8 10.8 4.5 8.5 4.5C6.2 4.5 4.2 5.8 3 7.5L1.5 6C3 4 5.5 2.5 8.5 2.5Z" fillOpacity="1"/>
                            <path d="M8.5 6C10.3 6 11.9 6.8 13 8L11.5 9.5C10.7 8.6 9.7 8 8.5 8C7.3 8 6.3 8.6 5.5 9.5L4 8C5.1 6.8 6.7 6 8.5 6Z" fillOpacity="1"/>
                            <circle cx="8.5" cy="11" r="1.5" fillOpacity="1"/>
                          </svg>
                          {/* Battery */}
                          <div className="flex items-center ml-1">
                            <div className="w-[25px] h-[12px] border border-white/50 rounded-[3px] p-[2px] relative">
                              <div className="w-[70%] h-full bg-white rounded-[1px]" />
                            </div>
                            <div className="w-[2px] h-[5px] bg-white/50 rounded-r-sm ml-[1px]" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Dynamic Island */}
                      <div 
                        className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-[20px] z-20 flex items-center justify-center w-[126px] h-[37px]"
                      >
                        {/* Camera dot */}
                        <div className="absolute right-[18px] w-[12px] h-[12px] rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                          <div className="absolute inset-[2px] rounded-full bg-[#0a2a4a]" />
                        </div>
                      </div>
                      
                      {/* =================== INCOMING CALL SCREEN =================== */}
                      <div 
                        className={`absolute inset-0 flex flex-col items-center justify-between pt-20 pb-10 px-4 transition-all duration-500 ${
                          callState === 'incoming' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                        }`}
                      >
                        {/* Top Section - Caller Info */}
                        <div className="flex flex-col items-center">
                          {/* Caller Avatar with ring animation */}
                          <div className="relative mb-4">
                            {/* Multiple pulse rings */}
                            <div 
                              className="absolute inset-[-12px] rounded-full opacity-10"
                              style={{ 
                                background: '#F97316',
                                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                              }}
                            />
                            <div 
                              className="absolute inset-[-8px] rounded-full opacity-20"
                              style={{ 
                                background: '#F97316',
                                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.3s'
                              }}
                            />
                            <div 
                              className="absolute inset-[-4px] rounded-full opacity-30"
                              style={{ 
                                background: 'linear-gradient(180deg, #F97316 0%, #EA580C 100%)',
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                              }}
                            />
                            {/* Avatar */}
                            <div 
                              className="w-24 h-24 rounded-full flex items-center justify-center relative overflow-hidden"
                              style={{
                                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%)',
                                boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4)'
                              }}
                            >
                              <div 
                                className="absolute inset-0"
                                style={{
                                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)'
                                }}
                              />
                              <span className="text-white text-3xl font-bold tracking-tight relative z-10">Y+</span>
                            </div>
                          </div>
                          
                          <div className="text-[28px] font-light text-white tracking-tight mb-1">
                            Future You
                          </div>
                          <div className="text-[15px] text-white/60 font-normal">
                            Accountability Call
                          </div>
                          
                          {/* Ringing indicator */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-[#F97316] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 bg-[#F97316] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 bg-[#F97316] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[13px] text-white/50">incoming call...</span>
                          </div>
                        </div>
                        
                        {/* Bottom - Incoming Call Actions */}
                        <div className="w-full">
                          <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[54px] h-[54px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                                <Clock size={22} className="text-white" />
                              </div>
                              <span className="text-[10px] text-white/70 font-medium">Remind Me</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[54px] h-[54px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                              </div>
                              <span className="text-[10px] text-white/70 font-medium">Message</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[54px] h-[54px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                  <line x1="1" y1="1" x2="23" y2="23"/>
                                </svg>
                              </div>
                              <span className="text-[10px] text-white/70 font-medium">Silence</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-center gap-16">
                            <div className="flex flex-col items-center gap-2">
                              <div 
                                className="w-[64px] h-[64px] rounded-full flex items-center justify-center"
                                style={{ 
                                  background: 'linear-gradient(180deg, #FF453A 0%, #D70015 100%)',
                                  boxShadow: '0 4px 12px rgba(215, 0, 21, 0.4)'
                                }}
                              >
                                <Phone size={28} className="text-white rotate-[135deg]" />
                              </div>
                              <span className="text-[11px] text-white/80 font-medium">Decline</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                              <div 
                                className="w-[64px] h-[64px] rounded-full flex items-center justify-center relative"
                                style={{ 
                                  background: 'linear-gradient(180deg, #30D158 0%, #248A3D 100%)',
                                  boxShadow: '0 4px 12px rgba(36, 138, 61, 0.4)'
                                }}
                              >
                                <div 
                                  className="absolute inset-[-4px] rounded-full animate-ping opacity-30"
                                  style={{ background: '#30D158' }}
                                />
                                <Phone size={28} className="text-white relative z-10" />
                              </div>
                              <span className="text-[11px] text-white/80 font-medium">Accept</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* =================== CONNECTING SCREEN =================== */}
                      <div 
                        className={`absolute inset-0 flex flex-col items-center justify-center px-4 transition-all duration-300 ${
                          callState === 'connecting' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                        }`}
                      >
                        <div className="relative mb-6">
                          {/* Connecting pulse */}
                          <div 
                            className="absolute inset-[-16px] rounded-full"
                            style={{ 
                              background: 'rgba(48, 209, 88, 0.2)',
                              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
                            }}
                          />
                          <div 
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, #30D158 0%, #248A3D 100%)',
                              boxShadow: '0 8px 32px rgba(48, 209, 88, 0.4)'
                            }}
                          >
                            <Phone size={32} className="text-white" />
                          </div>
                        </div>
                        <div className="text-[20px] font-light text-white mb-2">Connecting...</div>
                        <div className="text-[14px] text-white/50">Future You</div>
                      </div>
                      
                      {/* =================== ACTIVE CALL SCREEN =================== */}
                      <div 
                        className={`absolute inset-0 flex flex-col items-center justify-between pt-16 pb-10 px-4 transition-all duration-500 ${
                          callState === 'active' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                        }`}
                      >
                        {/* Top - Caller info */}
                        <div className="flex flex-col items-center mt-8">
                          <div 
                            className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden mb-3"
                            style={{
                              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%)',
                              boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)'
                            }}
                          >
                            <span className="text-white text-2xl font-bold">Y+</span>
                          </div>
                          <div className="text-[24px] font-light text-white mb-1">Future You</div>
                          <div className="text-[17px] text-green-400 font-medium">{formatDuration(callDuration)}</div>
                        </div>
                        
                        {/* Bottom - Active Call Controls */}
                        <div className="w-full">
                          {/* Control buttons grid */}
                          <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[60px] h-[60px] rounded-full bg-white/10 flex items-center justify-center">
                                <MicOff size={24} className="text-white" />
                              </div>
                              <span className="text-[10px] text-white/70">mute</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[60px] h-[60px] rounded-full bg-white/10 flex items-center justify-center">
                                <Volume2 size={24} className="text-white" />
                              </div>
                              <span className="text-[10px] text-white/70">speaker</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[60px] h-[60px] rounded-full bg-white/10 flex items-center justify-center">
                                <Video size={24} className="text-white" />
                              </div>
                              <span className="text-[10px] text-white/70">FaceTime</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[60px] h-[60px] rounded-full bg-white/10 flex items-center justify-center">
                                <Pause size={24} className="text-white" />
                              </div>
                              <span className="text-[10px] text-white/70">hold</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[60px] h-[60px] rounded-full bg-white/10 flex items-center justify-center">
                                <User size={24} className="text-white" />
                              </div>
                              <span className="text-[10px] text-white/70">contacts</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-[60px] h-[60px] rounded-full bg-white/10 flex items-center justify-center">
                                <div className="grid grid-cols-3 gap-0.5">
                                  {[...Array(9)].map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 bg-white rounded-sm" />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] text-white/70">keypad</span>
                            </div>
                          </div>
                          
                          {/* End call button */}
                          <div className="flex justify-center">
                            <div 
                              className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                              style={{ 
                                background: 'linear-gradient(180deg, #FF453A 0%, #D70015 100%)',
                                boxShadow: '0 4px 16px rgba(215, 0, 21, 0.5)'
                              }}
                            >
                              <PhoneOff size={32} className="text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-white/80 rounded-full z-40" />
                    </div>
                  </div>
                </div>
                
                {/* Screen reflection */}
                <div 
                  className="absolute inset-0 rounded-[55px] pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%)'
                  }}
                />
                
                {/* Floating label - Changes based on state */}
                <div 
                  className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 border text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${
                    callState === 'active' 
                      ? 'border-green-500/50 text-green-400 bg-green-500/10' 
                      : 'border-[#F97316]/50 text-[#F97316] bg-[#F97316]/10'
                  }`}
                >
                  {callState === 'incoming' && 'Tonight at 9:00 PM'}
                  {callState === 'connecting' && 'Connecting...'}
                  {callState === 'active' && 'Call in progress'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ DASHBOARD PREVIEW ============ */}
        <section 
          className="px-6 py-20 border-b border-white/10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #080808 0%, #0A0A0A 50%, #0D0D0D 100%)'
          }}
        >
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="inline-block border border-white/20 px-4 py-2 text-xs font-medium mb-6 tracking-wide text-white/70 uppercase">
                What happens after the call
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Track your <span className="text-[#F97316]">transformation</span>
              </h2>
              <p className="text-base text-white/70 max-w-lg mx-auto">
                Every call builds your accountability score. Watch yourself become someone who keeps their word.
              </p>
            </div>
            
            {/* Dashboard Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Streak Card */}
              <div 
                className="border border-white/10 p-6 hover:border-white/30 transition-all"
                style={{ background: '#111' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs uppercase tracking-wider text-white/50">Current Streak</div>
                  <div className="text-2xl">🔥</div>
                </div>
                <div className="text-5xl font-bold mb-2 text-white">12</div>
                <div className="text-sm text-white/70">days of keeping your word</div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <TrendingUp size={14} />
                    <span>Best streak: 18 days</span>
                  </div>
                </div>
              </div>
              
              {/* Goals Achieved Card - Accent card */}
              <div 
                className="border-2 border-[#F97316] p-6 relative"
                style={{ 
                  background: '#111',
                  boxShadow: '4px 4px 0px 0px #F97316'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs uppercase tracking-wider text-[#F97316]">Goals Achieved</div>
                  <Check size={20} className="text-green-400" />
                </div>
                <div className="text-5xl font-bold text-white mb-2">47</div>
                <div className="text-sm text-white/70">commitments kept this month</div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">This week</span>
                    <span className="text-green-400 font-bold">6/7 (86%)</span>
                  </div>
                </div>
              </div>
              
              {/* Consistency Score Card */}
              <div 
                className="border border-white/10 p-6 hover:border-white/30 transition-all"
                style={{ background: '#111' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs uppercase tracking-wider text-white/50">Consistency</div>
                  <Calendar size={20} className="text-white/50" />
                </div>
                <div className="text-5xl font-bold text-white mb-2">83%</div>
                <div className="text-sm text-white/70">overall accountability score</div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  {/* Mini progress bar */}
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-white"
                      style={{ width: '83%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weekly view preview */}
            <div 
              className="mt-8 border border-white/10 p-6"
              style={{ background: '#0A0A0A' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm font-medium text-white">This Week&apos;s Progress</div>
                <div className="text-xs text-white/50">Dec 1 - Dec 7</div>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-white/50 mb-2">{day}</div>
                    <div 
                      className={`w-full aspect-square flex items-center justify-center transition-all ${
                        i < 5 
                          ? 'bg-green-500' 
                          : i === 5 
                            ? 'bg-red-500' 
                            : 'bg-white/5 border border-white/20'
                      }`}
                    >
                      {i < 5 && <Check size={18} className="text-black" />}
                      {i === 5 && <X size={18} className="text-white" />}
                      {i === 6 && <span className="text-white/50 text-xs font-medium">Today</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ THE PROBLEM ============ */}
        <section 
          className="px-6 py-24 border-b border-white/10 relative"
          style={{
            background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 50%, #0A0A0A 100%)'
          }}
        >
          <div className="max-w-5xl mx-auto relative z-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* Left - The cycle */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-10 leading-tight">
                  You know the cycle.
                </h2>
                
                <div className="space-y-8">
                  <div className="border-l-2 border-white/20 pl-6">
                    <div className="font-bold text-lg mb-2 text-white">Sunday night motivation</div>
                    <p className="text-sm text-white/70 leading-relaxed">&quot;This week is going to be different. I&apos;m going to wake up at 6am, hit the gym, eat clean, finish that project.&quot;</p>
                  </div>
                  
                  <div className="border-l-2 border-white/20 pl-6">
                    <div className="font-bold text-lg mb-2 text-white">Monday reality</div>
                    <p className="text-sm text-white/70 leading-relaxed">Snoozed the alarm. Skipped the gym. Ordered takeout. Scrolled until 2am. Told yourself &quot;I&apos;ll start tomorrow.&quot;</p>
                  </div>
                  
                  <div className="border-l-2 border-white/30 pl-6">
                    <div className="font-bold text-lg mb-2 text-white">The guilt spiral</div>
                    <p className="text-sm text-white/70 leading-relaxed">You&apos;re not lazy. You&apos;re not broken. You just have no one to answer to except yourself. And you&apos;ve learned to lie to yourself really well.</p>
                  </div>
                </div>
              </div>
              
              {/* Right - What failed */}
              <div>
                <h2 className="text-base font-bold mb-8 flex items-center gap-3 text-white">
                  <X size={20} className="text-red-400" />
                  What you&apos;ve already tried
                </h2>
                
                <div className="space-y-0">
                  {[
                    { thing: "Productivity apps", why: "Abandoned after 3 days. Too easy to ignore." },
                    { thing: "Habit trackers", why: "Broke the streak, felt guilty, deleted it." },
                    { thing: "Accountability partners", why: "They got busy. Stopped asking." },
                    { thing: "Journaling", why: "Blank pages. Broken promises." },
                    { thing: '"Wake up earlier"', why: "Snoozed 47 times." },
                    { thing: "Motivational content", why: "Felt good. Changed nothing." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 py-4 border-b border-white/10">
                      <X size={16} className="text-red-400 flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-sm font-bold text-white">{item.thing}</div>
                        <div className="text-sm text-white/60">{item.why}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ THE INSIGHT ============ */}
        <section 
          className="px-6 py-32 border-b border-white/10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0D0D0D 0%, #0A0A0A 100%)'
          }}
        >
          <div className="max-w-4xl mx-auto relative z-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              
              {/* Left - The lies */}
              <div className="space-y-6">
                <div className="text-xs uppercase tracking-widest text-white/50 mb-2">What you can lie to</div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-black/50 border-l-2 border-white/10">
                    <X size={20} className="text-white/30" />
                    <span className="text-base text-white/40 line-through">Apps & notifications</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-black/50 border-l-2 border-white/10">
                    <X size={20} className="text-white/30" />
                    <span className="text-base text-white/40 line-through">Checkboxes & streaks</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-black/50 border-l-2 border-white/10">
                    <X size={20} className="text-white/30" />
                    <span className="text-base text-white/40 line-through">The voice in your head</span>
                  </div>
                </div>
              </div>
              
              {/* Right - The truth - ACCENT CARD */}
              <div 
                className="border-2 border-[#F97316] p-8 relative"
                style={{
                  background: '#0D0D0D',
                  boxShadow: '6px 6px 0px 0px #F97316'
                }}
              >
                <div className="text-xs uppercase tracking-widest text-[#F97316] mb-6">What you can&apos;t lie to</div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 border-2 border-[#F97316] flex items-center justify-center bg-[#F97316]">
                    <Mic size={28} className="text-black" />
                  </div>
                  <span className="text-2xl font-bold text-white">Your own voice</span>
                </div>
                
                <p className="text-base text-white/80 leading-relaxed mb-6">
                  When you have to say it out loud — &quot;I didn&apos;t do it&quot; — something changes. 
                  You can&apos;t rationalize. You can&apos;t minimize. You hear the truth.
                </p>
                
                <div className="pt-6 border-t border-white/20">
                  <p className="text-sm text-white/60 italic">
                    &quot;That&apos;s why I built this. Not an app you check. A call you answer. 
                    Your voice. Your truth. Every night.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section 
          className="px-6 py-24 border-b border-white/10 relative"
          style={{
            background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 100%)'
          }}
        >
          <div className="max-w-5xl mx-auto relative z-10">
            
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">How it actually works</h2>
              <p className="text-base text-white/70 max-w-lg mx-auto">No complex setup. No gamification BS. Just one call every night that changes everything.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              
              {/* Step 1 */}
              <div 
                className="border border-white/10 p-8 md:border-r-0"
                style={{ background: '#111' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-12 h-12 flex items-center justify-center text-lg font-bold text-black bg-white"
                  >
                    1
                  </div>
                  <Clock size={24} className="text-white/50" />
                </div>
                <h3 className="text-base font-bold mb-3 text-white">DAY: THE WEIGHT</h3>
                <p className="text-sm text-white/70 mb-5 leading-relaxed">
                  Live your day knowing the call is coming tonight. No app to check. Just the quiet knowledge that you&apos;ll have to answer for what you did.
                </p>
                <div className="bg-black border border-white/10 p-4 text-sm">
                  <div className="text-white/50 mb-2">The feeling:</div>
                  <div className="text-white/80">You can&apos;t escape it. The audit is coming.</div>
                </div>
              </div>

              {/* Step 2 */}
              <div 
                className="border border-white/10 p-8 md:border-r-0"
                style={{ background: '#111' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-12 h-12 flex items-center justify-center text-lg font-bold text-black bg-white"
                  >
                    2
                  </div>
                  <Phone size={24} className="text-white/50" />
                </div>
                <h3 className="text-base font-bold mb-3 text-white">NIGHT: THE AUDIT</h3>
                <p className="text-sm text-white/70 mb-5 leading-relaxed">
                  Your phone rings. The AI remembers exactly what you committed to. 
                  Now you have to say out loud whether you did it.
                </p>
                <div className="bg-black border border-white/10 p-4 text-sm">
                  <div className="text-white/50 mb-2">The question:</div>
                  <div className="text-white/80">&quot;You said gym and side project. Did you do it?&quot;</div>
                </div>
              </div>

              {/* Step 3 - ACCENT */}
              <div 
                className="border-2 border-[#F97316] p-8"
                style={{ 
                  background: '#111',
                  boxShadow: '4px 4px 0px 0px #F97316'
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-12 h-12 flex items-center justify-center text-lg font-bold text-black bg-[#F97316]"
                  >
                    3
                  </div>
                  <ArrowRight size={24} className="text-[#F97316]" />
                </div>
                <h3 className="text-base font-bold mb-3 text-[#F97316]">THEN: TOMORROW&apos;S PLAN</h3>
                <p className="text-sm text-white/70 mb-5 leading-relaxed">
                  After the audit, you set tomorrow&apos;s commitments. Say them out loud. 
                  The AI remembers. Tomorrow night, you&apos;ll answer for these too.
                </p>
                <div className="bg-black border border-[#F97316]/30 text-white p-4 text-sm">
                  <div className="text-[#F97316] mb-2">Your commitment:</div>
                  <div>&quot;Tomorrow I&apos;ll wake up at 7, finish the report, and call mom.&quot;</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section 
          className="px-6 py-24 border-b border-white/10"
          style={{ background: '#0D0D0D' }}
        >
          <div className="max-w-5xl mx-auto">
            
            <h2 className="text-lg font-bold mb-12 text-center text-white">What makes this different</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div 
                className="border border-white/10 p-6 hover:border-white/30 transition-colors"
                style={{ background: '#0A0A0A' }}
              >
                <div className="w-10 h-10 border border-white/30 flex items-center justify-center mb-4 text-white/70">
                  <Mic size={20} />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">VOICE-FIRST</h3>
                <p className="text-sm text-white/60 leading-relaxed">No typing. You have to say it out loud. There&apos;s power in hearing your own voice commit.</p>
              </div>

              <div 
                className="border border-white/10 p-6 hover:border-white/30 transition-colors"
                style={{ background: '#0A0A0A' }}
              >
                <div className="w-10 h-10 border border-white/30 flex items-center justify-center mb-4 text-white/70">
                  <Volume2 size={20} />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">REAL CALLS</h3>
                <p className="text-sm text-white/60 leading-relaxed">Not notifications. Real calls you have to pick up. Can&apos;t swipe away.</p>
              </div>

              <div 
                className="border border-white/10 p-6 hover:border-white/30 transition-colors"
                style={{ background: '#0A0A0A' }}
              >
                <div className="w-10 h-10 border border-white/30 flex items-center justify-center mb-4 text-white/70">
                  <Calendar size={20} />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">AI MEMORY</h3>
                <p className="text-sm text-white/60 leading-relaxed">It remembers everything. Your patterns. Your excuses. You can&apos;t gaslight it.</p>
              </div>

              {/* ACCENT CARD */}
              <div 
                className="border-2 border-[#F97316] p-6"
                style={{ 
                  background: '#0A0A0A',
                  boxShadow: '4px 4px 0px 0px #F97316'
                }}
              >
                <div className="w-10 h-10 bg-[#F97316] flex items-center justify-center mb-4 text-black">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-sm font-bold mb-2 text-[#F97316]">WEEKLY AUDITS</h3>
                <p className="text-sm text-white/60 leading-relaxed">Every week, face your track record. How many times did you keep your word?</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ IS THIS YOU ============ */}
        <section 
          className="px-6 py-24 border-b border-white/10"
          style={{
            background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 100%)'
          }}
        >
          <div className="max-w-5xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Is this you?</h2>
                <p className="text-base text-white/70 mb-8">If any of these hit close to home, you might be exactly who this is for.</p>
                
                <div className="space-y-3">
                  {[
                    "You've said \"I'll start Monday\" more times than you can count",
                    "You know exactly what you need to do - you just don't do it",
                    "You've downloaded dozens of apps and abandoned them all",
                    "You're tired of making promises to yourself and breaking them",
                    "You've lost trust in your own word",
                    "You're done with gentle approaches - you need something real"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border border-white/10 hover:border-white/30 transition-colors" style={{ background: '#0A0A0A' }}>
                      <Check size={18} className="flex-shrink-0 mt-0.5 text-white/50" />
                      <span className="text-sm text-white/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right - Results mockup - ACCENT */}
              <div 
                className="border-2 border-[#F97316] p-6"
                style={{
                  background: '#0D0D0D',
                  boxShadow: '8px 8px 0px 0px #F97316'
                }}
              >
                <div className="text-xs uppercase tracking-wider text-[#F97316] mb-6">Your weekly audit - Week 3</div>
                
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-center">
                      <div className="text-xs text-white/50 mb-2">{day}</div>
                      <div className={`w-full aspect-square border flex items-center justify-center ${
                        i < 5 ? 'border-green-500 bg-green-500' : 
                        i === 5 ? 'border-red-500 bg-transparent' : 
                        'border-white/20 bg-white/5'
                      }`}>
                        {i < 5 && <Check size={16} className="text-black" />}
                        {i === 5 && <X size={16} className="text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 border-t border-white/20 pt-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Commitments kept</span>
                    <span className="font-bold text-green-400">5/6 (83%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Current streak</span>
                    <span className="font-bold text-white">12 days 🔥</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Total audits</span>
                    <span className="font-bold text-white">21</span>
                  </div>
                </div>
                
                <div className="mt-5 p-4 text-sm border border-white/10" style={{ background: '#0A0A0A' }}>
                  <div className="font-bold mb-2 text-white">AI Note:</div>
                  <p className="text-white/70 leading-relaxed">&quot;Saturday you said the wedding threw off your schedule. Pattern: social events disrupt routine. Consider lighter goals on event days.&quot;</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CTA + PRICING ============ */}
        <section 
          className="border-b border-white/10"
          style={{
            background: 'linear-gradient(180deg, #0A0A0A 0%, #080808 100%)'
          }}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2">
            
            {/* CTA - Left */}
            <div className="px-6 py-24 flex items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                  THE <span className="text-[#F97316]">CALL</span><br />IS COMING.
                </h2>
                <p className="text-lg text-white mb-4">
                  Tonight at 9pm, your phone will ring.
                </p>
                <p className="text-sm text-white/60 mb-10 leading-relaxed max-w-sm">
                  You&apos;ll hear the question: &quot;Did you do what you said you would do?&quot;
                  And for the first time, you won&apos;t be able to lie.
                </p>
                <button 
                  onClick={startOnboarding}
                  className="px-8 py-4 text-sm font-bold border-2 border-[#F97316] inline-flex items-center gap-3 transition-all uppercase tracking-wide bg-[#F97316] text-black"
                  style={{
                    boxShadow: '6px 6px 0px 0px #EA580C'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translate(6px, 6px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '6px 6px 0px 0px #EA580C';
                    e.currentTarget.style.transform = 'translate(0, 0)';
                  }}
                >
                  <span>ANSWER THE CALL</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Pricing - Right */}
            <div className="px-6 py-24 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-white/10">
              <div className="w-full max-w-sm">
                
                <div 
                  className="border border-white/20 p-8"
                  style={{
                    background: '#0D0D0D'
                  }}
                >
                  
                  <div className="text-xs uppercase tracking-wider text-white/50 mb-4">Simple pricing</div>
                  
                  <div className="text-5xl font-bold mb-2 text-white">$6.99</div>
                  <p className="text-sm text-white/60 mb-8">/week after 7-day free trial</p>

                  <div className="space-y-3 mb-8 py-6 border-y border-white/10 text-sm">
                    {[
                      'Nightly accountability calls',
                      'AI that remembers everything',
                      'Weekly performance audits',
                      'Pattern recognition',
                      'Cancel anytime'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check size={16} className="text-white/50" />
                        <span className="text-white/80">{item}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={startOnboarding}
                    className="w-full py-4 text-sm font-bold border-2 border-[#F97316] bg-[#F97316] text-black hover:bg-transparent hover:text-[#F97316] transition-colors uppercase tracking-wide"
                  >
                    START FREE TRIAL
                  </button>
                  
                  <p className="text-center text-xs text-white/50 mt-4">No credit card required</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section 
          className="px-6 py-24 border-b border-white/10"
          style={{ background: '#0D0D0D' }}
        >
          <div className="max-w-3xl mx-auto">
            
            <h2 className="text-lg font-bold mb-12 text-white">Questions you might have</h2>
            
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
                  <h3 className="text-base font-bold mb-2 text-white">{item.q}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section 
          className="px-6 py-24 text-center"
          style={{
            background: 'linear-gradient(180deg, #0D0D0D 0%, #080808 100%)'
          }}
        >
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Stop lying to yourself.</h2>
            <p className="text-base text-white/70 mb-10">The call is coming. Will you answer?</p>
            <button 
              onClick={startOnboarding}
              className="px-8 py-4 text-sm font-bold border-2 border-[#F97316] inline-flex items-center gap-3 transition-all uppercase tracking-wide bg-[#F97316] text-black"
              style={{
                boxShadow: '6px 6px 0px 0px #EA580C'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translate(6px, 6px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 0px 0px #EA580C';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }}
            >
              <span>START YOUR FIRST CALL</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/10" style={{ background: '#080808' }}>
          <div className="max-w-3xl mx-auto flex justify-between items-center text-sm">
            <span className="font-bold tracking-tight">You<span className="text-[#F97316]">+</span></span>
            <div className="flex gap-8">
              <a href="mailto:support@youplus.app" className="text-white/60 hover:text-white transition-colors">Contact</a>
              <a href="/legal/terms" className="text-white/60 hover:text-white transition-colors">Terms</a>
              <a href="/legal/privacy" className="text-white/60 hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
