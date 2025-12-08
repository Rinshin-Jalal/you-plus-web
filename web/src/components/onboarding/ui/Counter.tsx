
import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterProps {
  value?: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export const Counter = ({ value = 0, onChange, min = 0, max = 100 }: CounterProps) => {
  return (
    <div className="flex items-center gap-8 animate-bounce-in">
        <button 
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-16 h-16 rounded-md bg-white/5 border-2 border-white/10 flex items-center justify-center transition-all duration-300 text-white hover:bg-orange-500 hover:border-orange-500 active:scale-95"
        >
            <Minus size={24} strokeWidth={2.5} />
        </button>
        <div className="relative">
          <span className="font-mono font-bold text-7xl md:text-8xl min-w-[2ch] text-center text-white block">{value}</span>
          {/* Subtle glow behind number */}
          <div className="absolute inset-0 bg-orange-500/20 blur-2xl -z-10" />
        </div>
        <button 
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-16 h-16 rounded-md bg-white/5 border-2 border-white/10 flex items-center justify-center transition-all duration-300 text-white hover:bg-orange-500 hover:border-orange-500 active:scale-95"
        >
            <Plus size={24} strokeWidth={2.5} />
        </button>
    </div>
  );
};
