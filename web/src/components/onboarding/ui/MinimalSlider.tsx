
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
        <div className="w-full max-w-xl space-y-12 animate-bounce-in">
            <div className="text-center">
                <span className="font-mono text-2xl md:text-3xl leading-relaxed font-medium text-white">{label || 'Intensity'}</span>
            </div>
            
            {/* Value display with organic container */}
            <div className="flex justify-center">
                <div className="relative">
                    <span className="font-mono font-bold text-7xl md:text-8xl leading-none text-white block">{value}</span>
                    {/* Glow behind number */}
                    <div className="absolute inset-0 bg-orange-500/30 blur-3xl -z-10" />
                </div>
            </div>
            
            {/* Slider container with sharp styling */}
            <div className="relative p-4 bg-white/5 rounded-md">
                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    value={value} 
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-3 appearance-none cursor-pointer rounded bg-white/10"
                    style={{
                        background: `linear-gradient(to right, #F97316 0%, #FB923C ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`
                    }}
                />
                {/* Glow effect under the filled portion */}
                <div 
                    className="absolute top-4 left-4 h-3 rounded pointer-events-none blur-md"
                    style={{
                        width: `calc(${percentage}% - 2rem)`,
                        background: 'linear-gradient(to right, #F97316, #FB923C)',
                        opacity: 0.4
                    }}
                />
            </div>
            
            <div className="flex justify-between font-mono text-xs text-white/40">
                <span className="px-3 py-1 bg-white/5 rounded">Low</span>
                <span className="px-3 py-1 bg-white/5 rounded">Extreme</span>
            </div>
        </div>
    );
};
