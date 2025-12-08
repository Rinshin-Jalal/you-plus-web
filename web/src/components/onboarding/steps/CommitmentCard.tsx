
import React, { useState } from 'react';
import { Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PILLAR_PRESETS, getPillarById } from '@/data/pillarPresets';

interface CommitmentCardProps {
  data: any;
  onAccept: () => void;
}

export const CommitmentCard = ({ data, onAccept }: CommitmentCardProps) => {
  const [agreed, setAgreed] = useState(false);
  
  const commitments = [
    "I will show up every single day, no excuses.",
    "I will be radically honest with myself.",
    "I will embrace discomfort as the path to growth.",
    "I will not negotiate with my weaker self.",
    "I will hold myself to a higher standard."
  ];

  // Get pillar labels for display
  const getPillarLabel = (pillarId: string): { icon: string; label: string } => {
    const preset = getPillarById(pillarId);
    if (preset) {
      return { icon: preset.icon, label: preset.label };
    }
    // Handle custom pillars
    if (pillarId.startsWith('custom_')) {
      const label = pillarId.replace('custom_', '').replace(/_/g, ' ');
      return { icon: '', label: label.charAt(0).toUpperCase() + label.slice(1) };
    }
    return { icon: '', label: pillarId };
  };

  const selectedPillars = data.selected_pillars || [];

  return (
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header */}
          <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-orange-500 rounded-full mb-6 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                  <Shield size={28} className="text-orange-500" />
              </div>
              <h2 className="font-mono text-white text-2xl md:text-3xl font-medium mb-2">
                  Your Commitment
              </h2>
              <p className="font-mono text-white/40 text-sm">
                  This is a binding agreement with yourself.
              </p>
          </div>

          {/* User Info Summary */}
          <div className="bg-white/5 border border-orange-500/30 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                      <p className="font-mono text-white/40 text-xs mb-1">Name</p>
                      <p className="font-mono text-white font-medium">{data.name || 'Not provided'}</p>
                  </div>
                  <div>
                      <p className="font-mono text-white/40 text-xs mb-1">Call Time</p>
                      <p className="font-mono text-white font-medium">{data.call_time || '21:00'}</p>
                  </div>
              </div>
              <div>
                  <p className="font-mono text-white/40 text-xs mb-1">Identity</p>
                  <p className="font-mono text-white font-medium">{data.core_identity || 'Not provided'}</p>
              </div>
          </div>

          {/* Selected Pillars */}
          {selectedPillars.length > 0 && (
            <div className="mb-6">
              <p className="font-mono text-white/40 text-xs mb-3">Your Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {selectedPillars.map((pillarId: string) => {
                  const { icon, label } = getPillarLabel(pillarId);
                  return (
                    <span 
                      key={pillarId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full font-mono text-sm"
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Commitments List */}
          <div className="space-y-3 mb-8">
              {commitments.map((commitment, i) => (
                  <div 
                      key={i} 
                      className="flex items-start gap-4 p-4 border border-white/10 rounded-lg bg-white/5"
                      style={{ animationDelay: `${i * 100}ms` }}
                  >
                      <div className="w-6 h-6 rounded-full border-2 border-orange-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={12} className="text-orange-500/50" />
                      </div>
                      <p className="font-mono text-white/70 text-sm leading-relaxed">
                          {commitment}
                      </p>
                  </div>
              ))}
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-4 p-5 border-2 border-white/10 rounded-lg cursor-pointer hover:border-orange-500/50 transition-colors mb-8">
              <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-orange-500 cursor-pointer"
              />
              <span className="font-mono text-white text-sm leading-relaxed">
                  I understand this is a commitment to myself. I am ready to be held accountable.
              </span>
          </label>

          {/* Footer */}
          <div className="flex flex-col items-center gap-4">
              <Button 
                  size="lg" 
                  variant="primary" 
                  className={`w-full transition-all duration-300 ${!agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => agreed && onAccept()}
                  disabled={!agreed}
              >
                  I Accept This Commitment
              </Button>
              <p className="font-mono text-white/30 text-xs">
                  {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                  })}
              </p>
          </div>
      </div>
  );
}
