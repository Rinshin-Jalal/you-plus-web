'use client';

import React, { useMemo } from 'react';
import type { MascotMood } from '@/services/gamification';

// ============================================================================
// Mascot Avatar Component
// ============================================================================
// The mascot is a mirror. It shows them what they did.
//
// When users abandon their goals:
// - Colors dim (reduced saturation)
// - Opacity fades
// - Dust particles appear (5+ days)
// - Cobwebs appear (7+ days)
//
// This creates visual shame that motivates return.
// They have to earn back their happy, vibrant mascot.
// ============================================================================

interface MascotAvatarProps {
  stage: number;
  mood: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
  daysAbsent?: number; // Days since last activity - controls abandonment visuals
}

// ============================================================================
// Constants
// ============================================================================

const STAGE_NAMES: Record<number, string> = {
  1: 'Spark',
  2: 'Ember',
  3: 'Flame',
  4: 'Blaze',
  5: 'Inferno',
};

const STAGE_COLORS: Record<number, { primary: string; secondary: string; glow: string }> = {
  1: { primary: '#FFA726', secondary: '#FFB74D', glow: 'rgba(255, 167, 38, 0.4)' },
  2: { primary: '#FF7043', secondary: '#FF8A65', glow: 'rgba(255, 112, 67, 0.4)' },
  3: { primary: '#FF5722', secondary: '#FF7043', glow: 'rgba(255, 87, 34, 0.5)' },
  4: { primary: '#E64A19', secondary: '#FF5722', glow: 'rgba(230, 74, 25, 0.5)' },
  5: { primary: '#BF360C', secondary: '#E64A19', glow: 'rgba(191, 54, 12, 0.6)' },
};

const MOOD_EXPRESSIONS: Record<MascotMood, { eyes: string; mouth: string }> = {
  celebrating: { eyes: '◠', mouth: '∀' },
  proud: { eyes: '◡', mouth: 'ᴗ' },
  happy: { eyes: '◠', mouth: '◡' },
  neutral: { eyes: '•', mouth: '—' },
  concerned: { eyes: '•', mouth: '︿' },
  sad: { eyes: '•', mouth: '︵' },
  sleeping: { eyes: '—', mouth: 'ᴖ' },
};

const SIZE_CLASSES: Record<string, { wrapper: string; blob: number }> = {
  sm: { wrapper: 'w-12 h-12', blob: 48 },
  md: { wrapper: 'w-20 h-20', blob: 80 },
  lg: { wrapper: 'w-32 h-32', blob: 128 },
  xl: { wrapper: 'w-48 h-48', blob: 192 },
};

// Abandonment thresholds
const DAYS_DUST = 5;     // Days until dust particles appear
const DAYS_COBWEBS = 7;  // Days until cobwebs appear

// ============================================================================
// Abandonment State Calculator
// ============================================================================

interface AbandonmentVisuals {
  saturation: number;   // 0.3 to 1.0 (lower = more faded/gray)
  opacity: number;      // 0.7 to 1.0 (lower = more ghostly)
  showDust: boolean;    // Dust particles visible
  showCobwebs: boolean; // Cobwebs visible
  glowOpacity: number;  // 0 to 0.6 (glow fades with absence)
}

function calculateAbandonmentVisuals(daysAbsent: number): AbandonmentVisuals {
  // Saturation decreases with absence (min 0.3)
  // Days 0-2: 1.0 (full color)
  // Days 3+: decreases by 0.1 per day, min 0.3
  const saturation = daysAbsent <= 2 
    ? 1.0 
    : Math.max(0.3, 1.0 - (daysAbsent - 2) * 0.1);
  
  // Opacity decreases at 5+ days (min 0.7)
  const opacity = daysAbsent >= 5 ? 0.7 : 1.0;
  
  // Glow fades with absence
  const glowOpacity = daysAbsent <= 2 
    ? 0.6 
    : Math.max(0.1, 0.6 - (daysAbsent - 2) * 0.1);
  
  return {
    saturation,
    opacity,
    showDust: daysAbsent >= DAYS_DUST,
    showCobwebs: daysAbsent >= DAYS_COBWEBS,
    glowOpacity,
  };
}

// ============================================================================
// Dust Particle Component
// ============================================================================

function DustParticles({ size }: { size: 'sm' | 'md' | 'lg' | 'xl' }) {
  const positions = useMemo(() => [
    { left: '15%', top: '20%', delay: '0s' },
    { left: '75%', top: '25%', delay: '0.5s' },
    { left: '25%', top: '70%', delay: '1s' },
    { left: '80%', top: '65%', delay: '1.5s' },
    { left: '50%', top: '15%', delay: '2s' },
    { left: '60%', top: '80%', delay: '0.3s' },
  ], []);

  const particleSize = size === 'sm' ? 'text-[6px]' : size === 'md' ? 'text-[8px]' : 'text-xs';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {positions.map((pos, i) => (
        <div
          key={i}
          className={`absolute ${particleSize} text-gray-400 animate-pulse`}
          style={{
            left: pos.left,
            top: pos.top,
            animationDelay: pos.delay,
            animationDuration: '3s',
          }}
        >
          ✧
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Cobweb Component
// ============================================================================

function Cobwebs({ size }: { size: 'sm' | 'md' | 'lg' | 'xl' }) {
  const webSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';
  
  return (
    <>
      {/* Top-right cobweb */}
      <div 
        className={`absolute -top-1 -right-1 ${webSize} text-gray-400 opacity-70`}
        style={{ transform: 'rotate(15deg)' }}
      >
        🕸️
      </div>
      {/* Bottom-left cobweb (only for larger sizes) */}
      {(size === 'lg' || size === 'xl') && (
        <div 
          className={`absolute -bottom-1 -left-1 ${webSize} text-gray-400 opacity-50`}
          style={{ transform: 'rotate(-30deg) scale(0.8)' }}
        >
          🕸️
        </div>
      )}
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MascotAvatar({
  stage,
  mood,
  size = 'md',
  className = '',
  animate = true,
  daysAbsent = 0,
}: MascotAvatarProps) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS[1];
  const expression = MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS.neutral;
  const sizeConfig = SIZE_CLASSES[size];

  // Calculate abandonment visuals
  const abandonment = useMemo(
    () => calculateAbandonmentVisuals(daysAbsent),
    [daysAbsent]
  );

  // Animation class based on mood
  const animationClass = animate
    ? mood === 'sleeping'
      ? 'animate-pulse-slow'
      : mood === 'celebrating'
      ? 'animate-bounce-slow'
      : mood === 'sad' || mood === 'concerned'
      ? '' // No animation when sad/concerned - mascot is still
      : 'animate-float'
    : '';

  // Build filter string for abandonment effects
  const abandonmentFilter = useMemo(() => {
    const filters: string[] = [];
    
    if (abandonment.saturation < 1) {
      filters.push(`saturate(${abandonment.saturation})`);
    }
    
    if (mood === 'sleeping') {
      filters.push('saturate(0.4)'); // Even more desaturated when sleeping
      filters.push('brightness(0.8)');
    }
    
    return filters.length > 0 ? filters.join(' ') : 'none';
  }, [abandonment.saturation, mood]);

  return (
    <div
      className={`relative flex items-center justify-center ${sizeConfig.wrapper} ${className}`}
      title={`${STAGE_NAMES[stage]} - ${mood}${daysAbsent > 0 ? ` (${daysAbsent} days absent)` : ''}`}
      style={{ opacity: abandonment.opacity }}
    >
      {/* Glow effect - fades with absence */}
      <div
        className={`absolute inset-0 rounded-full blur-xl ${animationClass}`}
        style={{ 
          backgroundColor: colors.glow,
          opacity: abandonment.glowOpacity,
        }}
      />

      {/* Main blob SVG */}
      <svg
        viewBox="0 0 100 100"
        className={`relative z-10 ${animationClass}`}
        style={{ 
          width: sizeConfig.blob, 
          height: sizeConfig.blob,
          filter: abandonmentFilter,
        }}
      >
        {/* Blob body */}
        <ellipse
          cx="50"
          cy="52"
          rx="42"
          ry="40"
          fill={colors.primary}
        />

        {/* Highlight - dims with abandonment */}
        <ellipse
          cx="35"
          cy="35"
          rx="12"
          ry="10"
          fill={colors.secondary}
          opacity={0.6 * abandonment.saturation}
        />

        {/* Eyes */}
        <text
          x="38"
          y="52"
          fontSize="12"
          fill="white"
          textAnchor="middle"
          fontWeight="bold"
        >
          {expression.eyes}
        </text>
        <text
          x="62"
          y="52"
          fontSize="12"
          fill="white"
          textAnchor="middle"
          fontWeight="bold"
        >
          {expression.eyes}
        </text>

        {/* Mouth */}
        <text
          x="50"
          y="68"
          fontSize="14"
          fill="white"
          textAnchor="middle"
          fontWeight="bold"
        >
          {expression.mouth}
        </text>

        {/* Stage indicator (small flame/spark based on stage) - hidden when abandoned */}
        {stage >= 3 && daysAbsent < 3 && (
          <ellipse
            cx="50"
            cy="15"
            rx="8"
            ry="6"
            fill="#FFD700"
            opacity="0.8"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Celebration particles */}
      {mood === 'celebrating' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA'][i % 4],
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 30}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>
      )}

      {/* Sleeping indicator - changes based on abandonment */}
      {mood === 'sleeping' && (
        <div className="absolute -top-2 -right-2 text-sm font-bold text-gray-400 animate-pulse">
          {daysAbsent >= DAYS_COBWEBS ? '...' : 'zzz'}
        </div>
      )}

      {/* Abandonment visuals: Dust particles (5+ days) */}
      {abandonment.showDust && <DustParticles size={size} />}

      {/* Abandonment visuals: Cobwebs (7+ days) */}
      {abandonment.showCobwebs && <Cobwebs size={size} />}

      {/* Sad tear (only when sad mood) */}
      {mood === 'sad' && (
        <div 
          className="absolute text-xs animate-pulse"
          style={{
            left: '60%',
            top: '45%',
          }}
        >
          💧
        </div>
      )}
    </div>
  );
}
