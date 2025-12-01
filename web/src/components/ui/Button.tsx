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
  
  // Base styles: Extremely brutalist, sharp edges, no smoothing.
  const baseStyles = "relative font-display font-bold uppercase tracking-widest border-2 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden";
  
  const variants = {
    primary: "border-black bg-black text-white hover:bg-white hover:text-black", // Inverts on hover
    secondary: "border-black bg-white text-black hover:bg-black hover:text-white",
    danger: "border-neon-red bg-transparent text-neon-red hover:bg-neon-red hover:text-black", 
    success: "border-neon-teal bg-neon-teal text-black hover:bg-white",
    outline: "border-current bg-transparent hover:bg-white/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-8 py-4 text-sm",
    lg: "px-12 py-6 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-3 w-full">
        {isLoading && (
          <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-none" />
        )}
        {children}
      </span>
      {/* Hover Glitch Line */}
      <div className="absolute top-0 left-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 pointer-events-none" />
    </button>
  );
};