
import React, { useRef, useEffect } from 'react';

export const MegaInput = ({ value, onChange, placeholder, onEnter, autoFocus = true }: any) => {
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
        className="w-full bg-transparent border-b-2 border-black/10 py-6 text-3xl md:text-4xl font-mono font-medium text-black placeholder-black/20 focus:outline-none focus:border-black transition-all duration-300 text-center"
        placeholder={placeholder}
        autoComplete="off"
      />
      <div className="absolute right-0 bottom-6 opacity-0 group-focus-within:opacity-100 transition-opacity">
        <span className="text-xs font-mono text-black/40">Press Enter</span>
      </div>
    </div>
  );
};
