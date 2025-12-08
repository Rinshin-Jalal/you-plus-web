
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface BrutalChoiceProps {
  options: string[];
  onSelect: (val: string) => void;
  disabled?: boolean;
}

export const BrutalChoice = ({ options, onSelect, disabled = false }: BrutalChoiceProps) => {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xl animate-in slide-in-from-bottom-8 duration-500">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => !disabled && onSelect(opt)}
          disabled={disabled}
          className={`group relative w-full text-left px-6 py-5 border-2 rounded-lg transition-all duration-200
            border-white/10 bg-white/5 text-white
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer'
            }`}
        >
          <div className="flex justify-between items-center">
              <span className={`font-mono text-lg md:text-xl font-medium transition-transform duration-300
                ${!disabled && 'group-hover:translate-x-2'}`}>
              {opt}
              </span>
              <ArrowRight className={`transition-all duration-300 w-5 h-5 text-orange-500
                ${disabled ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0'}`} strokeWidth={2} />
          </div>
        </button>
      ))}
    </div>
  );
};
