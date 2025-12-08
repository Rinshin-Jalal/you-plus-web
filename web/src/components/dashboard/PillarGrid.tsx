import React from 'react';
import type { FutureSelfPillar, PillarType } from '@/types';
import { getPillarById } from '@/data/pillarPresets';
import { TrendingUp, TrendingDown, Minus, Star, Compass } from 'lucide-react';

interface PillarGridProps {
  pillars: FutureSelfPillar[];
  primaryPillar?: PillarType;
  hasCompletedFirstCall?: boolean;
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

const getTrustLevel = (score: number): { label: string; color: string; bgColor: string; gradient: string } => {
  if (score >= 80) return { 
    label: 'Strong', 
    color: 'text-green-400', 
    bgColor: 'bg-green-500',
    gradient: 'from-green-400 to-green-500'
  };
  if (score >= 60) return { 
    label: 'Building', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500',
    gradient: 'from-blue-400 to-blue-500'
  };
  if (score >= 40) return { 
    label: 'Fragile', 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500',
    gradient: 'from-yellow-400 to-yellow-500'
  };
  return { 
    label: 'Broken', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500',
    gradient: 'from-red-400 to-red-500'
  };
};

const getStreakIndicator = (pillar: FutureSelfPillar): React.ReactNode => {
  if (pillar.consecutive_broken >= 2) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-red-500/20 text-red-400">
        <TrendingDown size={12} strokeWidth={2.5} />
        <span className="text-xs font-medium">{pillar.consecutive_broken}d</span>
      </div>
    );
  }
  if (pillar.consecutive_kept >= 3) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-green-500/20 text-green-400">
        <TrendingUp size={12} strokeWidth={2.5} />
        <span className="text-xs font-medium">{pillar.consecutive_kept}d</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-white/10 text-white/30">
      <Minus size={12} strokeWidth={2.5} />
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
      className={`group relative rounded-md p-5 transition-all duration-300 backdrop-blur-sm ${
        isPrimary 
          ? 'bg-gradient-to-br from-[#F97316]/15 to-[#EA580C]/5 border border-[#F97316]/30 shadow-[0_4px_20px_rgba(249,115,22,0.1)]' 
          : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-gradient-to-r from-[#FB923C] to-[#F97316] text-white text-xs font-medium px-3 py-1 rounded-sm shadow-lg">
          <Star size={10} fill="currentColor" />
          Primary
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-md flex items-center justify-center">
            <span className="text-xl">{icon}</span>
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight leading-tight text-white">
              {label}
            </h4>
            <span className={`text-xs font-medium ${trustLevel.color}`}>
              {trustLevel.label}
            </span>
          </div>
        </div>
        {getStreakIndicator(pillar)}
      </div>
      
      {/* Future State / Identity */}
      <p className="text-sm text-white/50 mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
        {pillar.future_state || pillar.identity_statement}
      </p>
      
      {/* Trust Score Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-white/40">
            Trust
          </span>
          <span className="font-bold text-lg text-white">
            {pillar.trust_score}%
          </span>
        </div>
      <div className="w-full h-2.5 bg-white/10 rounded-sm overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 ease-out rounded-sm bg-gradient-to-r ${trustLevel.gradient}`}
            style={{ width: `${pillar.trust_score}%` }}
          />
        </div>
      </div>
      
      {/* Non-Negotiable */}
      {pillar.non_negotiable && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
            Daily Non-Negotiable
          </p>
          <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
            {pillar.non_negotiable}
          </p>
        </div>
      )}
    </div>
  );
};

export const PillarGrid = ({ pillars, primaryPillar, hasCompletedFirstCall = true }: PillarGridProps) => {
  if (!pillars || pillars.length === 0) {
    return (
      <div className="border border-dashed border-white/10 rounded-md p-8 text-center bg-white/5 backdrop-blur-sm">
        <div className="w-14 h-14 bg-white/10 rounded-md flex items-center justify-center mx-auto mb-4">
          <Compass size={24} className="text-white/40" />
        </div>
        <p className="text-sm text-white/50 mb-2">
          No pillars defined yet
        </p>
        <p className="text-xs text-white/30">
          Complete onboarding to set up your transformation pillars
        </p>
      </div>
    );
  }

  // Show awaiting first call state - preview pillars in muted style
  if (!hasCompletedFirstCall) {
    // Sort: primary first
    const sortedPillars = [...pillars].sort((a, b) => {
      if (a.pillar === primaryPillar) return -1;
      if (b.pillar === primaryPillar) return 1;
      return 0;
    });

    return (
      <div className="relative">
        {/* Muted pillar preview grid */}
        <div className={`grid gap-4 opacity-40 ${
          pillars.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          pillars.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          pillars.length === 4 ? 'grid-cols-1 sm:grid-cols-2' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {sortedPillars.map((pillar) => {
            const { icon, label } = getPillarDisplay(pillar.pillar);
            const isPrimary = pillar.pillar === primaryPillar;
            return (
                <div 
                  key={pillar.id}
                  className={`relative border border-dashed rounded-md p-5 ${
                  isPrimary ? 'border-white/30' : 'border-white/15'
                }`}
              >
                {isPrimary && (
                  <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-white/20 text-white/50 text-xs px-3 py-1 rounded-sm">
                    <Star size={10} />
                    Primary
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3 mt-1">
          <div className="w-10 h-10 bg-white/10 rounded-md flex items-center justify-center">
                    <span className="text-xl grayscale">{icon}</span>
                  </div>
                  <h4 className="font-bold text-sm tracking-tight text-white/50">
                    {label}
                  </h4>
                </div>
                <div className="h-2 bg-white/10 rounded-sm w-full mb-3" />
                <div className="h-2 bg-white/10 rounded-sm w-3/4" />
              </div>
            );
          })}
        </div>
        
        {/* Overlay message */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#F97316]/50 rounded-md px-6 py-4 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
            <p className="font-bold text-sm tracking-tight text-center text-white">
              Complete your first call to unlock
            </p>
          </div>
        </div>
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
