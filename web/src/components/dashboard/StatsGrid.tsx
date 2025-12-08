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
    default: 'bg-white/5 border-white/10 hover:border-white/20',
    success: 'bg-green-500/10 border-green-500/30 hover:border-green-500/50',
    danger: 'bg-red-500/10 border-red-500/30 hover:border-red-500/50',
  };

  const iconColors = {
    default: 'text-white/40 bg-white/10',
    success: 'text-green-400 bg-green-500/20',
    danger: 'text-red-400 bg-red-500/20',
  };

  if (isEmpty) {
    return (
      <div className="border border-dashed border-white/10 rounded-md bg-white/5 backdrop-blur-sm p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          {icon && <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-white/30">{icon}</div>}
          <span className="text-xs font-medium uppercase tracking-widest text-white/30">{label}</span>
        </div>
        <div>
          <span className="font-bold text-4xl leading-none tracking-tight text-white/20">--</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-md backdrop-blur-sm ${variants[variant]} p-5 flex flex-col justify-between transition-all duration-200`}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconColors[variant]}`}>{icon}</div>}
        <span className="text-xs font-medium uppercase tracking-widest text-white/50">{label}</span>
      </div>
      <div>
        <span className="font-bold text-4xl leading-none tracking-tight text-white">{value}</span>
        {subtext && (
          <p className="text-xs text-white/40 mt-2">{subtext}</p>
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
      <div className="border border-dashed border-white/10 rounded-md p-6 bg-white/5 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-white/40" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Awaiting First Call</p>
            <p className="font-bold text-lg tracking-tight text-white/60 mb-1">
              Your stats will appear here
            </p>
            <p className="text-sm text-white/40 leading-relaxed">
              Complete your first check-in call to start tracking your progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <StatBox 
        label="Kept" 
        value={stats.promisesKeptTotal}
        variant="success"
        icon={<Check size={16} strokeWidth={3} />}
        subtext={total > 0 ? `${keepRate}% rate` : undefined}
      />
      <StatBox 
        label="Broken" 
        value={stats.promisesBrokenTotal}
        variant="danger"
        icon={<X size={16} strokeWidth={3} />}
        subtext={stats.promisesBrokenLast7Days > 0 ? `${stats.promisesBrokenLast7Days} this week` : undefined}
      />
      <StatBox 
        label="Alignment"
        value={`${stats.identityAlignment ?? stats.trustScore}%`}
        variant="default"
        icon={<Target size={16} strokeWidth={2.5} />}
        subtext={stats.transformationStatus || undefined}
      />
    </div>
  );
};
