
import React, { useState, useEffect } from 'react';
import { Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeroTimerProps {
  targetDate: Date | null;
  onJoinCall: () => void;
}

export const HeroTimer = ({ targetDate, onJoinCall }: HeroTimerProps) => {
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

  if (isReady) {
    return (
      <div className="bg-black text-white border-2 border-black p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-green-500 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-white/60">Session Ready</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl uppercase tracking-tight mb-2">
              Time to Answer.
            </h2>
            <p className="font-mono text-sm text-white/50">
              The audit is waiting. Be honest with yourself.
            </p>
          </div>
          <Button 
            variant="secondary" 
            size="lg"
            className="bg-white text-black hover:bg-gray-100 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
            onClick={onJoinCall}
          >
            <Phone size={18} className="mr-2" />
            JOIN NOW
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-2 border-black p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 ${
      isUrgent ? 'border-red-600 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]' : ''
    }`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-black/40" />
            <span className="font-mono text-xs uppercase tracking-widest text-black/40">Next Audit In</span>
          </div>
          
          {/* Timer Display */}
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-6xl md:text-8xl tracking-tighter leading-none">
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="font-display font-extrabold text-4xl md:text-5xl text-black/30">:</span>
            <span className="font-display font-extrabold text-6xl md:text-8xl tracking-tighter leading-none">
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="font-display font-extrabold text-4xl md:text-5xl text-black/30">:</span>
            <span className="font-display font-extrabold text-6xl md:text-8xl tracking-tighter leading-none text-black/40">
              {formatNumber(timeLeft.seconds)}
            </span>
          </div>
          
          <p className="font-mono text-xs text-black/40 mt-4 uppercase tracking-widest">
            {isUrgent 
              ? "⚠️ Almost time. Prepare yourself." 
              : "Use this time wisely."}
          </p>
        </div>
      </div>
    </div>
  );
};
