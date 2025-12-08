
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
      <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-6 md:p-8 backdrop-blur-sm">
        {/* Animated glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500 blur-[100px] opacity-20 animate-pulse" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs uppercase tracking-widest text-green-400">Call Window Open</span>
          </div>
          
          <div className="flex items-center gap-5 mb-5">
            <div className="w-16 h-16 bg-green-500/20 rounded-md flex items-center justify-center">
              <Phone size={28} className="text-green-400" />
            </div>
            <div>
              <h2 className="font-bold text-2xl md:text-3xl tracking-tight text-white">
                Expecting Your Call
              </h2>
              <p className="text-sm text-white/50 mt-1">
                You will receive a call shortly at your scheduled time.
              </p>
            </div>
          </div>
          
          <p className="text-sm text-white/40 pt-4 border-t border-white/10">
            Keep your phone nearby. Be ready to answer honestly.
          </p>
        </div>
      </div>
    );
  }

  // Countdown state - waiting for scheduled time
  return (
    <div className={`relative overflow-hidden rounded-md p-6 md:p-8 backdrop-blur-sm transition-all duration-500 ${
      isUrgent 
        ? 'bg-gradient-to-br from-[#F97316]/20 to-[#EA580C]/10 border border-[#F97316]/40 shadow-[0_8px_40px_rgba(249,115,22,0.15)]' 
        : 'bg-white/5 border border-white/10'
    }`}>
      {/* Ambient glow when urgent */}
      {isUrgent && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F97316] blur-[100px] opacity-20" />
      )}
      
      <div className="relative z-10 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isUrgent ? 'bg-[#F97316]/20' : 'bg-white/5'}`}>
            <Clock size={16} className={isUrgent ? 'text-[#F97316]' : 'text-white/40'} />
          </div>
          <span className={`text-xs uppercase tracking-widest ${isUrgent ? 'text-[#F97316]' : 'text-white/40'}`}>
            {isUrgent ? 'Almost Time' : 'Next Check-In'}
          </span>
        </div>
        
        {/* Timer Display */}
        <div className="flex items-baseline gap-2 md:gap-3">
          <div className="flex flex-col items-center">
            <span className={`font-bold text-5xl md:text-7xl tracking-tighter leading-none transition-colors ${isUrgent ? 'text-[#F97316]' : 'text-white'}`}>
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/30 mt-2">hrs</span>
          </div>
          <span className="font-bold text-3xl md:text-5xl text-white/20 self-start mt-2">:</span>
          <div className="flex flex-col items-center">
            <span className={`font-bold text-5xl md:text-7xl tracking-tighter leading-none transition-colors ${isUrgent ? 'text-[#F97316]' : 'text-white'}`}>
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/30 mt-2">min</span>
          </div>
          <span className="font-bold text-3xl md:text-5xl text-white/20 self-start mt-2">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bold text-5xl md:text-7xl tracking-tighter leading-none text-white/30">
              {formatNumber(timeLeft.seconds)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/30 mt-2">sec</span>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-white/40 pt-4 border-t border-white/10">
          {isUrgent 
            ? "Prepare yourself. You'll receive a call soon." 
            : "You'll receive a call at your scheduled time."}
        </p>
      </div>
    </div>
  );
};
