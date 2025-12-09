
import React, { useRef } from 'react';
import { audioService } from '@/services/audio';

interface MinimalSliderProps {
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export const MinimalSlider = ({ value = 5, onChange, min = 1, max = 10, label }: MinimalSliderProps) => {
    const lastSoundTime = useRef(0);

    const handleChange = (newValue: number) => {
      // Play tick sound but throttle it
      const now = Date.now();
      if (now - lastSoundTime.current > 100) {
        audioService.playClick();
        lastSoundTime.current = now;
      }
      onChange(newValue);
    };

    return (
        <div className="w-full max-w-xl space-y-12 animate-in fade-in duration-700">
            <div className="text-center">
                <span className="font-mono text-[#FAFAFA] text-2xl md:text-3xl leading-relaxed font-medium">{label || 'Intensity'}</span>
            </div>
            <div className="flex justify-center items-end border-b-2 border-white/20 pb-4">
                <span className="font-mono font-bold text-7xl md:text-8xl text-[#F97316] leading-none">{value}</span>
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                value={value} 
                onChange={(e) => handleChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-[#F97316] hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
            />
            <div className="flex justify-between font-mono text-xs text-white/40 uppercase tracking-wide">
                <span>Low</span>
                <span>Extreme</span>
            </div>
        </div>
    );
};
