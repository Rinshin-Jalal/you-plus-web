'use client';

import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { PILLAR_PRESETS, MIN_PILLARS, MAX_PILLARS, getCategories, getPillarsByCategory } from '@/data/pillarPresets';

interface PillarSelectionProps {
  selected: string[];
  onSelect: (pillars: string[]) => void;
  onContinue: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  body: '💪 Body',
  mind: '🧠 Mind', 
  money: '💰 Money',
  game: '🎯 Game',
  lifestyle: '⚡ Lifestyle',
};

export const PillarSelection = ({ selected, onSelect, onContinue }: PillarSelectionProps) => {
  const [customPillar, setCustomPillar] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const togglePillar = (pillarId: string) => {
    if (selected.includes(pillarId)) {
      onSelect(selected.filter(id => id !== pillarId));
    } else if (selected.length < MAX_PILLARS) {
      onSelect([...selected, pillarId]);
    }
  };

  const addCustomPillar = () => {
    if (customPillar.trim() && selected.length < MAX_PILLARS) {
      const customId = `custom_${customPillar.toLowerCase().replace(/\s+/g, '_')}`;
      onSelect([...selected, customId]);
      setCustomPillar('');
      setShowCustomInput(false);
    }
  };

  const canContinue = selected.length >= MIN_PILLARS;
  const categories = getCategories();

  // Get pillars to display - either all or filtered by category
  const displayPillars = activeCategory 
    ? getPillarsByCategory(activeCategory as 'body' | 'mind' | 'money' | 'game' | 'lifestyle')
    : PILLAR_PRESETS;

  return (
    <div className="w-full max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-mono text-2xl md:text-3xl font-bold mb-2 text-white">
          What are you fixing?
        </h2>
        <p className="font-mono text-white/50 text-sm">
          Pick {MIN_PILLARS}-{MAX_PILLARS} areas. Be honest.
        </p>
      </div>

      {/* Selection counter */}
      <div className="flex justify-center mb-4">
        <div className="flex gap-1">
          {Array.from({ length: MAX_PILLARS }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 transition-all duration-300 ${
                i < selected.length ? 'bg-[#F97316] scale-110' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all
            ${!activeCategory 
              ? 'bg-[#F97316] text-black font-bold' 
              : 'bg-white/10 text-white/60 hover:text-white'
            }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all
              ${activeCategory === cat 
                ? 'bg-[#F97316] text-black font-bold' 
                : 'bg-white/10 text-white/60 hover:text-white'
              }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Pillar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6 max-h-[45vh] overflow-y-auto pr-1">
        {displayPillars.map((pillar) => {
          const isSelected = selected.includes(pillar.id);
          const isDisabled = !isSelected && selected.length >= MAX_PILLARS;

          return (
            <button
              key={pillar.id}
              onClick={() => togglePillar(pillar.id)}
              disabled={isDisabled}
              className={`relative p-3 border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-[#F97316] bg-[#F97316]/20 text-white' 
                  : isDisabled
                    ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed'
                    : 'border-white/10 bg-white/5 hover:border-[#F97316]/50 cursor-pointer'
                }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-[#F97316]">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              )}
              <div className="text-xl mb-1">{pillar.icon}</div>
              <div className="font-mono font-semibold text-sm text-white">
                {pillar.label}
              </div>
              <div className={`font-mono text-[10px] mt-0.5 leading-tight line-clamp-2 ${
                isSelected ? 'text-white/70' : 'text-white/40'
              }`}>
                {pillar.description}
              </div>
            </button>
          );
        })}

        {/* Custom Pillar Button - only show in "All" view */}
        {!activeCategory && !showCustomInput && (
          <button
            onClick={() => setShowCustomInput(true)}
            disabled={selected.length >= MAX_PILLARS}
            className={`p-3 border-2 border-dashed transition-all duration-200 text-left
              ${selected.length >= MAX_PILLARS
                ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed'
                : 'border-white/20 bg-white/5 hover:border-[#F97316]/50 cursor-pointer'
              }`}
          >
            <Plus className="w-5 h-5 text-white/40 mb-1" />
            <div className="font-mono font-semibold text-sm text-white/60">
              Custom
            </div>
            <div className="font-mono text-[10px] mt-0.5 text-white/30">
              Something else?
            </div>
          </button>
        )}

        {/* Custom Input */}
        {!activeCategory && showCustomInput && (
          <div className="p-3 border-2 border-[#F97316] bg-white/5">
            <input
              type="text"
              value={customPillar}
              onChange={(e) => setCustomPillar(e.target.value)}
              placeholder="e.g., Quitting Weed"
              autoFocus
              className="w-full font-mono text-sm border-b border-white/20 pb-2 mb-2 focus:outline-none focus:border-[#F97316] bg-transparent text-white placeholder-white/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomPillar();
                if (e.key === 'Escape') setShowCustomInput(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={addCustomPillar}
                disabled={!customPillar.trim()}
                className="flex-1 py-1 px-2 bg-[#F97316] text-black text-xs font-mono font-bold uppercase disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="py-1 px-2 text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {selected.map(pillarId => {
            const preset = PILLAR_PRESETS.find(p => p.id === pillarId);
            const label = preset?.label || pillarId.replace('custom_', '').replace(/_/g, ' ');
            const icon = preset?.icon || '🎯';

            return (
              <button
                key={pillarId}
                onClick={() => togglePillar(pillarId)}
                className="flex items-center gap-1 px-2 py-1 bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30 font-mono text-xs hover:bg-[#F97316]/30 transition-colors"
              >
                <span>{icon}</span>
                <span>{label}</span>
                <X className="w-3 h-3 ml-0.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`px-8 py-4 font-mono font-bold text-lg uppercase tracking-wide transition-all duration-300
            ${canContinue
              ? 'bg-[#F97316] text-black hover:bg-[#FB923C] cursor-pointer'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
        >
          {canContinue 
            ? `Lock in ${selected.length} ${selected.length === 1 ? 'pillar' : 'pillars'}`
            : `Pick at least ${MIN_PILLARS}`
          }
        </button>
      </div>
    </div>
  );
};
