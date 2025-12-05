import React from 'react';
import { Check, X } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface StatsGridProps {
  stats: DashboardStats;
}

const StatBox = ({ 
  label, 
  value, 
  variant = 'default',
  icon
}: { 
  label: string; 
  value: string | number; 
  variant?: 'default' | 'dark' | 'danger' | 'success';
  icon?: React.ReactNode;
}) => {
  const variants = {
    default: 'bg-white text-black border-black',
    dark: 'bg-black text-white border-black',
    danger: 'bg-white text-red-600 border-black',
    success: 'bg-white text-black border-black',
  };

  return (
    <div className={`border-2 ${variants[variant]} p-5 md:p-6 flex flex-col justify-between`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
      </div>
      <span className="font-display font-extrabold text-4xl md:text-5xl leading-none tracking-tight">{value}</span>
    </div>
  );
};

export const StatsGrid = ({ stats }: StatsGridProps) => {
  const total = stats.promisesKeptTotal + stats.promisesBrokenTotal;
  const keepRate = total > 0 ? Math.round((stats.promisesKeptTotal / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <StatBox 
        label="Kept" 
        value={stats.promisesKeptTotal}
        variant="success"
        icon={<Check size={14} className="text-green-600" strokeWidth={3} />}
      />
      <StatBox 
        label="Broken" 
        value={stats.promisesBrokenTotal}
        variant="danger"
        icon={<X size={14} className="text-red-600" strokeWidth={3} />}
      />
      <StatBox 
        label="Trust" 
        value={`${stats.trustScore}%`}
        variant={stats.trustScore >= 50 ? 'default' : 'danger'}
      />
    </div>
  );
};
