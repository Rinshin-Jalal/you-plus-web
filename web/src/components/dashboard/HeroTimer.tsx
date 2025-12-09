'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Phone } from 'lucide-react';

interface HeroTimerProps {
  targetDate: Date | null;
}

export const HeroTimer = ({ targetDate }: HeroTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setIsReady(true);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setIsReady(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
      setIsUrgent(hours === 0 && minutes < 30);
      setIsReady(false);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const formatCallTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toUpperCase();
  };

  // Ready state - call time has arrived (white bg, minimal)
  if (isReady) {
    return (
      <div className="bg-white text-black p-8 md:p-10 relative overflow-hidden">
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F97316]"></span>
            </span>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-black/50">Call Window Open</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-black flex items-center justify-center">
                <Phone size={28} className="text-white" />
              </div>
              <div>
                <h2 className="font-black text-2xl md:text-3xl tracking-tight uppercase">
                  Expecting Your Call
                </h2>
                <p className="text-sm text-black/50 mt-1">
                  Keep your phone nearby.
                </p>
              </div>
            </div>
            
            {/* Scheduled Time Display */}
            <div className="flex flex-col items-start md:items-end">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-black/40 mb-1">Scheduled</span>
              <span className="font-black text-4xl md:text-5xl tracking-tighter">
                {formatCallTime(targetDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Urgent state - less than 30 mins
  if (isUrgent) {
    return (
      <div className="bg-[#F97316] text-black p-8 md:p-10 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-black/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/40 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-black"></span>
            </span>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-black/70">Almost Time</span>
          </div>
          
          {/* Timer Display */}
          <div className="flex items-baseline gap-3 md:gap-4 mb-6">
            <div className="flex flex-col items-center">
              <span className="font-black text-6xl md:text-8xl tracking-tighter leading-none">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mt-2">hrs</span>
            </div>
            <span className="font-black text-4xl md:text-6xl text-black/30 self-start mt-2">:</span>
            <div className="flex flex-col items-center">
              <span className="font-black text-6xl md:text-8xl tracking-tighter leading-none">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mt-2">min</span>
            </div>
            <span className="font-black text-4xl md:text-6xl text-black/30 self-start mt-2">:</span>
            <div className="flex flex-col items-center">
              <span className="font-black text-6xl md:text-8xl tracking-tighter leading-none text-black/40">
                {formatNumber(timeLeft.seconds)}
              </span>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mt-2">sec</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-black/20 pt-4">
            <p className="text-sm text-black/60">
              Prepare yourself. The call is coming soon.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-black/40">At</span>
              <span className="font-bold text-lg">{formatCallTime(targetDate)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal countdown state
  return (
    <div className="bg-[#0A0A0A] border border-white/10 p-8 md:p-10 relative overflow-hidden">
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
            <Clock size={18} className="text-white/50" />
          </div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">Next Check-In</span>
        </div>
        
        {/* Timer Display */}
        <div className="flex items-baseline gap-3 md:gap-4 mb-6">
          <div className="flex flex-col items-center">
            <span className="font-black text-6xl md:text-8xl tracking-tighter leading-none text-white">
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mt-2">hrs</span>
          </div>
          <span className="font-black text-4xl md:text-6xl text-white/20 self-start mt-2">:</span>
          <div className="flex flex-col items-center">
            <span className="font-black text-6xl md:text-8xl tracking-tighter leading-none text-white">
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mt-2">min</span>
          </div>
          <span className="font-black text-4xl md:text-6xl text-white/20 self-start mt-2">:</span>
          <div className="flex flex-col items-center">
            <span className="font-black text-6xl md:text-8xl tracking-tighter leading-none text-white/30">
              {formatNumber(timeLeft.seconds)}
            </span>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mt-2">sec</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-sm text-white/40">
            You'll receive a call at your scheduled time.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/30">At</span>
            <span className="font-bold text-lg text-white/70">{formatCallTime(targetDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
