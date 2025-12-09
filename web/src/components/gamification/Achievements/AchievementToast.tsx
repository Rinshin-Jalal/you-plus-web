'use client';

import React from 'react';
import type { AchievementRarity } from '@/services/gamification';

interface AchievementToastProps {
  name: string;
  description: string;
  xpReward: number;
  rarity: AchievementRarity;
  onClose: () => void;
  onAnimationEnd?: () => void;
}

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: 'from-gray-600 to-gray-800',
  rare: 'from-blue-500 to-blue-700',
  epic: 'from-purple-500 to-purple-700',
  legendary: 'from-yellow-400 to-orange-500',
};

export default function AchievementToast({
  name,
  description,
  xpReward,
  rarity,
  onClose,
  onAnimationEnd,
}: AchievementToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
      onAnimationEnd?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose, onAnimationEnd]);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        max-w-sm w-full
        bg-gradient-to-r ${RARITY_COLORS[rarity]}
        rounded-xl shadow-2xl
        p-4
        animate-slide-in-right
        cursor-pointer
      `}
      onClick={onClose}
    >
      <div className="flex items-center gap-3">
        {/* Trophy icon */}
        <div className="text-3xl">
          {rarity === 'legendary' ? '🏆' : rarity === 'epic' ? '🎖️' : rarity === 'rare' ? '🎗️' : '🎯'}
        </div>

        <div className="flex-1">
          <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">
            Achievement Unlocked!
          </div>
          <div className="font-bold text-white text-lg">
            {name}
          </div>
          <div className="text-sm text-white/80">
            {description}
          </div>
          <div className="text-sm font-semibold text-yellow-200 mt-1">
            +{xpReward} XP
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
