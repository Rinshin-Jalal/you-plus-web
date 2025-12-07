
import React from 'react';

interface MinimalSliderProps {
  value?: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export const MinimalSlider = ({ value = 5, onChange, min = 1, max = 10, label }: MinimalSliderProps) => {
    return (
        <div className="w-full max-w-xl space-y-12 animate-in fade-in duration-700">
            <div className="text-center">
                <span className="font-mono text-2xl md:text-3xl leading-relaxed font-medium text-black">{label || 'Intensity'}</span>
            </div>
            <div className="flex justify-center items-end border-b-2 border-black/10 pb-4">
                <span className="font-mono font-bold text-7xl md:text-8xl leading-none text-black">{value}</span>
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 appearance-none cursor-pointer rounded-full bg-black/5"
                style={{
                    background: `linear-gradient(to right, #000 0%, #000 ${((value - min) / (max - min)) * 100}%, rgba(0,0,0,0.05) ${((value - min) / (max - min)) * 100}%, rgba(0,0,0,0.05) 100%)`
                }}
            />
            <div className="flex justify-between font-mono text-xs text-black/30">
                <span>Low</span>
                <span>Extreme</span>
            </div>
        </div>
    );
};
