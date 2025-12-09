'use client';

import React from 'react';
import { Check, X, Target, Clock } from 'lucide-react';
import type { DashboardStats } from '@/types';
import { SectionLoader } from '@/components/ui/Loaders';

interface StatsGridProps {
  stats: DashboardStats;
  hasCompletedFirstCall?: boolean;
  isLoading?: boolean;
}

const StatBox = ({ 
  label, 
  value, 
  variant = 'default',
  icon,
  subtext,
  isEmpty
}: { 
  label: string; 
  value: string | number; 
  variant?: 'default' | 'positive' | 'negative';
  icon?: React.ReactNode;
  subtext?: string;
  isEmpty?: boolean;
}) => {
  // Minimal color palette - white, orange, black only
  const variants = {
    default: 'bg-[#0A0A0A] border-white/10 hover:border-white/20',
    positive: 'bg-[#0A0A0A] border-white/20 hover:border-white/30',
    negative: 'bg-[#0A0A0A] border-[#F97316]/30 hover:border-[#F97316]/50',
  };

  const iconColors = {
    default: 'text-white/50 bg-white/10',
    positive: 'text-white bg-white/20',
    negative: 'text-[#F97316] bg-[#F97316]/20',
  };

  const valueColors = {
    default: 'text-white',
    positive: 'text-white',
    negative: 'text-[#F97316]',
  };

  if (isEmpty) {
    return (
      <div className="border border-dashed border-white/10 bg-[#0A0A0A] p-6 flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-4">
          {icon && <div className="w-10 h-10 bg-white/5 flex items-center justify-center text-white/30">{icon}</div>}
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/30">{label}</span>
        </div>
        <div>
          <span className="font-black text-5xl leading-none tracking-tight text-white/20">--</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border ${variants[variant]} p-6 flex flex-col justify-between transition-all duration-200`}>
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className={`w-10 h-10 flex items-center justify-center ${iconColors[variant]}`}>{icon}</div>}
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">{label}</span>
      </div>
      <div>
        <span className={`font-black text-5xl leading-none tracking-tight ${valueColors[variant]}`}>{value}</span>
        {subtext && (
          <p className="text-xs text-white/40 mt-3">{subtext}</p>
        )}
      </div>
    </div>
  );
};

export const StatsGrid = ({ stats, hasCompletedFirstCall = true, isLoading = false }: StatsGridProps) => {
  if (isLoading) {
    return <SectionLoader message="Loading stats" />;
  }
  const total = stats.promisesKeptTotal + stats.promisesBrokenTotal;
  const keepRate = total > 0 ? Math.round((stats.promisesKeptTotal / total) * 100) : 0;

  // Show empty state if no calls completed yet
  if (!hasCompletedFirstCall) {
    return (
      <div className="border border-dashed border-white/10 p-8 bg-[#0A0A0A]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/10 flex items-center justify-center flex-shrink-0">
            <Clock size={24} className="text-white/40" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Awaiting First Call</p>
            <p className="font-bold text-xl tracking-tight text-white/60 mb-2">
              Your stats will appear here
            </p>
            <p className="text-sm text-white/40 leading-relaxed">
              Complete your first call to start tracking.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatBox 
        label="Kept" 
        value={stats.promisesKeptTotal}
        variant="positive"
        icon={<Check size={18} strokeWidth={3} />}
        subtext={total > 0 ? `${keepRate}% rate` : undefined}
      />
      <StatBox 
        label="Broken" 
        value={stats.promisesBrokenTotal}
        variant="negative"
        icon={<X size={18} strokeWidth={3} />}
        subtext={stats.promisesBrokenLast7Days > 0 ? `${stats.promisesBrokenLast7Days} this week` : undefined}
      />
      <StatBox 
        label="Alignment"
        value={`${stats.identityAlignment ?? stats.trustScore}%`}
        variant="default"
        icon={<Target size={18} strokeWidth={2.5} />}
        subtext={stats.transformationStatus || undefined}
      />
    </div>
  );
};
