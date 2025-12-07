
import React from 'react';

interface CounterProps {
  value?: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export const Counter = ({ value = 0, onChange, min = 0, max = 100 }: CounterProps) => {
  return (
    <div className="flex items-center gap-8 animate-in zoom-in duration-500">
        <button 
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-16 h-16 border border-black/10 rounded-lg flex items-center justify-center transition-colors font-mono font-medium text-2xl text-black hover:bg-black hover:text-white"
        >
            -
        </button>
        <span className="font-mono font-bold text-7xl md:text-8xl min-w-[2ch] text-center text-black">{value}</span>
        <button 
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-16 h-16 border border-black/10 rounded-lg flex items-center justify-center transition-colors font-mono font-medium text-2xl text-black hover:bg-black hover:text-white"
        >
            +
        </button>
    </div>
  );
};
