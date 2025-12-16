/**
 * Preset Voices for Future Self
 * 
 * Curated selection of Cartesia voices for users who prefer not to clone their own voice.
 * These voices are selected for their motivational, mentor-like qualities.
 */

export interface PresetVoice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  vibe: string; // Short descriptor for UI
}

/**
 * Curated preset voices from Cartesia's public voice library.
 * Selected for coaching/mentor-like qualities that fit the Future Self concept.
 * 
 * Voice IDs sourced from Cartesia's public voice library.
 */
export const PRESET_VOICES: PresetVoice[] = [
  {
    id: "a0e99841-438c-4a64-b679-ae501e7d6091",
    name: "Marcus",
    description: "Calm and confident. Like a wise mentor who's seen it all.",
    gender: "male",
    vibe: "Wise Mentor",
  },
  {
    id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    name: "Sarah",
    description: "Warm and encouraging. The supportive coach in your corner.",
    gender: "female",
    vibe: "Supportive Coach",
  },
  {
    id: "98a34ef2-2140-4c28-9c71-663dc4dd7022",
    name: "Alex",
    description: "Direct and intense. No-nonsense accountability partner.",
    gender: "male",
    vibe: "Drill Sergeant",
  },
  {
    id: "41534e16-2966-4c6b-9670-111411def906",
    name: "Maya",
    description: "Fierce and motivating. The warrior who pushes you forward.",
    gender: "female",
    vibe: "Fierce Warrior",
  },
  {
    id: "bf991597-6c13-47e4-8411-91ec2de5c466",
    name: "Jordan",
    description: "Thoughtful and measured. The philosopher who sees the bigger picture.",
    gender: "neutral",
    vibe: "Wise Guide",
  },
  {
    id: "f9836c6e-a0bd-460e-9d3c-f7299fa60f94",
    name: "Chris",
    description: "Energetic and upbeat. High-energy motivation when you need it.",
    gender: "male",
    vibe: "Energy Coach",
  },
];

/**
 * Default voice ID used when voice cloning fails or no preference is set.
 * This should match one of the PRESET_VOICES.
 */
export const DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091";

/**
 * Get a preset voice by ID
 */
export function getPresetVoice(id: string): PresetVoice | undefined {
  return PRESET_VOICES.find(v => v.id === id);
}

/**
 * Check if a voice ID is a preset voice
 */
export function isPresetVoice(id: string): boolean {
  return PRESET_VOICES.some(v => v.id === id);
}
