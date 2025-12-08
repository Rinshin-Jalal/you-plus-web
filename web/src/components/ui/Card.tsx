import React from 'react';

type CardVariant = 'default' | 'elevated' | 'accent' | 'glass';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  noPadding?: boolean;
  noHover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  variant = 'default',
  className = '',
  noPadding = false,
  noHover = false,
}) => {
  // Organic Brutalism: Minimal rounded corners, subtle shadows, no hard edges
  const baseStyles = `
    rounded-lg
    transition-all duration-300
    flex flex-col h-full
  `;

  const variants = {
    default: `
      bg-gradient-to-br from-[#1A1A1A] to-[#141414]
      border border-[#333333]
      shadow-lg
    `,
    elevated: `
      bg-gradient-to-br from-[#262626] to-[#1A1A1A]
      border border-[#404040]
      shadow-xl
    `,
    accent: `
      bg-gradient-to-br from-[rgba(249,115,22,0.12)] to-[rgba(249,115,22,0.04)]
      border-2 border-[#F97316]
      shadow-[0_4px_20px_rgba(249,115,22,0.2)]
    `,
    glass: `
      bg-[rgba(255,255,255,0.03)]
      border border-white/10
      backdrop-blur-xl
    `,
  };

  const hoverStyles = noHover 
    ? '' 
    : `
      hover:-translate-y-1 
      hover:shadow-xl
      cursor-pointer
    `;

  const getHoverShadow = () => {
    if (noHover) return {};
    switch (variant) {
      case 'accent':
        return { '--hover-shadow': '0 8px 40px rgba(249, 115, 22, 0.3)' };
      default:
        return {};
    }
  };
  
  return (
    <div 
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${hoverStyles}
        ${className}
      `}
      style={getHoverShadow() as React.CSSProperties}
    >
      {title && (
        <div className="border-b border-[#333333] px-6 py-4 rounded-t-lg">
          <h3 className="text-lg font-bold tracking-tight text-[#FAFAFA]">
            {title}
          </h3>
        </div>
      )}
      <div className={noPadding ? '' : 'p-6 flex-grow'}>
        {children}
      </div>
    </div>
  );
};
