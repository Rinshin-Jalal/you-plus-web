
import React from 'react';

interface CounterProps {
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const Counter = ({ value = 0, onChange, min = 0, max = 100 }: CounterProps) => (
    <div className="flex items-center gap-8 animate-in zoom-in duration-500">
        <button 
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-16 h-16 border border-white/20 flex items-center justify-center hover:bg-[#F97316] hover:border-[#F97316] hover:text-black transition-colors font-mono font-medium text-2xl text-[#FAFAFA]"
        >
            -
        </button>
        <span className="font-mono font-bold text-7xl md:text-8xl text-[#F97316] min-w-[2ch] text-center">{value}</span>
        <button 
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-16 h-16 border border-white/20 flex items-center justify-center hover:bg-[#F97316] hover:border-[#F97316] hover:text-black transition-colors font-mono font-medium text-2xl text-[#FAFAFA]"
        >
            +
        </button>
    </div>
);
