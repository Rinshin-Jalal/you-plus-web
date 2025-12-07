'use client';

import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { PILLAR_PRESETS, MIN_PILLARS, MAX_PILLARS, PillarPreset } from '@/data/pillarPresets';

interface PillarSelectionProps {
  selected: string[];
  onSelect: (pillars: string[]) => void;
  onContinue: () => void;
}

export const PillarSelection = ({ selected, onSelect, onContinue }: PillarSelectionProps) => {
  const [customPillar, setCustomPillar] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const togglePillar = (pillarId: string) => {
    if (selected.includes(pillarId)) {
      // Remove
      onSelect(selected.filter(id => id !== pillarId));
    } else if (selected.length < MAX_PILLARS) {
      // Add
      onSelect([...selected, pillarId]);
    }
  };

  const addCustomPillar = () => {
    if (customPillar.trim() && selected.length < MAX_PILLARS) {
      // Custom pillars get a prefixed ID
      const customId = `custom_${customPillar.toLowerCase().replace(/\s+/g, '_')}`;
      onSelect([...selected, customId]);
      setCustomPillar('');
      setShowCustomInput(false);
    }
  };

  const canContinue = selected.length >= MIN_PILLARS;

  return (
    <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-mono text-2xl md:text-3xl font-bold mb-2 text-black">
          What do you want to change?
        </h2>
        <p className="font-mono text-gray-600">
          Pick {MIN_PILLARS}-{MAX_PILLARS} areas that matter most to you
        </p>
      </div>

      {/* Selection counter */}
      <div className="flex justify-center mb-6">
        <div className="flex gap-1">
          {Array.from({ length: MAX_PILLARS }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < selected.length ? 'bg-black scale-110' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Pillar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {PILLAR_PRESETS.map((pillar) => {
          const isSelected = selected.includes(pillar.id);
          const isDisabled = !isSelected && selected.length >= MAX_PILLARS;

          return (
            <button
              key={pillar.id}
              onClick={() => togglePillar(pillar.id)}
              disabled={isDisabled}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-black bg-black text-white' 
                  : isDisabled
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-gray-400 cursor-pointer'
                }`}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              )}

              {/* Icon */}
              <div className="text-2xl mb-2">{pillar.icon}</div>

              {/* Label */}
              <div className="font-mono font-semibold text-sm leading-tight">
                {pillar.label}
              </div>

              {/* Description */}
              <div className={`font-mono text-xs mt-1 leading-tight ${
                isSelected ? 'text-white/70' : 'text-gray-500'
              }`}>
                {pillar.description}
              </div>
            </button>
          );
        })}

        {/* Custom Pillar Button */}
        {!showCustomInput ? (
          <button
            onClick={() => setShowCustomInput(true)}
            disabled={selected.length >= MAX_PILLARS}
            className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 text-left
              ${selected.length >= MAX_PILLARS
                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                : 'border-gray-300 bg-white hover:border-gray-400 cursor-pointer'
              }`}
          >
            <div className="text-2xl mb-2">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <div className="font-mono font-semibold text-sm text-gray-600">
              Create Your Own
            </div>
            <div className="font-mono text-xs mt-1 text-gray-400">
              Something else?
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-xl border-2 border-black bg-white">
            <input
              type="text"
              value={customPillar}
              onChange={(e) => setCustomPillar(e.target.value)}
              placeholder="e.g., Gaming Less"
              autoFocus
              className="w-full font-mono text-sm border-b border-gray-200 pb-2 mb-2 focus:outline-none focus:border-black"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomPillar();
                if (e.key === 'Escape') setShowCustomInput(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={addCustomPillar}
                disabled={!customPillar.trim()}
                className="flex-1 py-1 px-2 bg-black text-white rounded text-xs font-mono disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="py-1 px-2 text-gray-500 hover:text-black"
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
            const isCustom = pillarId.startsWith('custom_');
            const label = preset?.label || pillarId.replace('custom_', '').replace(/_/g, ' ');
            const icon = preset?.icon || '✨';

            return (
              <button
                key={pillarId}
                onClick={() => togglePillar(pillarId)}
                className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full font-mono text-sm hover:bg-gray-800 transition-colors"
              >
                <span>{icon}</span>
                <span>{label}</span>
                <X className="w-3 h-3 ml-1" />
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
          className={`px-8 py-4 rounded-xl font-mono font-bold text-lg transition-all duration-300
            ${canContinue
              ? 'bg-black text-white hover:scale-105 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          {canContinue 
            ? `Continue with ${selected.length} pillars`
            : `Pick at least ${MIN_PILLARS} areas`
          }
        </button>
      </div>
    </div>
  );
};
