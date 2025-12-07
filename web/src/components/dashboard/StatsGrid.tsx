import React from 'react';
import { Check, X, Target, Clock } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface StatsGridProps {
  stats: DashboardStats;
  hasCompletedFirstCall?: boolean;
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
  variant?: 'default' | 'success' | 'danger';
  icon?: React.ReactNode;
  subtext?: string;
  isEmpty?: boolean;
}) => {
  const variants = {
    default: 'bg-white border-black/20 hover:border-black',
    success: 'bg-gradient-to-br from-green-50 to-white border-green-500/50 hover:border-green-600',
    danger: 'bg-gradient-to-br from-red-50 to-white border-red-500/50 hover:border-red-600',
  };

  const iconColors = {
    default: 'text-black/40',
    success: 'text-green-600',
    danger: 'text-red-600',
  };

  if (isEmpty) {
    return (
      <div className="border-2 border-dashed border-black/15 bg-gray-50/50 p-4 md:p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          {icon && <span className="text-black/30">{icon}</span>}
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-black/30">{label}</span>
        </div>
        <div>
          <span className="font-display font-extrabold text-3xl md:text-4xl leading-none tracking-tight text-black/20">--</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 ${variants[variant]} p-4 md:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]`}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className={iconColors[variant]}>{icon}</span>}
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-black/50">{label}</span>
      </div>
      <div>
        <span className="font-display font-extrabold text-3xl md:text-4xl leading-none tracking-tight">{value}</span>
        {subtext && (
          <p className="font-mono text-[9px] text-black/40 mt-1 uppercase tracking-wider">{subtext}</p>
        )}
      </div>
    </div>
  );
};

export const StatsGrid = ({ stats, hasCompletedFirstCall = true }: StatsGridProps) => {
  const total = stats.promisesKeptTotal + stats.promisesBrokenTotal;
  const keepRate = total > 0 ? Math.round((stats.promisesKeptTotal / total) * 100) : 0;

  // Show empty state if no calls completed yet
  if (!hasCompletedFirstCall) {
    return (
      <div className="border-2 border-dashed border-black/20 p-5 md:p-6 bg-gray-50/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-black/10 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-black/40" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-black/40 mb-1">Awaiting First Call</p>
            <p className="font-display font-bold text-lg uppercase tracking-tight text-black/60 mb-1">
              Your stats will appear here
            </p>
            <p className="font-mono text-[11px] text-black/40 leading-relaxed">
              Complete your first check-in call to start tracking your progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatBox 
        label="Kept" 
        value={stats.promisesKeptTotal}
        variant="success"
        icon={<Check size={14} strokeWidth={3} />}
        subtext={total > 0 ? `${keepRate}% rate` : undefined}
      />
      <StatBox 
        label="Broken" 
        value={stats.promisesBrokenTotal}
        variant="danger"
        icon={<X size={14} strokeWidth={3} />}
        subtext={stats.promisesBrokenLast7Days > 0 ? `${stats.promisesBrokenLast7Days} this week` : undefined}
      />
      <StatBox 
        label="Alignment"
        value={`${stats.identityAlignment ?? stats.trustScore}%`}
        variant="default"
        icon={<Target size={14} strokeWidth={2.5} />}
        subtext={stats.transformationStatus || undefined}
      />
    </div>
  );
};
