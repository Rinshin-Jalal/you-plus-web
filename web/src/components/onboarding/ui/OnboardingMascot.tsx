'use client';

import React, { useMemo } from 'react';

// ============================================================================
// Onboarding Mascot Component
// ============================================================================
// The mascot is your future self speaking to you.
// It reacts to what you're doing in onboarding:
// - Listening when you're typing/selecting
// - Speaking during commentary
// - Encouraging during voice recording
// - Celebrating on progress
// ============================================================================

export type MascotExpression = 
  | 'speaking'     // During commentary - animated mouth
  | 'listening'    // During input - attentive, slightly leaning
  | 'thinking'     // During choice selection - contemplative
  | 'encouraging'  // During voice recording - supportive
  | 'proud'        // After completing sections - happy/proud
  | 'serious'      // During heavy questions (fears, dark future)
  | 'neutral'      // Default state
  | 'winking';     // Playful moments

export type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface OnboardingMascotProps {
  expression?: MascotExpression;
  size?: MascotSize;
  className?: string;
  animate?: boolean;
  speaking?: boolean; // If true, shows speech animation
}

// Size configurations
const SIZE_MAP: Record<MascotSize, number> = {
  xs: 32,
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
};

// Expression-based eye/mouth configurations
const EXPRESSIONS: Record<MascotExpression, { 
  leftEye: string; 
  rightEye: string; 
  mouthPath: string;
  mouthAnimation?: string;
}> = {
  speaking: {
    leftEye: 'M469.933 378.615C505.43 374.996 511.149 436 495.945 457.292C489.517 466.295 486.331 469.687 475.28 472.446C438.649 474.295 434.325 415.232 449.364 392.704C454.863 384.466 460.285 380.801 469.933 378.615Z',
    rightEye: 'M620.035 378.148C626.482 378.296 630.976 379.508 636.384 383.44C660.819 401.208 659.024 468.491 623.675 472.63C618.016 472.495 612.524 470.688 607.889 467.438C581.548 449.016 583.612 384.405 620.035 378.148Z',
    mouthPath: 'M517 505C550 505 580 510 585 525C575 545 545 540 517 535C489 530 509 505 517 505Z',
    mouthAnimation: 'mascot-speak',
  },
  listening: {
    leftEye: 'M469.933 378.615C505.43 374.996 511.149 436 495.945 457.292C489.517 466.295 486.331 469.687 475.28 472.446C438.649 474.295 434.325 415.232 449.364 392.704C454.863 384.466 460.285 380.801 469.933 378.615Z',
    rightEye: 'M620.035 378.148C626.482 378.296 630.976 379.508 636.384 383.44C660.819 401.208 659.024 468.491 623.675 472.63C618.016 472.495 612.524 470.688 607.889 467.438C581.548 449.016 583.612 384.405 620.035 378.148Z',
    mouthPath: 'M500 520Q545 510 590 520Q545 530 500 520Z', // Slight smile, attentive
  },
  thinking: {
    leftEye: 'M475 390C495 388 505 420 495 445C488 455 478 460 468 458C450 455 448 405 460 390C465 385 470 385 475 390Z',
    rightEye: 'M615 390C625 390 632 395 638 405C655 425 650 465 625 468C612 468 600 455 595 440C585 410 600 388 615 390Z',
    mouthPath: 'M520 515Q545 505 570 515Q545 520 520 515Z', // Hmm face
  },
  encouraging: {
    leftEye: 'M465 385C500 380 510 430 495 455C485 468 475 472 465 470C435 468 430 410 450 390C455 385 460 383 465 385Z',
    rightEye: 'M622 382C628 382 635 385 642 395C665 420 658 470 625 472C612 470 600 458 595 440C582 405 600 380 622 382Z',
    mouthPath: 'M500 500C520 495 560 495 580 500C595 530 560 550 540 545C520 540 505 530 500 500Z', // Big encouraging smile
  },
  proud: {
    leftEye: 'M470 395C485 390 498 405 495 430C492 450 480 465 465 462C445 458 445 420 455 400C460 393 465 392 470 395Z',
    rightEye: 'M618 395C628 395 638 405 642 425C648 455 635 470 618 468C600 465 592 440 598 415C602 400 610 393 618 395Z',
    mouthPath: 'M495 495C525 485 565 485 595 495C600 535 555 560 545 555C530 548 510 540 495 495Z', // Wide proud smile
  },
  serious: {
    leftEye: 'M472 395C495 392 505 425 498 448C492 460 482 465 472 463C452 458 450 415 462 398C466 393 469 392 472 395Z',
    rightEye: 'M618 395C626 395 633 400 638 412C655 440 648 468 625 470C612 468 602 452 598 432C590 405 605 392 618 395Z',
    mouthPath: 'M510 520Q545 525 580 520', // Straight line, serious
  },
  neutral: {
    leftEye: 'M469.933 378.615C505.43 374.996 511.149 436 495.945 457.292C489.517 466.295 486.331 469.687 475.28 472.446C438.649 474.295 434.325 415.232 449.364 392.704C454.863 384.466 460.285 380.801 469.933 378.615Z',
    rightEye: 'M620.035 378.148C626.482 378.296 630.976 379.508 636.384 383.44C660.819 401.208 659.024 468.491 623.675 472.63C618.016 472.495 612.524 470.688 607.889 467.438C581.548 449.016 583.612 384.405 620.035 378.148Z',
    mouthPath: 'M517.004 505.027C538.873 504.243 563.397 506.276 585.111 509.275C596.265 510.815 598.628 526.67 585.847 533.548C578.548 534.866 554.728 532.145 545.888 531.83C536.383 531.031 526.229 531.768 516.883 529.937C510.464 528.679 507.38 519.126 509.346 513.516C511.312 507.906 510.519 505.277 517.004 505.027Z',
  },
  winking: {
    leftEye: 'M470 420Q480 415 490 420Q480 430 470 420Z', // Winking (closed)
    rightEye: 'M620.035 378.148C626.482 378.296 630.976 379.508 636.384 383.44C660.819 401.208 659.024 468.491 623.675 472.63C618.016 472.495 612.524 470.688 607.889 467.438C581.548 449.016 583.612 384.405 620.035 378.148Z',
    mouthPath: 'M500 500C520 495 560 495 580 500C595 530 560 550 540 545C520 540 505 530 500 500Z',
  },
};

export function OnboardingMascot({ 
  expression = 'neutral',
  size = 'md',
  className = '',
  animate = true,
  speaking = false,
}: OnboardingMascotProps) {
  const pixelSize = SIZE_MAP[size];
  const aspectRatio = 677 / 562;
  const height = Math.round(pixelSize * aspectRatio);
  
  const expr = EXPRESSIONS[speaking ? 'speaking' : expression];
  
  // Animation class based on expression
  const bodyAnimation = useMemo(() => {
    if (!animate) return '';
    switch (expression) {
      case 'speaking': return 'mascot-bounce';
      case 'encouraging': return 'mascot-bounce';
      case 'proud': return 'mascot-celebrate';
      case 'listening': return 'mascot-lean';
      case 'thinking': return 'mascot-think';
      default: return 'mascot-float';
    }
  }, [expression, animate]);

  return (
    <div className={`relative inline-block ${className}`}>
      <style>
        {`
          @keyframes mascot-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          @keyframes mascot-bounce {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-6px) scale(1.02); }
          }
          @keyframes mascot-celebrate {
            0%, 100% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(-3deg) scale(1.05); }
            75% { transform: rotate(3deg) scale(1.05); }
          }
          @keyframes mascot-lean {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(2deg); }
          }
          @keyframes mascot-think {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-2px); }
          }
          @keyframes mascot-speak {
            0%, 100% { transform: scaleY(1); }
            25% { transform: scaleY(1.15); }
            50% { transform: scaleY(0.9); }
            75% { transform: scaleY(1.1); }
          }
          @keyframes mascot-blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
          .mascot-float { animation: mascot-float 3s ease-in-out infinite; }
          .mascot-bounce { animation: mascot-bounce 0.8s ease-in-out infinite; }
          .mascot-celebrate { animation: mascot-celebrate 0.6s ease-in-out infinite; }
          .mascot-lean { animation: mascot-lean 2s ease-in-out infinite; }
          .mascot-think { animation: mascot-think 2s ease-in-out infinite; }
          .mascot-speak { animation: mascot-speak 0.3s ease-in-out infinite; transform-origin: center; }
          .mascot-blink { animation: mascot-blink 4s ease-in-out infinite; transform-origin: center; }
        `}
      </style>
      
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-40"
        style={{ 
          backgroundColor: '#F97316',
          transform: 'scale(0.8)',
        }}
      />
      
      <svg 
        width={pixelSize} 
        height={height} 
        viewBox="0 0 562 677" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 ${bodyAnimation}`}
      >
        {/* Orange organic blob body */}
        <g>
          <path 
            fill="#F2721B" 
            transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
            d="M502.802 146.638C504.445 146.489 506.092 146.379 507.741 146.308C516.742 145.987 526.109 147.596 534.866 149.639C573.408 158.632 610.909 181.765 639.42 208.714C711.782 278.313 754.144 373.391 757.5 473.736C760.565 592.154 689.223 694.303 570.106 715.036C557.341 717.258 543.65 719.187 530.707 719.493C517.498 719.422 506.57 720.081 492.929 719.217C452.081 716.799 411.84 706.222 376.84 685.309C310.417 645.618 274.541 578.313 281.517 501.017C283.084 483.651 283.818 469.951 288.296 452.546C302.934 395.642 339.124 346.114 386.262 311.562C418.409 287.689 459.715 271.231 481.612 236.594C492.607 219.202 495.383 195.911 492.144 175.782C491.255 171.27 488.778 166.93 487.844 162.462C485.34 150.476 493.351 148.413 502.802 146.638Z"
          />
          
          {/* Left eye */}
          <g className={animate && expression !== 'winking' ? 'mascot-blink' : ''}>
            <path 
              fill="#111" 
              transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
              d={expr.leftEye}
            />
          </g>
          
          {/* Right eye */}
          <g className={animate ? 'mascot-blink' : ''} style={{ animationDelay: '0.1s' }}>
            <path 
              fill="#111" 
              transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
              d={expr.rightEye}
            />
          </g>
          
          {/* Mouth */}
          <g className={expr.mouthAnimation || ''}>
            <path 
              fill="#111" 
              transform="matrix(1.03309 0 0 1.03359 -257.239 -111.627)" 
              d={expr.mouthPath}
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

// Helper to determine expression based on step type
export function getExpressionForStep(
  stepType: string, 
  isRecording: boolean = false
): MascotExpression {
  if (isRecording) return 'encouraging';
  
  switch (stepType) {
    case 'commentary':
      return 'speaking';
    case 'input':
      return 'listening';
    case 'choice':
      return 'thinking';
    case 'slider':
      return 'listening';
    case 'voice':
      return 'encouraging';
    case 'time':
      return 'listening';
    case 'pillar_selection':
      return 'thinking';
    case 'pillar_primary':
      return 'serious';
    case 'pillar_questions':
      return 'listening';
    case 'card':
      return 'proud';
    case 'auth':
      return 'encouraging';
    default:
      return 'neutral';
  }
}

// Helper for heavy/emotional steps
export function getExpressionForContent(stepId: string | number): MascotExpression | null {
  const heavySteps = [18, 19, 20]; // hidden_fear, dark_future, dark_future_recording
  const celebrationSteps = [30, 31]; // commitment card, auth
  
  if (typeof stepId === 'number') {
    if (heavySteps.includes(stepId)) return 'serious';
    if (celebrationSteps.includes(stepId)) return 'proud';
  }
  
  return null;
}

export default OnboardingMascot;
