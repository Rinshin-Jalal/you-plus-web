// ============================================================================
// PILLAR PRESETS - Dynamic pillar selection system
// ============================================================================

export interface PillarPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: 'health' | 'growth' | 'relationships' | 'purpose' | 'lifestyle';
}

/**
 * Available pillar presets that users can choose from during onboarding
 */
export const PILLAR_PRESETS: PillarPreset[] = [
  // Health & Fitness
  {
    id: 'health',
    label: 'Health',
    icon: '💪',
    description: 'Physical fitness, exercise, and overall wellness',
    category: 'health',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: '🥗',
    description: 'Healthy eating habits and diet',
    category: 'health',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: '😴',
    description: 'Quality rest and sleep hygiene',
    category: 'health',
  },
  {
    id: 'mental_health',
    label: 'Mental Health',
    icon: '🧠',
    description: 'Emotional wellbeing and mental clarity',
    category: 'health',
  },
  
  // Growth & Learning
  {
    id: 'career',
    label: 'Career',
    icon: '💼',
    description: 'Professional growth and work goals',
    category: 'growth',
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: '📚',
    description: 'Education, skills, and personal development',
    category: 'growth',
  },
  {
    id: 'creativity',
    label: 'Creativity',
    icon: '🎨',
    description: 'Creative expression and artistic pursuits',
    category: 'growth',
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: '⚡',
    description: 'Focus, efficiency, and getting things done',
    category: 'growth',
  },
  
  // Relationships
  {
    id: 'relationships',
    label: 'Relationships',
    icon: '❤️',
    description: 'Family, friends, and meaningful connections',
    category: 'relationships',
  },
  {
    id: 'social',
    label: 'Social',
    icon: '👥',
    description: 'Social life and community involvement',
    category: 'relationships',
  },
  {
    id: 'parenting',
    label: 'Parenting',
    icon: '👨‍👩‍👧',
    description: 'Being a better parent',
    category: 'relationships',
  },
  
  // Purpose & Meaning
  {
    id: 'spirituality',
    label: 'Spirituality',
    icon: '🙏',
    description: 'Faith, meditation, and inner peace',
    category: 'purpose',
  },
  {
    id: 'purpose',
    label: 'Purpose',
    icon: '🎯',
    description: 'Life purpose and meaning',
    category: 'purpose',
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    icon: '✨',
    description: 'Appreciation and positive mindset',
    category: 'purpose',
  },
  
  // Lifestyle
  {
    id: 'finances',
    label: 'Finances',
    icon: '💰',
    description: 'Money management and financial goals',
    category: 'lifestyle',
  },
  {
    id: 'habits',
    label: 'Habits',
    icon: '🔄',
    description: 'Breaking bad habits or building good ones',
    category: 'lifestyle',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: '🌍',
    description: 'Travel, experiences, and stepping out of comfort zone',
    category: 'lifestyle',
  },
  {
    id: 'minimalism',
    label: 'Minimalism',
    icon: '🧘',
    description: 'Simplifying life and reducing clutter',
    category: 'lifestyle',
  },
];

/**
 * Get a pillar preset by its ID
 */
export function getPillarById(id: string): PillarPreset | undefined {
  return PILLAR_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get all presets in a specific category
 */
export function getPillarsByCategory(category: PillarPreset['category']): PillarPreset[] {
  return PILLAR_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): PillarPreset['category'][] {
  return ['health', 'growth', 'relationships', 'purpose', 'lifestyle'];
}
