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
  const variants = {
    default: `
      bg-[var(--gradient-card)] 
      border-2 border-[var(--border-accent)]
      shadow-[6px_6px_0px_0px_var(--accent-primary)]
    `,
    elevated: `
      bg-[var(--gradient-card-elevated)]
      border-2 border-[var(--border-default)]
      shadow-[4px_4px_0px_0px_rgba(249,115,22,0.3)]
    `,
    accent: `
      bg-[var(--gradient-card-accent)]
      border-2 border-[var(--accent-primary)]
      shadow-[6px_6px_0px_0px_var(--accent-primary)]
    `,
    glass: `
      bg-[var(--gradient-card-glass)]
      border border-white/10
      backdrop-blur-md
    `,
  };

  const hoverStyles = noHover 
    ? '' 
    : 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_var(--accent-primary)] transition-all duration-200';

  // Use inline styles for gradients since Tailwind can't process CSS variables in bg-[]
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'default':
        return { background: 'linear-gradient(135deg, rgba(26, 26, 26, 1) 0%, rgba(20, 20, 20, 1) 100%)' };
      case 'elevated':
        return { background: 'linear-gradient(145deg, rgba(38, 38, 38, 1) 0%, rgba(26, 26, 26, 1) 100%)' };
      case 'accent':
        return { background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)' };
      case 'glass':
        return { background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)' };
      default:
        return {};
    }
  };

  const getBorderClass = () => {
    switch (variant) {
      case 'default':
      case 'accent':
        return 'border-2 border-[#F97316]';
      case 'elevated':
        return 'border-2 border-[#333333]';
      case 'glass':
        return 'border border-white/10';
      default:
        return 'border-2 border-[#F97316]';
    }
  };

  const getShadowClass = () => {
    switch (variant) {
      case 'default':
      case 'accent':
        return 'shadow-[6px_6px_0px_0px_#F97316]';
      case 'elevated':
        return 'shadow-[4px_4px_0px_0px_rgba(249,115,22,0.3)]';
      case 'glass':
        return '';
      default:
        return 'shadow-[6px_6px_0px_0px_#F97316]';
    }
  };
  
  return (
    <div 
      className={`
        ${getBorderClass()}
        ${getShadowClass()}
        ${hoverStyles}
        flex flex-col h-full
        ${className}
      `}
      style={getBackgroundStyle()}
    >
      {title && (
        <div className="border-b-2 border-[#333333] p-4 bg-[#1A1A1A]">
          <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-[#FAFAFA]">
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
