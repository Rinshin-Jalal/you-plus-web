'use client';

import React from 'react';
import { Shield, AlertTriangle, Flame, Skull, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { Status } from '@/types';

interface AssessmentCardProps {
  status: Status | null;
  trustScore: number;
  hasCompletedFirstCall?: boolean;
}

export const AssessmentCard = ({ status, trustScore, hasCompletedFirstCall = true }: AssessmentCardProps) => {
  
  // Empty state for new users
  if (!hasCompletedFirstCall) {
    return (
      <div className="bg-[#0A0A0A] border border-white/10 p-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
              <Clock size={24} className="text-white/40" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-1">
                Status Pending
              </p>
              <h3 className="font-black text-xl tracking-tight text-white/50 uppercase">
                Awaiting Data
              </h3>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-white/40 mb-6">
            Your trust score will be calculated after your first call.
          </p>
          
          {/* Placeholder bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/30">
                Trust Level
              </span>
              <span className="font-black text-2xl text-white/20">
                --%
              </span>
            </div>
            <div className="h-2 w-full bg-white/10 overflow-hidden">
              <div className="h-full w-1/2 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine status level and styling - minimal palette (white, orange, black)
  const getStatusConfig = () => {
    if (trustScore >= 80) {
      return {
        icon: Shield,
        bgColor: 'bg-white',
        iconColor: 'text-black',
        borderColor: 'border-white',
        label: 'LOCKED IN',
        sublabel: 'Identity Aligned',
        message: "Your actions match your words. Keep showing up.",
        trend: 'up' as const,
        barColor: 'bg-white'
      };
    }
    if (trustScore >= 50) {
      return {
        icon: AlertTriangle,
        bgColor: 'bg-white/20',
        iconColor: 'text-white',
        borderColor: 'border-white/30',
        label: 'DRIFTING',
        sublabel: 'Attention Needed',
        message: "The gap between words and actions is growing.",
        trend: 'down' as const,
        barColor: 'bg-white/50'
      };
    }
    if (trustScore >= 25) {
      return {
        icon: Flame,
        bgColor: 'bg-[#F97316]',
        iconColor: 'text-black',
        borderColor: 'border-[#F97316]',
        label: 'SLIPPING',
        sublabel: 'Pattern Detected',
        message: "You're breaking promises. Time for honest reflection.",
        trend: 'down' as const,
        barColor: 'bg-[#F97316]'
      };
    }
    return {
      icon: Skull,
      bgColor: 'bg-[#F97316]',
      iconColor: 'text-black',
      borderColor: 'border-[#F97316]',
      label: 'CRITICAL',
      sublabel: 'Intervention Required',
      message: "Stop. You can turn this around with the next call.",
      trend: 'down' as const,
      barColor: 'bg-[#F97316]'
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className={`bg-[#0A0A0A] border ${config.borderColor} p-6 relative overflow-hidden`}>
      
      {/* Background Score Watermark */}
      <div className="absolute -bottom-4 -right-2 text-8xl font-black opacity-[0.05] text-white pointer-events-none leading-none select-none">
        {trustScore}
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${config.bgColor} flex items-center justify-center`}>
              <StatusIcon size={24} className={config.iconColor} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/50 mb-1">
                {config.sublabel}
              </p>
              <h3 className="font-black text-xl tracking-tight text-white uppercase">
                {config.label}
              </h3>
            </div>
          </div>
          
          {/* Trend Indicator - minimal */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 ${
            config.trend === 'up' ? 'bg-white text-black' : 'bg-white/10 text-white/60'
          }`}>
            {config.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs font-bold uppercase">
              {config.trend === 'up' ? 'Rising' : 'Falling'}
            </span>
          </div>
        </div>
        
        {/* Message */}
        <p className="text-sm leading-relaxed text-white/50 mb-5">
          {config.message}
        </p>
        
        {/* Trust Score Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">
              Trust
            </span>
            <span className="font-black text-3xl text-white">
              {trustScore}%
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out ${config.barColor}`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Row */}
        {status && (
          <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-1">Calls</p>
              <p className="font-black text-2xl text-white">{status.total_calls_completed}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-1">Best</p>
              <p className="font-black text-2xl text-white">{status.longest_streak_days}d</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
