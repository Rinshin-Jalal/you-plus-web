
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

  // Ready state - call time has arrived, waiting for incoming call
  if (isReady) {
    return (
      <div className="bg-[#111] text-white border-2 border-green-500 p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(34,197,94,0.3)] relative overflow-hidden">
        {/* Animated pulse background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent animate-pulse" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-sm h-3 w-3 bg-green-500"></span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">Call Window Open</span>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/10 flex items-center justify-center">
              <Phone size={28} className="text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-2xl md:text-3xl uppercase tracking-tight">
                Expecting Your Call
              </h2>
              <p className="font-mono text-xs text-white/50 mt-1">
                You will receive a call shortly at your scheduled time.
              </p>
            </div>
          </div>
          
          <p className="font-mono text-xs text-white/40 pt-4 border-t border-white/10">
            Keep your phone nearby. Be ready to answer honestly.
          </p>
        </div>
      </div>
    );
  }

  // Countdown state - waiting for scheduled time
  return (
    <div className={`bg-[#111] border-2 p-6 md:p-8 transition-all duration-300 ${
      isUrgent 
        ? 'border-[#F97316] shadow-[8px_8px_0px_0px_#F97316]' 
        : 'border-white/20 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]'
    }`}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Clock size={16} className={isUrgent ? 'text-[#F97316]' : 'text-white/40'} />
          <span className={`font-mono text-[10px] uppercase tracking-widest ${isUrgent ? 'text-[#F97316]' : 'text-white/40'}`}>
            {isUrgent ? 'Almost Time' : 'Next Check-In'}
          </span>
        </div>
        
        {/* Timer Display */}
        <div className="flex items-baseline gap-1 md:gap-2">
          <div className="flex flex-col items-center">
            <span className={`font-bold text-5xl md:text-7xl tracking-tighter leading-none ${isUrgent ? 'text-[#F97316]' : 'text-white'}`}>
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 mt-1">hrs</span>
          </div>
          <span className="font-bold text-3xl md:text-5xl text-white/20 self-start mt-2">:</span>
          <div className="flex flex-col items-center">
            <span className={`font-bold text-5xl md:text-7xl tracking-tighter leading-none ${isUrgent ? 'text-[#F97316]' : 'text-white'}`}>
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 mt-1">min</span>
          </div>
          <span className="font-bold text-3xl md:text-5xl text-white/20 self-start mt-2">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bold text-5xl md:text-7xl tracking-tighter leading-none text-white/30">
              {formatNumber(timeLeft.seconds)}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 mt-1">sec</span>
          </div>
        </div>

        {/* Message */}
        <p className="font-mono text-xs text-white/40 pt-2 border-t border-white/10">
          {isUrgent 
            ? "Prepare yourself. You'll receive a call soon." 
            : "You'll receive a call at your scheduled time."}
        </p>
      </div>
    </div>
  );
};
