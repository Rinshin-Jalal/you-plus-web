'use client';

import React from 'react';
import { Mic, Users } from 'lucide-react';
import { audioService } from '@/services/audio';

export type VoicePreferenceChoice = 'clone' | 'preset';

interface VoicePreferenceProps {
  onSelect: (preference: VoicePreferenceChoice) => void;
}

export const VoicePreference = ({ onSelect }: VoicePreferenceProps) => {
  const handleSelect = (preference: VoicePreferenceChoice) => {
    audioService.playMilestone();
    onSelect(preference);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="font-mono text-2xl md:text-3xl font-bold mb-4 text-white">
          Your Future Self&apos;s Voice
        </h2>
        <p className="font-mono text-white/50 text-sm md:text-base px-4">
          I&apos;ll be calling you as your Future Self.<br />
          Do you want me to sound like YOU?
        </p>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {/* Use My Voice Option */}
        <button
          onClick={() => handleSelect('clone')}
          className="w-full p-6 border-2 border-white/10 bg-white/5 
                     hover:border-[#F97316] hover:bg-[#F97316]/10 
                     transition-all duration-200 text-left group"
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-[#F97316]/20 flex items-center justify-center
                          group-hover:bg-[#F97316]/30 transition-colors">
              <Mic className="w-6 h-6 text-[#F97316]" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="font-mono font-bold text-lg text-white group-hover:text-[#F97316] transition-colors">
                Use My Voice
              </div>
              <div className="font-mono text-sm text-white/40 mt-1">
                Record your voice and I&apos;ll sound like you
              </div>
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

        {/* Choose a Voice Option */}
        <button
          onClick={() => handleSelect('preset')}
          className="w-full p-6 border-2 border-white/10 bg-white/5 
                     hover:border-[#F97316] hover:bg-[#F97316]/10 
                     transition-all duration-200 text-left group"
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center
                          group-hover:bg-[#F97316]/30 transition-colors">
              <Users className="w-6 h-6 text-white/60 group-hover:text-[#F97316] transition-colors" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="font-mono font-bold text-lg text-white group-hover:text-[#F97316] transition-colors">
                Choose a Voice
              </div>
              <div className="font-mono text-sm text-white/40 mt-1">
                Pick from curated mentor voices
              </div>
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
      </div>

      {/* Info text */}
      <p className="text-center text-xs text-white/30 mt-8 font-mono px-4">
        Your Future Self will call you daily to check in and hold you accountable
      </p>
    </div>
  );
};
