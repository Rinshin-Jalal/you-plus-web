'use client';

import React from 'react';

interface MascotLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MascotLoader({ 
  message = 'Loading...', 
  size = 'md' 
}: MascotLoaderProps) {
  const sizeConfig = {
    sm: { mascot: 80, text: 'text-xs' },
    md: { mascot: 120, text: 'text-sm' },
    lg: { mascot: 160, text: 'text-base' },
  };

  const config = sizeConfig[size];
  const aspectRatio = 677 / 562;
  const height = Math.round(config.mascot * aspectRatio);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-6">
      {/* Ambient glow behind mascot */}
      <div className="absolute w-[300px] h-[300px] bg-[#F97316] blur-[120px] opacity-20 pointer-events-none" />
      
      {/* Mascot with animations */}
      <div className="relative">
        <svg 
          width={config.mascot} 
          height={height} 
          viewBox="0 0 562 677" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="mascot-bounce"
        >
          <defs>
            <style>
              {`
                @keyframes mascot-bounce {
                  0%, 100% { 
                    transform: translateY(0px) scale(1); 
                  }
                  50% { 
                    transform: translateY(-12px) scale(1.02); 
                  }
                }
                @keyframes mascot-blink {
                  0%, 85%, 100% { transform: scaleY(1); }
                  90%, 95% { transform: scaleY(0.1); }
                }
                @keyframes mascot-wiggle {
                  0%, 100% { transform: rotate(0deg); }
                  25% { transform: rotate(-3deg); }
                  75% { transform: rotate(3deg); }
                }
                .mascot-bounce { 
                  animation: mascot-bounce 1.5s ease-in-out infinite, mascot-wiggle 2s ease-in-out infinite; 
                }
                .mascot-eye { 
                  transform-origin: center; 
                  animation: mascot-blink 3s ease-in-out infinite; 
                }
                .mascot-eye-right { 
                  animation-delay: 0.15s; 
                }
              `}
            </style>
          </defs>
          
          {/* Orange organic blob body */}
          <g>
            <path 
              fill="#F2721B" 
              transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
              d="M502.802 146.638C504.445 146.489 506.092 146.379 507.741 146.308C516.742 145.987 526.109 147.596 534.866 149.639C573.408 158.632 610.909 181.765 639.42 208.714C711.782 278.313 754.144 373.391 757.5 473.736C760.565 592.154 689.223 694.303 570.106 715.036C557.341 717.258 543.65 719.187 530.707 719.493C517.498 719.422 506.57 720.081 492.929 719.217C452.081 716.799 411.84 706.222 376.84 685.309C310.417 645.618 274.541 578.313 281.517 501.017C283.084 483.651 283.818 469.951 288.296 452.546C302.934 395.642 339.124 346.114 386.262 311.562C418.409 287.689 459.715 271.231 481.612 236.594C492.607 219.202 495.383 195.911 492.144 175.782C491.255 171.27 488.778 166.93 487.844 162.462C485.34 150.476 493.351 148.413 502.802 146.638Z"
            />
            
            {/* Left eye */}
            <g className="mascot-eye">
              <path 
                fill="#111" 
                transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
                d="M469.933 378.615C505.43 374.996 511.149 436 495.945 457.292C489.517 466.295 486.331 469.687 475.28 472.446C438.649 474.295 434.325 415.232 449.364 392.704C454.863 384.466 460.285 380.801 469.933 378.615Z"
              />
            </g>
            
            {/* Right eye */}
            <g className="mascot-eye mascot-eye-right">
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
      </div>

      {/* Loading text with animated dots */}
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-bold text-xl tracking-tight text-white">
          You<span className="text-[#F97316]">+</span>
        </h1>
        <div className="flex items-center gap-1">
          <p className={`font-mono ${config.text} uppercase tracking-widest text-white/50`}>
            {message}
          </p>
          <span className="loading-dots flex gap-0.5">
            <span className="w-1 h-1 bg-[#F97316] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-[#F97316] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-[#F97316] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#FB923C] to-[#F97316] rounded-full animate-loading-bar"
          style={{
            animation: 'loading-bar 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default MascotLoader;
