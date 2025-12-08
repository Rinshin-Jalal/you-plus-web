'use client';

import React from 'react';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface WitnessLogoProps {
  size?: LogoSize;
  className?: string;
  showWordmark?: boolean;
  animate?: boolean;
}

const sizeMap: Record<LogoSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
  '2xl': 96,
};

const wordmarkSizeMap: Record<LogoSize, string> = {
  xs: 'text-sm',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
};

export function WitnessLogo({ 
  size = 'md', 
  className = '',
  showWordmark = false,
  animate = true
}: WitnessLogoProps) {
  const pixelSize = sizeMap[size];
  // Maintain aspect ratio from original (562x677)
  const aspectRatio = 677 / 562;
  const height = Math.round(pixelSize * aspectRatio);
  
  const LogoSvg = () => (
    <svg 
      width={pixelSize} 
      height={height} 
      viewBox="0 0 562 677" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={animate ? 'animate-witness-float' : ''}
    >
      <defs>
        <style>
          {`
            @keyframes witness-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-4px); }
            }
            @keyframes witness-blink {
              0%, 90%, 100% { transform: scaleY(1); }
              95% { transform: scaleY(0.1); }
            }
            @keyframes witness-glow {
              0%, 100% { filter: drop-shadow(0 0 8px rgba(242, 114, 27, 0.3)); }
              50% { filter: drop-shadow(0 0 16px rgba(242, 114, 27, 0.5)); }
            }
            .witness-logo { animation: witness-float 3s ease-in-out infinite, witness-glow 4s ease-in-out infinite; }
            .witness-eye { transform-origin: center; animation: witness-blink 4s ease-in-out infinite; }
            .witness-eye-right { animation-delay: 0.1s; }
          `}
        </style>
      </defs>
      
      {/* Orange organic blob body - NO background */}
      <g className={animate ? 'witness-logo' : ''}>
        <path 
          fill="#F2721B" 
          transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
          d="M502.802 146.638C504.445 146.489 506.092 146.379 507.741 146.308C516.742 145.987 526.109 147.596 534.866 149.639C573.408 158.632 610.909 181.765 639.42 208.714C711.782 278.313 754.144 373.391 757.5 473.736C760.565 592.154 689.223 694.303 570.106 715.036C557.341 717.258 543.65 719.187 530.707 719.493C517.498 719.422 506.57 720.081 492.929 719.217C452.081 716.799 411.84 706.222 376.84 685.309C310.417 645.618 274.541 578.313 281.517 501.017C283.084 483.651 283.818 469.951 288.296 452.546C302.934 395.642 339.124 346.114 386.262 311.562C418.409 287.689 459.715 271.231 481.612 236.594C492.607 219.202 495.383 195.911 492.144 175.782C491.255 171.27 488.778 166.93 487.844 162.462C485.34 150.476 493.351 148.413 502.802 146.638Z"
        />
        
        {/* Left eye */}
        <g className={animate ? 'witness-eye' : ''}>
          <path 
            fill="#111" 
            transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
            d="M469.933 378.615C505.43 374.996 511.149 436 495.945 457.292C489.517 466.295 486.331 469.687 475.28 472.446C438.649 474.295 434.325 415.232 449.364 392.704C454.863 384.466 460.285 380.801 469.933 378.615Z"
          />
        </g>
        
        {/* Right eye */}
        <g className={animate ? 'witness-eye witness-eye-right' : ''}>
          <path 
            fill="#111" 
            transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
            d="M620.035 378.148C626.482 378.296 630.976 379.508 636.384 383.44C660.819 401.208 659.024 468.491 623.675 472.63C618.016 472.495 612.524 470.688 607.889 467.438C581.548 449.016 583.612 384.405 620.035 378.148Z"
          />
        </g>
        
        {/* Mouth/smile */}
        <path 
          fill="#111" 
          transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
          d="M517.004 505.027C538.873 504.243 563.397 506.276 585.111 509.275C596.265 510.815 598.628 526.67 585.847 533.548C578.548 534.866 554.728 532.145 545.888 531.83C536.383 531.031 526.229 531.768 516.883 529.937C510.464 528.679 507.38 519.126 509.346 513.516C511.312 507.906 510.519 505.277 517.004 505.027Z"
        />
      </g>
    </svg>
  );

  if (showWordmark) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <LogoSvg />
        <span className={`font-black tracking-tighter ${wordmarkSizeMap[size]}`}>
          YOU<span className="text-[#F2721B]">+</span>
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <LogoSvg />
    </div>
  );
}

// Static icon version (no animation) for favicon/app icon use
export function WitnessIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  const aspectRatio = 677 / 562;
  const height = Math.round(size * aspectRatio);
  
  return (
    <svg 
      width={size} 
      height={height} 
      viewBox="0 0 562 677" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Orange organic blob body */}
      <path 
        fill="#F2721B" 
        transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
        d="M502.802 146.638C504.445 146.489 506.092 146.379 507.741 146.308C516.742 145.987 526.109 147.596 534.866 149.639C573.408 158.632 610.909 181.765 639.42 208.714C711.782 278.313 754.144 373.391 757.5 473.736C760.565 592.154 689.223 694.303 570.106 715.036C557.341 717.258 543.65 719.187 530.707 719.493C517.498 719.422 506.57 720.081 492.929 719.217C452.081 716.799 411.84 706.222 376.84 685.309C310.417 645.618 274.541 578.313 281.517 501.017C283.084 483.651 283.818 469.951 288.296 452.546C302.934 395.642 339.124 346.114 386.262 311.562C418.409 287.689 459.715 271.231 481.612 236.594C492.607 219.202 495.383 195.911 492.144 175.782C491.255 171.27 488.778 166.93 487.844 162.462C485.34 150.476 493.351 148.413 502.802 146.638Z"
      />
      
      {/* Left eye */}
      <path 
        fill="#111" 
        transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
        d="M469.933 378.615C505.43 374.996 511.149 436 495.945 457.292C489.517 466.295 486.331 469.687 475.28 472.446C438.649 474.295 434.325 415.232 449.364 392.704C454.863 384.466 460.285 380.801 469.933 378.615Z"
      />
      
      {/* Right eye */}
      <path 
        fill="#111" 
        transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
        d="M620.035 378.148C626.482 378.296 630.976 379.508 636.384 383.44C660.819 401.208 659.024 468.491 623.675 472.63C618.016 472.495 612.524 470.688 607.889 467.438C581.548 449.016 583.612 384.405 620.035 378.148Z"
      />
      
      {/* Mouth */}
      <path 
        fill="#111" 
        transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
        d="M517.004 505.027C538.873 504.243 563.397 506.276 585.111 509.275C596.265 510.815 598.628 526.67 585.847 533.548C578.548 534.866 554.728 532.145 545.888 531.83C536.383 531.031 526.229 531.768 516.883 529.937C510.464 528.679 507.38 519.126 509.346 513.516C511.312 507.906 510.519 505.277 517.004 505.027Z"
      />
    </svg>
  );
}

export default WitnessLogo;
