'use client';

import React from 'react';
import type { AchievementRarity, AchievementCategory } from '@/services/gamification';

interface AchievementCardProps {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  xpReward: number;
  rarity: AchievementRarity;
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt: string | null;
  onClick?: () => void;
  className?: string;
}

const RARITY_STYLES: Record<AchievementRarity, { bg: string; border: string; glow: string }> = {
  common: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    glow: '',
  },
  rare: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-500',
    glow: 'shadow-blue-200 dark:shadow-blue-800',
  },
  epic: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-400 dark:border-purple-500',
    glow: 'shadow-purple-200 dark:shadow-purple-800',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30',
    border: 'border-yellow-400 dark:border-yellow-500',
    glow: 'shadow-lg shadow-yellow-200 dark:shadow-yellow-800',
  },
};

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  streaks: '🔥',
  calls: '📞',
  pillars: '🏛️',
  trust: '🤝',
  levels: '⭐',
  special: '✨',
};

export default function AchievementCard({
  name,
  description,
  icon,
  xpReward,
  rarity,
  category,
  unlocked,
  unlockedAt,
  onClick,
  className = '',
}: AchievementCardProps) {
  const styles = RARITY_STYLES[rarity];
  const categoryIcon = CATEGORY_ICONS[category];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        relative w-full p-4 rounded-xl border-2 transition-all duration-200
        ${styles.bg} ${styles.border} ${unlocked ? styles.glow : ''}
        ${onClick ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'}
        ${!unlocked ? 'opacity-50 grayscale' : ''}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-3xl flex-shrink-0">
          {icon || categoryIcon}
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {name}
            </h3>
            {!unlocked && (
              <span className="text-xs text-gray-500">🔒</span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {description}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-semibold text-orange-500">
              +{xpReward} XP
            </span>
            <span className={`text-xs font-semibold capitalize ${
              rarity === 'legendary' ? 'text-yellow-500' :
              rarity === 'epic' ? 'text-purple-500' :
              rarity === 'rare' ? 'text-blue-500' :
              'text-gray-500'
            }`}>
              {rarity}
            </span>
            {unlocked && unlockedAt && (
              <span className="text-xs text-gray-400">
                {new Date(unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unlocked checkmark */}
      {unlocked && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </button>
  );
}
