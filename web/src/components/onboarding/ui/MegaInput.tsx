
import React, { useRef, useEffect } from 'react';

interface MegaInputProps {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onEnter: () => void;
  autoFocus?: boolean;
}

export const MegaInput = ({ value, onChange, placeholder, onEnter, autoFocus = true }: MegaInputProps) => {
  const ref = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (autoFocus && ref.current) {
        setTimeout(() => ref.current?.focus(), 100);
    }
  }, [autoFocus]);

  return (
    <div className="w-full max-w-2xl relative group animate-bounce-in">
      {/* Glowing background container */}
      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-orange-500/20 to-amber-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
      
      <div className="relative bg-white/5 rounded-md border-2 border-white/10 group-focus-within:border-orange-500/50 transition-all duration-300">
        <input
          ref={ref}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && value && onEnter()}
          className="w-full bg-transparent py-6 px-6 text-2xl md:text-3xl font-mono font-medium focus:outline-none text-center text-white placeholder-white/30 rounded-md"
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      
      {/* Helper text */}
      <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
        <span className="text-xs font-mono text-white/40 bg-white/5 px-3 py-1 rounded">Press Enter</span>
      </div>
    </div>
  );
};
