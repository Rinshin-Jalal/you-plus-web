
import React from 'react';

export const MinimalSlider = ({ value = 5, onChange, min = 1, max = 10, label }: any) => {
    return (
        <div className="w-full max-w-xl space-y-12 animate-in fade-in duration-700">
            <div className="text-center">
                <span className="font-mono text-black text-2xl md:text-3xl leading-relaxed font-medium">{label || 'Intensity'}</span>
            </div>
            <div className="flex justify-center items-end border-b-2 border-black/10 pb-4">
                <span className="font-mono font-bold text-7xl md:text-8xl text-black leading-none">{value}</span>
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-black/5 appearance-none cursor-pointer rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
            />
            <div className="flex justify-between font-mono text-xs text-black/30">
                <span>Low</span>
                <span>Extreme</span>
            </div>
        </div>
    );
};
