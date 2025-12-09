'use client';

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

// Minimal palette - white/orange only
const getTrustLevel = (score: number): { label: string; color: string; barColor: string } => {
  if (score >= 80) return { 
    label: 'Strong', 
    color: 'text-white', 
    barColor: 'bg-white'
  };
  if (score >= 60) return { 
    label: 'Building', 
    color: 'text-white/70', 
    barColor: 'bg-white/70'
  };
  if (score >= 40) return { 
    label: 'Fragile', 
    color: 'text-[#F97316]', 
    barColor: 'bg-[#F97316]'
  };
  return { 
    label: 'Broken', 
    color: 'text-[#F97316]', 
    barColor: 'bg-[#F97316]'
  };
};

const getStreakIndicator = (pillar: FutureSelfPillar): React.ReactNode => {
  if (pillar.consecutive_broken >= 2) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] text-black">
        <TrendingDown size={12} strokeWidth={2.5} />
        <span className="text-xs font-bold">{pillar.consecutive_broken}d</span>
      </div>
    );
  }
  if (pillar.consecutive_kept >= 3) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black">
        <TrendingUp size={12} strokeWidth={2.5} />
        <span className="text-xs font-bold">{pillar.consecutive_kept}d</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/40">
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
      className={`group relative p-6 transition-all duration-200 ${
        isPrimary 
          ? 'bg-[#0A0A0A] border-2 border-[#F97316]' 
          : 'bg-[#0A0A0A] border border-white/10 hover:border-white/20'
      }`}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-[#F97316] text-black text-xs font-bold uppercase tracking-wide px-3 py-1">
          <Star size={10} fill="currentColor" />
          Primary
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <h4 className="font-bold text-base tracking-tight leading-tight text-white uppercase">
              {label}
            </h4>
            <span className={`text-xs font-bold uppercase tracking-wide ${trustLevel.color}`}>
              {trustLevel.label}
            </span>
          </div>
        </div>
        {getStreakIndicator(pillar)}
      </div>
      
      {/* Future State / Identity */}
      <p className="text-sm text-white/50 mb-5 line-clamp-2 min-h-[2.5rem] leading-relaxed">
        {pillar.future_state || pillar.identity_statement}
      </p>
      
      {/* Trust Score Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">
            Trust
          </span>
          <span className="font-black text-xl text-white">
            {pillar.trust_score}%
          </span>
        </div>
        <div className="w-full h-2 bg-white/10 overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ease-out ${trustLevel.barColor}`}
            style={{ width: `${pillar.trust_score}%` }}
          />
        </div>
      </div>
      
      {/* Non-Negotiable */}
      {pillar.non_negotiable && (
        <div className="mt-5 pt-5 border-t border-white/10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-2">
            Non-Negotiable
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
      <div className="border border-dashed border-white/10 p-10 text-center bg-[#0A0A0A]">
        <div className="w-14 h-14 bg-white/10 flex items-center justify-center mx-auto mb-4">
          <Compass size={28} className="text-white/40" />
        </div>
        <p className="text-base text-white/50 mb-2 font-bold uppercase tracking-wide">
          No pillars defined yet
        </p>
        <p className="text-sm text-white/30">
          Complete onboarding to set up your pillars
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
                className={`relative border border-dashed p-6 ${
                  isPrimary ? 'border-white/30' : 'border-white/15'
                } bg-[#0A0A0A]`}
              >
                {isPrimary && (
                  <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-white/20 text-white/50 text-xs font-bold uppercase px-3 py-1">
                    <Star size={10} />
                    Primary
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4 mt-1">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                    <span className="text-2xl grayscale">{icon}</span>
                  </div>
                  <h4 className="font-bold text-base tracking-tight text-white/50 uppercase">
                    {label}
                  </h4>
                </div>
                <div className="h-2 bg-white/10 w-full mb-3" />
                <div className="h-2 bg-white/10 w-3/4" />
              </div>
            );
          })}
        </div>
        
        {/* Overlay message */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[#0A0A0A] border-2 border-[#F97316] px-8 py-4">
            <p className="font-bold text-sm tracking-tight text-center text-white uppercase">
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
