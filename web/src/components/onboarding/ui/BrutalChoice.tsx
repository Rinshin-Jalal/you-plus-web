
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface BrutalChoiceProps {
  options: string[];
  onSelect: (val: string) => void;
  disabled?: boolean;
}

export const BrutalChoice = ({ options, onSelect, disabled = false }: BrutalChoiceProps) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xl animate-bounce-in">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => !disabled && onSelect(opt)}
          disabled={disabled}
          style={{ animationDelay: `${i * 100}ms` }}
          className={`group relative w-full text-left px-6 py-5 rounded-md transition-all duration-300 ease-out
            bg-white/5 text-white border-2 border-white/10
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer active:scale-[0.98]'
            }`}
        >
          <div className="flex justify-between items-center">
              <span className={`font-mono text-lg md:text-xl font-medium transition-transform duration-300
                ${!disabled && 'group-hover:translate-x-2'}`}>
              {opt}
              </span>
              <div className={`w-10 h-10 rounded bg-orange-500/20 flex items-center justify-center transition-all duration-300
                ${disabled ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'}`}>
                <ArrowRight className="w-5 h-5 text-orange-500" strokeWidth={2} />
              </div>
          </div>
        </button>
      ))}
    </div>
  );
};
