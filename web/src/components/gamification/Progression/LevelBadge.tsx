'use client';

import React from 'react';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
};

const LEVEL_COLORS = {
  bronze: { bg: 'from-amber-600 to-amber-800', text: 'text-amber-100' },    // 1-24
  silver: { bg: 'from-slate-400 to-slate-600', text: 'text-slate-100' },    // 25-49
  gold: { bg: 'from-yellow-400 to-yellow-600', text: 'text-yellow-900' },   // 50-74
  platinum: { bg: 'from-cyan-300 to-cyan-500', text: 'text-cyan-900' },     // 75-99
  diamond: { bg: 'from-purple-400 to-pink-500', text: 'text-white' },       // 100
};

function getLevelTier(level: number) {
  if (level >= 100) return LEVEL_COLORS.diamond;
  if (level >= 75) return LEVEL_COLORS.platinum;
  if (level >= 50) return LEVEL_COLORS.gold;
  if (level >= 25) return LEVEL_COLORS.silver;
  return LEVEL_COLORS.bronze;
}

export default function LevelBadge({
  level,
  size = 'md',
  className = '',
}: LevelBadgeProps) {
  const tier = getLevelTier(level);

  return (
    <div
      className={`
        ${SIZE_CLASSES[size]}
        ${className}
        relative rounded-full bg-gradient-to-br ${tier.bg}
        flex items-center justify-center
        font-bold ${tier.text}
        shadow-lg
        ring-2 ring-white/20
      `}
    >
      {level}

      {/* Glow effect for high levels */}
      {level >= 50 && (
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${tier.bg} blur-md opacity-50 -z-10`}
        />
      )}

      {/* Crown for max level */}
      {level >= 100 && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-400">
          <span role="img" aria-label="crown">
            👑
          </span>
        </div>
      )}
    </div>
  );
}
