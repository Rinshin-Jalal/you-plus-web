
import React from 'react';

export const Counter = ({ value = 0, onChange, min = 0, max = 100 }: any) => (
    <div className="flex items-center gap-8 animate-in zoom-in duration-500">
        <button 
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-16 h-16 border border-black/10 rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-colors font-mono font-medium text-2xl text-black"
        >
            -
        </button>
        <span className="font-mono font-bold text-7xl md:text-8xl text-black min-w-[2ch] text-center">{value}</span>
        <button 
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-16 h-16 border border-black/10 rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-colors font-mono font-medium text-2xl text-black"
        >
            +
        </button>
    </div>
);
