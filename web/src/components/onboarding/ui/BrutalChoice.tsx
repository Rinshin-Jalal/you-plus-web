
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { audioService } from '@/services/audio';

interface BrutalChoiceProps {
  options: string[];
  onSelect: (val: string) => void;
  disabled?: boolean;
}

export const BrutalChoice = ({ options, onSelect, disabled = false }: BrutalChoiceProps) => {
  const handleSelect = (opt: string) => {
    if (disabled) return;
    audioService.playTick();
    onSelect(opt);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xl animate-in slide-in-from-bottom-8 duration-500">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => handleSelect(opt)}
          disabled={disabled}
          className={`group relative w-full text-left px-6 py-5 border transition-all duration-200
            ${disabled 
              ? 'bg-white/5 border-white/10 cursor-not-allowed opacity-50' 
              : 'bg-white/5 border-white/20 hover:bg-[#F97316] hover:border-[#F97316] hover:text-black cursor-pointer'
            }`}
        >
          <div className="flex justify-between items-center">
              <span className={`font-mono text-lg md:text-xl font-medium transition-transform duration-300 text-[#FAFAFA] group-hover:text-black
                ${!disabled && 'group-hover:translate-x-2'}`}>
              {opt}
              </span>
              <ArrowRight className={`transition-all duration-300 w-5 h-5 text-[#FAFAFA] group-hover:text-black
                ${disabled ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0'}`} strokeWidth={2} />
          </div>
        </button>
      ))}
    </div>
  );
};
