/**
 * Type definitions for onboarding processing
 */

export interface OnboardingPayload {
  jobId: string;
  userId: string;
  
  // Core identity
  name?: string;
  core_identity: string;
  primary_pillar?: string;
  dark_future?: string;
  
  // Patterns
  quit_pattern?: string;
  favorite_excuse?: string;
  who_disappointed?: string[];
  
  // Dynamic pillars
  selected_pillars: string[];
  
  // Voice recordings (base64)
  future_self_intro_recording: string;
  why_recording: string;
  pledge_recording: string;
  merged_voice_recording?: string;
  
  // Settings
  call_time?: string;
  timezone?: string;
  
  // Dynamic pillar data (keyed by pillar ID)
  [key: string]: unknown;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface VoiceCloneResult {
  success: boolean;
  voiceId?: string;
  error?: string;
}

export interface ScheduleConfig {
  userId: string;
  callTime: string; // HH:MM format
  timezone: string;
  phoneNumber: string;
  userName?: string;
}
