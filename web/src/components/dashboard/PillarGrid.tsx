import React from 'react';
import type { FutureSelfPillar, PillarType } from '@/types';
import { getPillarById } from '@/data/pillarPresets';
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';

interface PillarGridProps {
  pillars: FutureSelfPillar[];
  primaryPillar?: PillarType;
}

// Get pillar display info from presets or generate for custom pillars
const getPillarDisplay = (pillarId: string): { icon: string; label: string } => {
  const preset = getPillarById(pillarId);
  if (preset) {
    return { icon: preset.icon, label: preset.label };
  }
  // Custom pillar - strip 'custom_' prefix and capitalize
  const customLabel = pillarId.replace(/^custom_/, '').replace(/_/g, ' ');
  return { 
    icon: '⭐', 
    label: customLabel.charAt(0).toUpperCase() + customLabel.slice(1) 
  };
};

const getTrustLevel = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 80) return { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' };
  if (score >= 60) return { label: 'Building', color: 'text-blue-600', bgColor: 'bg-blue-500' };
  if (score >= 40) return { label: 'Fragile', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
  return { label: 'Broken', color: 'text-red-600', bgColor: 'bg-red-500' };
};

const getStreakIndicator = (pillar: FutureSelfPillar): React.ReactNode => {
  if (pillar.consecutive_broken >= 2) {
    return (
      <div className="flex items-center gap-1.5 text-red-600">
        <TrendingDown size={14} strokeWidth={2.5} />
        <span className="text-[10px] font-mono font-bold">{pillar.consecutive_broken}d</span>
      </div>
    );
  }
  if (pillar.consecutive_kept >= 3) {
    return (
      <div className="flex items-center gap-1.5 text-green-600">
        <TrendingUp size={14} strokeWidth={2.5} />
        <span className="text-[10px] font-mono font-bold">{pillar.consecutive_kept}d</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-black/30">
      <Minus size={14} strokeWidth={2.5} />
    </div>
  );
};

const PillarCard = ({ 
  pillar, 
  isPrimary 
}: { 
  pillar: FutureSelfPillar; 
  isPrimary: boolean;
}) => {
  const { icon, label } = getPillarDisplay(pillar.pillar);
  const trustLevel = getTrustLevel(pillar.trust_score);
  
  return (
    <div 
      className={`group relative border-2 p-5 transition-all duration-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
        isPrimary 
          ? 'border-black bg-gradient-to-br from-black/5 to-transparent' 
          : 'border-black/20 hover:border-black'
      }`}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-black text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1">
          <Star size={10} fill="currentColor" />
          Primary
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-tight leading-tight">
              {label}
            </h4>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${trustLevel.color}`}>
              {trustLevel.label}
            </span>
          </div>
        </div>
        {getStreakIndicator(pillar)}
      </div>
      
      {/* Future State / Identity */}
      <p className="font-mono text-xs text-black/70 mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
        {pillar.future_state || pillar.identity_statement}
      </p>
      
      {/* Trust Score Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">
            Trust
          </span>
          <span className="font-display font-extrabold text-lg">
            {pillar.trust_score}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-black/10 overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ease-out ${trustLevel.bgColor}`}
            style={{ width: `${pillar.trust_score}%` }}
          />
        </div>
      </div>
      
      {/* Non-Negotiable */}
      {pillar.non_negotiable && (
        <div className="mt-4 pt-4 border-t border-black/10">
          <p className="font-mono text-[10px] text-black/40 uppercase tracking-widest mb-1">
            Daily Non-Negotiable
          </p>
          <p className="font-mono text-xs text-black/80 line-clamp-2 leading-relaxed">
            {pillar.non_negotiable}
          </p>
        </div>
      )}
    </div>
  );
};

export const PillarGrid = ({ pillars, primaryPillar }: PillarGridProps) => {
  if (!pillars || pillars.length === 0) {
    return (
      <div className="border-2 border-dashed border-black/20 p-8 text-center bg-gray-50/50">
        <span className="text-4xl mb-4 block">🎯</span>
        <p className="font-mono text-sm text-black/50 mb-2">
          No pillars defined yet
        </p>
        <p className="font-mono text-xs text-black/30">
          Complete onboarding to set up your transformation pillars
        </p>
      </div>
    );
  }

  // Sort: primary first, then by trust score descending
  const sortedPillars = [...pillars].sort((a, b) => {
    if (a.pillar === primaryPillar) return -1;
    if (b.pillar === primaryPillar) return 1;
    return b.trust_score - a.trust_score;
  });

  return (
    <div className={`grid gap-4 ${
      pillars.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
      pillars.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
      pillars.length === 4 ? 'grid-cols-1 sm:grid-cols-2' :
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }`}>
      {sortedPillars.map((pillar) => (
        <PillarCard 
          key={pillar.id} 
          pillar={pillar} 
          isPrimary={pillar.pillar === primaryPillar}
        />
      ))}
    </div>
  );
};
