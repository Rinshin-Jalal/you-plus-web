'use client';

import React from 'react';

interface StreakDisplayProps {
  streakDays: number;
  multiplier: number;
  shields: number;
  className?: string;
}

const MULTIPLIER_COLORS: Record<string, string> = {
  '1': 'text-gray-500',
  '1.1': 'text-green-500',
  '1.25': 'text-blue-500',
  '1.5': 'text-purple-500',
  '2': 'text-orange-500',
};

export default function StreakDisplay({
  streakDays,
  multiplier,
  shields,
  className = '',
}: StreakDisplayProps) {
  const multiplierKey = multiplier.toString();
  const multiplierColor = MULTIPLIER_COLORS[multiplierKey] || MULTIPLIER_COLORS['1'];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Streak counter */}
      <div className="flex items-center gap-1.5">
        <span className="text-2xl" role="img" aria-label="fire">
          🔥
        </span>
        <span className="font-bold text-lg">{streakDays}</span>
        <span className="text-gray-500 text-sm">days</span>
      </div>

      {/* Multiplier */}
      <div className={`font-semibold ${multiplierColor}`}>
        {multiplier.toFixed(2)}x
      </div>

      {/* Shields */}
      {shields > 0 && (
        <div className="flex items-center gap-1 ml-2" title={`${shields} streak shield${shields > 1 ? 's' : ''}`}>
          {[...Array(shields)].map((_, i) => (
            <span key={i} className="text-lg" role="img" aria-label="shield">
              🛡️
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
