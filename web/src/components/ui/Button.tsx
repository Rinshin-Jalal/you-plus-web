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
  
  // Base styles: Organic Brutalism - pill shaped, bouncy animations
  const baseStyles = `
    relative font-bold tracking-wide 
    transition-all duration-300 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    group overflow-hidden
    inline-flex items-center justify-center gap-3
  `;
  
  const variants = {
    // Primary: Orange solid, slightly rounded
    primary: `
      bg-[#F97316]
      text-[#0D0D0D] 
      rounded-md
      hover:bg-[#FB923C]
      hover:-translate-y-0.5
      active:translate-y-0
      disabled:bg-[#262626] 
      disabled:text-[#525252]
    `,
    // Secondary: Outline, slightly rounded
    secondary: `
      bg-transparent 
      text-[#F97316] 
      border-2 border-[#F97316]
      rounded-md
      hover:bg-[#F97316] hover:text-[#0D0D0D]
      hover:-translate-y-0.5
    `,
    // Danger: Red accent
    danger: `
      bg-transparent 
      text-[#EF4444] 
      border-2 border-[#EF4444]
      rounded-md
      hover:bg-[#EF4444] hover:text-white
      hover:-translate-y-0.5
    `,
    // Success: Green solid
    success: `
      bg-[#22C55E]
      text-[#0D0D0D]
      rounded-md
      hover:bg-[#4ADE80]
      hover:-translate-y-0.5
      active:translate-y-0
    `,
    // Outline/Ghost: Subtle
    outline: `
      bg-transparent 
      text-[#A3A3A3] 
      border-2 border-[#333333]
      rounded-md
      hover:border-[#F97316] hover:text-[#F97316]
      hover:bg-[rgba(249,115,22,0.1)]
    `,
  };

  const sizes = {
    sm: "px-5 py-2.5 text-xs",
    md: "px-7 py-3.5 text-sm",
    lg: "px-10 py-5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-3 w-full">
        {isLoading && (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {children}
      </span>

    </button>
  );
};
