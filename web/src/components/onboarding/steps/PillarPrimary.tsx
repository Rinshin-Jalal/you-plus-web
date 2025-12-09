'use client';

import React from 'react';
import { getPillarById, createCustomPillar, PillarPreset } from '@/data/pillarPresets';
import { audioService } from '@/services/audio';

interface PillarPrimaryProps {
  selectedPillars: string[];
  onSelect: (pillarId: string) => void;
}

export const PillarPrimary = ({ selectedPillars, onSelect }: PillarPrimaryProps) => {
  // Get pillar details for each selected pillar
  const pillars: PillarPreset[] = selectedPillars.map(id => {
    const preset = getPillarById(id);
    if (preset) return preset;
    // Handle custom pillars
    if (id.startsWith('custom_')) {
      return createCustomPillar(id);
    }
    // Fallback
    return {
      id,
      label: id.replace(/_/g, ' '),
      icon: '🎯',
      description: '',
      category: 'lifestyle' as const,
      currentStateOptions: [],
      goalPrompt: '',
      futurePrompt: ''
    };
  });

  const handleSelect = (pillarId: string) => {
    audioService.playMilestone();
    onSelect(pillarId);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="font-mono text-2xl md:text-3xl font-bold mb-4 text-white">
          Which one matters MOST right now?
        </h2>
        <p className="font-mono text-white/50">
          Pick the one you&apos;d fix first if you could only pick one
        </p>
      </div>

      {/* Pillar Options */}
      <div className="space-y-4">
        {pillars.map((pillar) => (
          <button
            key={pillar.id}
            onClick={() => handleSelect(pillar.id)}
            className="w-full p-6 border-2 border-white/10 bg-white/5 
                       hover:border-white/30 hover:bg-white/10 
                       transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="text-3xl group-hover:scale-110 transition-transform">
                {pillar.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="font-mono font-bold text-lg text-white group-hover:text-[#F97316] transition-colors">
                  {pillar.label}
                </div>
                {pillar.description && (
                  <div className="font-mono text-sm text-white/40 mt-1">
                    {pillar.description}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div className="text-white/20 group-hover:text-[#F97316] group-hover:translate-x-1 transition-all">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info text */}
      <p className="text-center text-xs text-white/30 mt-8 font-mono">
        Don&apos;t worry, you&apos;ll work on all {selectedPillars.length}. This just sets your main focus.
      </p>
    </div>
  );
};
