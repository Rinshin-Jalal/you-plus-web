'use client';

import React, { useState } from 'react';
import { Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getPillarById, createCustomPillar } from '@/data/pillarPresets';

interface CommitmentCardProps {
  data: Record<string, unknown>;
  onAccept: () => void;
}

export const CommitmentCard = ({ data, onAccept }: CommitmentCardProps) => {
  const [agreed, setAgreed] = useState(false);

  // Get pillar info
  const getPillarInfo = (pillarId: string) => {
    const preset = getPillarById(pillarId);
    if (preset) return preset;
    if (pillarId.startsWith('custom_')) {
      return createCustomPillar(pillarId);
    }
    return { icon: '🎯', label: pillarId.replace(/_/g, ' ') };
  };

  // Extract data with fallbacks
  const name = (data.name as string) || (data[4] as string) || 'You';
  const coreIdentity = (data.core_identity as string) || (data[21] as string) || 'Someone who shows up';
  const checkInTime = (data.check_in_time as string) || (data[24] as string) || '21:00';
  const selectedPillars: string[] = Array.isArray(data.selected_pillars) ? data.selected_pillars : (Array.isArray(data[8]) ? data[8] : []);
  const primaryPillar = (data.primary_pillar as string) || (data[9] as string) || selectedPillars[0];
  const quitPattern = (data.quit_pattern as string) || (data[13] as string) || '';
  const favoriteExcuse = (data.favorite_excuse as string) || (data[14] as string) || '';
  const beliefScore = (data.belief_score as number) || (data[27] as number) || 5;
  const strikesAllowed = (data.strikes_allowed as number) || (data[26] as number) || 3;

  // Get identity statements for each pillar
  const getPillarIdentity = (pillarId: string): string => {
    return (data[`${pillarId}_identity_statement`] as string) || '';
  };

  return (
    <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#F97316] mb-6">
          <Shield size={28} className="text-[#F97316]" />
        </div>
        <h2 className="font-mono text-[#FAFAFA] text-2xl md:text-3xl font-medium mb-2">
          Your Commitment
        </h2>
        <p className="font-mono text-white/40 text-sm">
          This is a binding agreement with yourself.
        </p>
      </div>

      {/* Core Identity - Main Focus */}
      <div className="bg-[#F97316]/10 border-2 border-[#F97316] p-6 mb-6 text-center">
        <p className="font-mono text-white/50 text-xs mb-2 uppercase tracking-wide">I am becoming</p>
        <p className="font-mono text-[#FAFAFA] text-xl md:text-2xl font-bold">
          &ldquo;{coreIdentity}&rdquo;
        </p>
      </div>

      {/* User Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="font-mono text-white/40 text-xs mb-1 uppercase tracking-wide">Name</p>
          <p className="font-mono text-[#FAFAFA] font-medium">{name}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="font-mono text-white/40 text-xs mb-1 uppercase tracking-wide">Check-in</p>
          <p className="font-mono text-[#FAFAFA] font-medium">{checkInTime}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="font-mono text-white/40 text-xs mb-1 uppercase tracking-wide">Belief</p>
          <p className="font-mono text-[#FAFAFA] font-medium">{beliefScore}/10</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="font-mono text-white/40 text-xs mb-1 uppercase tracking-wide">Strikes</p>
          <p className="font-mono text-[#FAFAFA] font-medium">{strikesAllowed} allowed</p>
        </div>
      </div>

      {/* Primary Pillar */}
      {primaryPillar && (
        <div className="mb-6">
          <p className="font-mono text-white/40 text-xs mb-3 uppercase tracking-wide">Primary Focus</p>
          <div className="bg-[#F97316]/10 border border-[#F97316]/30 p-4">
            {(() => {
              const info = getPillarInfo(primaryPillar);
              const identity = getPillarIdentity(primaryPillar);
              return (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <p className="font-mono text-[#F97316] font-bold">{info.label}</p>
                    {identity && (
                      <p className="font-mono text-white/60 text-sm">&ldquo;{identity}&rdquo;</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Other Pillars */}
      {selectedPillars.length > 1 && (
        <div className="mb-6">
          <p className="font-mono text-white/40 text-xs mb-3 uppercase tracking-wide">Also Working On</p>
          <div className="flex flex-wrap gap-2">
            {selectedPillars
              .filter((id: string) => id !== primaryPillar)
              .map((pillarId: string) => {
                const info = getPillarInfo(pillarId);
                return (
                  <span 
                    key={pillarId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/70 border border-white/10 font-mono text-sm"
                  >
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Pattern Awareness */}
      {(quitPattern || favoriteExcuse) && (
        <div className="bg-white/5 border border-white/10 p-4 mb-6">
          <p className="font-mono text-white/40 text-xs mb-3 uppercase tracking-wide">I Know My Patterns</p>
          <div className="space-y-2">
            {quitPattern && (
              <p className="font-mono text-white/60 text-sm">
                <span className="text-white/40">I quit at:</span> <span className="text-[#F97316]">{quitPattern}</span>
              </p>
            )}
            {favoriteExcuse && (
              <p className="font-mono text-white/60 text-sm">
                <span className="text-white/40">My excuse:</span> <span className="text-[#F97316]">&ldquo;{favoriteExcuse}&rdquo;</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* The Pledge */}
      <div className="border-2 border-white/20 p-5 mb-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 border-2 border-[#F97316]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check size={10} className="text-[#F97316]/70" />
          </div>
          <p className="font-mono text-white/70 text-sm">I will show up every single day.</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 border-2 border-[#F97316]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check size={10} className="text-[#F97316]/70" />
          </div>
          <p className="font-mono text-white/70 text-sm">I will be radically honest with myself.</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 border-2 border-[#F97316]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check size={10} className="text-[#F97316]/70" />
          </div>
          <p className="font-mono text-white/70 text-sm">I will not negotiate with my weaker self.</p>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <label className="flex items-start gap-4 p-5 border-2 border-white/10 cursor-pointer hover:border-[#F97316]/50 transition-colors mb-6">
        <input 
          type="checkbox" 
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-5 h-5 mt-0.5 accent-[#F97316] cursor-pointer"
        />
        <span className="font-mono text-[#FAFAFA] text-sm leading-relaxed">
          I understand this is a commitment to myself. I am ready to be held accountable.
        </span>
      </label>

      {/* Accept Button */}
      <Button 
        size="lg" 
        variant="accent" 
        className={`w-full transition-all duration-300 ${!agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => agreed && onAccept()}
        disabled={!agreed}
      >
        I Accept This Commitment
      </Button>

      {/* Date Footer */}
      <p className="font-mono text-white/30 text-xs text-center mt-4">
        {new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
    </div>
  );
};
