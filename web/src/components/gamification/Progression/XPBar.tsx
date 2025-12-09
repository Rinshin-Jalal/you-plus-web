'use client';

import React from 'react';

interface XPBarProps {
  currentXP: number;
  xpToNext: number;
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { height: 'h-2', text: 'text-xs' },
  md: { height: 'h-3', text: 'text-sm' },
  lg: { height: 'h-4', text: 'text-base' },
};

export default function XPBar({
  currentXP,
  xpToNext,
  level,
  size = 'md',
  showLabel = true,
  className = '',
}: XPBarProps) {
  const progress = Math.min((currentXP / xpToNext) * 100, 100);
  const sizeConfig = SIZE_CLASSES[size];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className={`flex justify-between items-center mb-1 ${sizeConfig.text}`}>
          <span className="font-semibold text-orange-500">Level {level}</span>
          <span className="text-gray-600 dark:text-gray-400">
            {currentXP.toLocaleString()} / {xpToNext.toLocaleString()} XP
          </span>
        </div>
      )}

      <div
        className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeConfig.height}`}
      >
        <div
          className={`${sizeConfig.height} bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
