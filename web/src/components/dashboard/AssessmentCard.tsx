import React from 'react';
import { AlertTriangle, Shield, Flame, Skull } from 'lucide-react';
import type { Status } from '@/types';

interface AssessmentCardProps {
  status: Status | null;
  trustScore: number;
}

export const AssessmentCard = ({ status, trustScore }: AssessmentCardProps) => {
  // Determine status level and styling
  const getStatusConfig = () => {
    if (trustScore >= 80) {
      return {
        icon: Shield,
        bg: 'bg-white',
        border: 'border-black',
        iconBg: 'bg-green-500',
        label: 'LOCKED IN',
        sublabel: 'Identity Aligned',
        message: "Your actions match your words. This is who you said you'd be."
      };
    }
    if (trustScore >= 50) {
      return {
        icon: AlertTriangle,
        bg: 'bg-white',
        border: 'border-black',
        iconBg: 'bg-yellow-500',
        label: 'DRIFTING',
        sublabel: 'Attention Required',
        message: "You're starting to slip. The gap between words and actions is growing."
      };
    }
    if (trustScore >= 25) {
      return {
        icon: Flame,
        bg: 'bg-black',
        border: 'border-black',
        iconBg: 'bg-orange-500',
        textColor: 'text-white',
        label: 'CRITICAL',
        sublabel: 'Pattern Detected',
        message: "Your behavior doesn't match your stated identity. Time to confront this."
      };
    }
    return {
      icon: Skull,
      bg: 'bg-red-600',
      border: 'border-black',
      iconBg: 'bg-white',
      iconColor: 'text-red-600',
      textColor: 'text-white',
      label: 'PATHETIC',
      sublabel: 'System Override',
      message: "You're breaking every promise you made to yourself. This stops now."
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const textColor = config.textColor || 'text-black';

  return (
    <div className={`${config.bg} border-2 ${config.border} p-6 md:p-8 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
      
      {/* Background Watermark */}
      <div className={`absolute -bottom-4 -right-4 text-[6rem] font-display font-extrabold opacity-5 ${textColor} pointer-events-none leading-none`}>
        {trustScore}
      </div>
      
      <div className="relative z-10">
        {/* Status Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 ${config.iconBg} flex items-center justify-center`}>
            <StatusIcon size={24} className={config.iconColor || 'text-white'} strokeWidth={2.5} />
          </div>
          <div>
            <p className={`font-mono text-[10px] uppercase tracking-widest opacity-60 ${textColor}`}>
              {config.sublabel}
            </p>
            <h3 className={`font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight ${textColor}`}>
              {config.label}
            </h3>
          </div>
        </div>
        
        {/* Message */}
        <p className={`font-mono text-sm leading-relaxed ${textColor} opacity-80`}>
          {config.message}
        </p>
        
        {/* Trust Score Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${textColor} opacity-60`}>Trust Level</span>
            <span className={`font-display font-extrabold text-lg ${textColor}`}>{trustScore}%</span>
          </div>
          <div className={`h-2 w-full ${config.textColor ? 'bg-white/20' : 'bg-black/10'}`}>
            <div 
              className={`h-full transition-all duration-500 ${config.textColor ? 'bg-white' : 'bg-black'}`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
