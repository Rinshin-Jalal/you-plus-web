import React from 'react';
import { Variant, Size } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  className?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled,
  ...props
}) => {
  
  // Base styles: Brutalist with orange accent on dark theme
  const baseStyles = "relative font-mono font-bold uppercase tracking-wider border-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden";
  
  const variants = {
    // Primary: Orange bg with brutal shadow
    primary: `
      bg-[var(--accent-primary)] text-[var(--bg-primary)] border-[var(--accent-primary)]
      shadow-[3px_3px_0px_0px_var(--accent-secondary)]
      hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]
      disabled:bg-[var(--bg-tertiary)] disabled:border-[var(--bg-tertiary)] disabled:text-[var(--text-muted)] disabled:shadow-none
    `,
    // Secondary: Dark bg with orange border
    secondary: `
      bg-[var(--bg-secondary)] text-[var(--accent-primary)] border-[var(--accent-primary)]
      shadow-[3px_3px_0px_0px_rgba(249,115,22,0.3)]
      hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]
    `,
    // Danger: Red accent
    danger: `
      bg-transparent text-[var(--danger)] border-[var(--danger)]
      hover:bg-[var(--danger)] hover:text-white
    `,
    // Success: Green accent
    success: `
      bg-[var(--success)] text-[var(--bg-primary)] border-[var(--success)]
      shadow-[3px_3px_0px_0px_var(--success-muted)]
      hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]
    `,
    // Outline/Ghost: Transparent with hover
    outline: `
      bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]
      hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]
    `,
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-3 w-full">
        {isLoading && (
          <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent" />
        )}
        {children}
      </span>
      {/* Hover shine effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-white/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 pointer-events-none" />
    </button>
  );
};
