'use client';

import React from 'react';
import type { MascotMood } from '@/services/gamification';

interface MascotAvatarProps {
  stage: number;
  mood: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

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

export default function MascotAvatar({
  stage,
  mood,
  size = 'md',
  className = '',
  animate = true,
}: MascotAvatarProps) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS[1];
  const expression = MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS.neutral;
  const sizeConfig = SIZE_CLASSES[size];

  const animationClass = animate
    ? mood === 'sleeping'
      ? 'animate-pulse-slow'
      : mood === 'celebrating'
      ? 'animate-bounce-slow'
      : 'animate-float'
    : '';

  return (
    <div
      className={`relative flex items-center justify-center ${sizeConfig.wrapper} ${className}`}
      title={`${STAGE_NAMES[stage]} - ${mood}`}
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full blur-xl opacity-60 ${animationClass}`}
        style={{ backgroundColor: colors.glow }}
      />

      {/* Main blob SVG */}
      <svg
        viewBox="0 0 100 100"
        className={`relative z-10 ${animationClass}`}
        style={{ width: sizeConfig.blob, height: sizeConfig.blob }}
      >
        {/* Blob body */}
        <ellipse
          cx="50"
          cy="52"
          rx="42"
          ry="40"
          fill={colors.primary}
          style={{
            filter: mood === 'sleeping' ? 'saturate(0.6)' : 'none',
          }}
        />

        {/* Highlight */}
        <ellipse
          cx="35"
          cy="35"
          rx="12"
          ry="10"
          fill={colors.secondary}
          opacity="0.6"
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

        {/* Stage indicator (small flame/spark based on stage) */}
        {stage >= 3 && (
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

      {/* Sleeping Zzz */}
      {mood === 'sleeping' && (
        <div className="absolute -top-2 -right-2 text-sm font-bold text-blue-300 animate-pulse">
          zzz
        </div>
      )}
    </div>
  );
}
