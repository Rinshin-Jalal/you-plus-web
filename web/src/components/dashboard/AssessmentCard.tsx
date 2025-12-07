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
      <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-black/20 p-5 md:p-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 bg-black/10 flex items-center justify-center">
              <Clock size={22} className="text-black/40" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-black/40">
                Status Pending
              </p>
              <h3 className="font-display font-extrabold text-xl uppercase tracking-tight text-black/50">
                AWAITING DATA
              </h3>
            </div>
          </div>
          
          <p className="font-mono text-xs leading-relaxed text-black/40">
            Your trust score and status will be calculated after your first check-in call.
          </p>
          
          {/* Placeholder bar */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[10px] uppercase tracking-widest text-black/30">
                Trust Level
              </span>
              <span className="font-display font-extrabold text-2xl text-black/20">
                --%
              </span>
            </div>
            <div className="h-2.5 w-full bg-black/10 overflow-hidden">
              <div className="h-full w-1/2 bg-black/10" />
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
        bg: 'bg-gradient-to-br from-green-50 to-white',
        border: 'border-green-600',
        iconBg: 'bg-green-500',
        label: 'LOCKED IN',
        sublabel: 'Identity Aligned',
        message: "Your actions match your words. Keep showing up.",
        trend: 'up' as const,
        barColor: 'bg-green-500'
      };
    }
    if (trustScore >= 50) {
      return {
        icon: AlertTriangle,
        bg: 'bg-gradient-to-br from-yellow-50 to-white',
        border: 'border-yellow-500',
        iconBg: 'bg-yellow-500',
        label: 'DRIFTING',
        sublabel: 'Attention Needed',
        message: "The gap between words and actions is growing. Course correct now.",
        trend: 'down' as const,
        barColor: 'bg-yellow-500'
      };
    }
    if (trustScore >= 25) {
      return {
        icon: Flame,
        bg: 'bg-gradient-to-br from-orange-100 to-orange-50',
        border: 'border-orange-500',
        iconBg: 'bg-orange-500',
        textColor: 'text-black',
        label: 'CRITICAL',
        sublabel: 'Pattern Detected',
        message: "You're breaking promises to yourself. Time for honest reflection.",
        trend: 'down' as const,
        barColor: 'bg-orange-500'
      };
    }
    return {
      icon: Skull,
      bg: 'bg-gradient-to-br from-red-600 to-red-700',
      border: 'border-red-700',
      iconBg: 'bg-white',
      iconColor: 'text-red-600',
      textColor: 'text-white',
      label: 'CRITICAL',
      sublabel: 'Intervention Required',
      message: "Stop. Breathe. You can turn this around starting with the next call.",
      trend: 'down' as const,
      barColor: 'bg-white'
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const textColor = config.textColor || 'text-black';

  return (
    <div className={`${config.bg} border-2 ${config.border} p-5 md:p-6 relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]`}>
      
      {/* Background Score Watermark */}
      <div className={`absolute -bottom-6 -right-2 text-[7rem] font-display font-extrabold opacity-[0.07] ${textColor} pointer-events-none leading-none select-none`}>
        {trustScore}
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 ${config.iconBg} flex items-center justify-center shadow-sm`}>
              <StatusIcon size={22} className={config.iconColor || 'text-white'} strokeWidth={2.5} />
            </div>
            <div>
              <p className={`font-mono text-[9px] uppercase tracking-widest opacity-50 ${textColor}`}>
                {config.sublabel}
              </p>
              <h3 className={`font-display font-extrabold text-xl uppercase tracking-tight ${textColor}`}>
                {config.label}
              </h3>
            </div>
          </div>
          
          {/* Trend Indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 ${
            config.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {config.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="font-mono text-[10px] font-bold uppercase">
              {config.trend === 'up' ? 'Rising' : 'Falling'}
            </span>
          </div>
        </div>
        
        {/* Message */}
        <p className={`font-mono text-xs leading-relaxed ${textColor} opacity-70 mb-5`}>
          {config.message}
        </p>
        
        {/* Trust Score Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${textColor} opacity-50`}>
              Trust Level
            </span>
            <span className={`font-display font-extrabold text-2xl ${textColor}`}>
              {trustScore}%
            </span>
          </div>
          <div className={`h-2.5 w-full ${config.textColor ? 'bg-white/20' : 'bg-black/10'} overflow-hidden`}>
            <div 
              className={`h-full transition-all duration-700 ease-out ${config.barColor}`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Row */}
        {status && (
          <div className="mt-4 pt-4 border-t border-black/10 flex gap-4">
            <div className="flex-1">
              <p className={`font-mono text-[9px] uppercase tracking-widest ${textColor} opacity-40`}>Total Calls</p>
              <p className={`font-display font-bold text-lg ${textColor}`}>{status.total_calls_completed}</p>
            </div>
            <div className="flex-1">
              <p className={`font-mono text-[9px] uppercase tracking-widest ${textColor} opacity-40`}>Best Streak</p>
              <p className={`font-display font-bold text-lg ${textColor}`}>{status.longest_streak_days}d</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
