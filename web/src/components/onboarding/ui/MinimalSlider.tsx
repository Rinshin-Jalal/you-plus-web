
import React from 'react';

interface MinimalSliderProps {
  value?: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export const MinimalSlider = ({ value = 5, onChange, min = 1, max = 10, label }: MinimalSliderProps) => {
    const percentage = ((value - min) / (max - min)) * 100;
    
    return (
        <div className="w-full max-w-xl space-y-12 animate-in fade-in duration-700">
            <div className="text-center">
                <span className="font-mono text-2xl md:text-3xl leading-relaxed font-medium text-white">{label || 'Intensity'}</span>
            </div>
            <div className="flex justify-center items-end border-b-2 border-orange-500/30 pb-4">
                <span className="font-mono font-bold text-7xl md:text-8xl leading-none text-white">{value}</span>
            </div>
            <div className="relative">
                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    value={value} 
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-2 appearance-none cursor-pointer rounded-full bg-white/10"
                    style={{
                        background: `linear-gradient(to right, #F97316 0%, #F59E0B ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`
                    }}
                />
                {/* Glow effect under the filled portion */}
                <div 
                    className="absolute top-0 left-0 h-2 rounded-full pointer-events-none blur-sm"
                    style={{
                        width: `${percentage}%`,
                        background: 'linear-gradient(to right, #F97316, #F59E0B)',
                        opacity: 0.5
                    }}
                />
            </div>
            <div className="flex justify-between font-mono text-xs text-white/30">
                <span>Low</span>
                <span>Extreme</span>
            </div>
        </div>
    );
};
