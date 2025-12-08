import React from 'react';
import { AlertTriangle, Shield, Flame, Skull, TrendingUp, TrendingDown, Clock } from 'lucide-react';
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
      <div className="bg-white/5 backdrop-blur-sm border border-dashed border-white/10 rounded-md p-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center">
              <Clock size={22} className="text-white/40" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
                Status Pending
              </p>
              <h3 className="font-bold text-xl tracking-tight text-white/50">
                AWAITING DATA
              </h3>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-white/40 mb-5">
            Your trust score and status will be calculated after your first check-in call.
          </p>
          
          {/* Placeholder bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs uppercase tracking-widest text-white/30">
                Trust Level
              </span>
              <span className="font-bold text-2xl text-white/20">
                --%
              </span>
            </div>
          <div className="h-3 w-full bg-white/10 rounded-sm overflow-hidden">
            <div className="h-full w-1/2 bg-white/10 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine status level and styling
  const getStatusConfig = () => {
    if (trustScore >= 80) {
      return {
        icon: Shield,
        gradient: 'from-green-500/20 to-green-600/10',
        border: 'border-green-500/30',
        iconBg: 'bg-green-500',
        label: 'LOCKED IN',
        sublabel: 'Identity Aligned',
        message: "Your actions match your words. Keep showing up.",
        trend: 'up' as const,
        barColor: 'bg-gradient-to-r from-green-400 to-green-500'
      };
    }
    if (trustScore >= 50) {
      return {
        icon: AlertTriangle,
        gradient: 'from-yellow-500/20 to-yellow-600/10',
        border: 'border-yellow-500/30',
        iconBg: 'bg-yellow-500',
        label: 'DRIFTING',
        sublabel: 'Attention Needed',
        message: "The gap between words and actions is growing. Course correct now.",
        trend: 'down' as const,
        barColor: 'bg-gradient-to-r from-yellow-400 to-yellow-500'
      };
    }
    if (trustScore >= 25) {
      return {
        icon: Flame,
        gradient: 'from-[#F97316]/20 to-[#EA580C]/10',
        border: 'border-[#F97316]/30',
        iconBg: 'bg-[#F97316]',
        label: 'CRITICAL',
        sublabel: 'Pattern Detected',
        message: "You're breaking promises to yourself. Time for honest reflection.",
        trend: 'down' as const,
        barColor: 'bg-gradient-to-r from-orange-400 to-orange-500'
      };
    }
    return {
      icon: Skull,
      gradient: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/30',
      iconBg: 'bg-red-500',
      iconColor: 'text-white',
      label: 'CRITICAL',
      sublabel: 'Intervention Required',
      message: "Stop. Breathe. You can turn this around starting with the next call.",
      trend: 'down' as const,
      barColor: 'bg-gradient-to-r from-red-400 to-red-500'
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className={`relative overflow-hidden rounded-md bg-gradient-to-br ${config.gradient} border ${config.border} backdrop-blur-sm p-6`}>
      
      {/* Background Score Watermark */}
      <div className="absolute -bottom-4 -right-2 text-8xl font-bold opacity-[0.05] text-white pointer-events-none leading-none select-none">
        {trustScore}
      </div>
      
      {/* Ambient glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${config.iconBg} blur-[80px] opacity-20`} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${config.iconBg} rounded-md flex items-center justify-center shadow-lg`}>
              <StatusIcon size={22} className={config.iconColor || 'text-black'} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50 mb-0.5">
                {config.sublabel}
              </p>
              <h3 className="font-bold text-xl tracking-tight text-white">
                {config.label}
              </h3>
            </div>
          </div>
          
          {/* Trend Indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm ${
            config.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {config.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="text-xs font-medium">
              {config.trend === 'up' ? 'Rising' : 'Falling'}
            </span>
          </div>
        </div>
        
        {/* Message */}
        <p className="text-sm leading-relaxed text-white/60 mb-5">
          {config.message}
        </p>
        
        {/* Trust Score Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-widest text-white/50">
              Trust Level
            </span>
            <span className="font-bold text-2xl text-white">
              {trustScore}%
            </span>
          </div>
          <div className="h-3 w-full bg-white/10 rounded-sm overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out rounded-sm ${config.barColor}`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Row */}
        {status && (
          <div className="mt-5 pt-5 border-t border-white/10 flex gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Total Calls</p>
              <p className="font-bold text-xl text-white">{status.total_calls_completed}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Best Streak</p>
              <p className="font-bold text-xl text-white">{status.longest_streak_days}d</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
