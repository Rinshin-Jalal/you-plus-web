
import React, { useRef, useEffect } from 'react';

interface MegaInputProps {
  value: string;
  onChange: (value: string) => void;
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
    <div className="w-full max-w-2xl relative group">
      <input
        ref={ref}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && value && onEnter()}
        className="w-full bg-transparent border-b-2 border-white/20 py-6 text-3xl md:text-4xl font-mono font-medium text-[#FAFAFA] placeholder-white/30 focus:outline-none focus:border-[#F97316] transition-all duration-300 text-center"
        placeholder={placeholder}
        autoComplete="off"
      />
      <div className="absolute right-0 bottom-6 opacity-0 group-focus-within:opacity-100 transition-opacity">
        <span className="text-xs font-mono text-white/40">Press Enter</span>
      </div>
    </div>
  );
};
