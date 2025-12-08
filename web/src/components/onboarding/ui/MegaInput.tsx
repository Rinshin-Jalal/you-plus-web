
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
    <div className="w-full max-w-2xl relative group">
      <input
        ref={ref}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && value && onEnter()}
        className="w-full bg-transparent border-b-3 border-orange-500/30 py-6 text-3xl md:text-4xl font-mono font-medium focus:outline-none focus:border-orange-500 transition-all duration-300 text-center text-white placeholder-white/30"
        placeholder={placeholder}
        autoComplete="off"
        style={{ borderBottomWidth: '3px' }}
      />
      <div className="absolute right-0 bottom-6 opacity-0 group-focus-within:opacity-100 transition-opacity">
        <span className="text-xs font-mono text-white/40">Press Enter</span>
      </div>
      {/* Glow effect on focus */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity" />
    </div>
  );
};
