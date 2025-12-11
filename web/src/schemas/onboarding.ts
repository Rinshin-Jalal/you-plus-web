import { z } from 'zod';

// Audio constraints for voice recordings
// - Minimum: 10KB (~1 second of audio) to ensure valid recording
// - Maximum: 10MB to prevent memory issues and excessive upload times
// - Allowed types: audio/webm, audio/wav, audio/mp3, audio/ogg, audio/m4a
const MIN_AUDIO_SIZE = 10 * 1024; // 10KB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/m4a', 'audio/mp4'];

// Helper to get base64 data size (rough estimate: base64 is ~33% larger than binary)
const getBase64DataSize = (base64: string): number => {
  // Remove data URI prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!base64Data) return 0;
  // Base64 string length * 3/4 gives approximate byte size
  return Math.floor((base64Data.length * 3) / 4);
};

// Helper to extract MIME type from data URI
const extractMimeType = (dataUri: string): string | null => {
  const match = dataUri.match(/^data:([^;,]+)/);
  return match ? match[1] : null;
};

const base64Audio = z.string()
  .min(1, 'audio required')
  .refine((val) => {
    // Skip validation for already-uploaded URLs
    if (val.startsWith('http://') || val.startsWith('https://')) return true;
    const size = getBase64DataSize(val);
    return size >= MIN_AUDIO_SIZE;
  }, { message: `Audio too small (minimum ${MIN_AUDIO_SIZE / 1024}KB required)` })
  .refine((val) => {
    if (val.startsWith('http://') || val.startsWith('https://')) return true;
    const size = getBase64DataSize(val);
    return size <= MAX_AUDIO_SIZE;
  }, { message: `Audio too large (maximum ${MAX_AUDIO_SIZE / (1024 * 1024)}MB allowed)` })
  .refine((val) => {
    if (val.startsWith('http://') || val.startsWith('https://')) return true;
    const mimeType = extractMimeType(val);
    if (!mimeType) return true; // If no MIME type in data URI, allow (backend will validate)
    return ALLOWED_AUDIO_TYPES.includes(mimeType);
  }, { message: `Invalid audio type. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}` });

export const ConversionCompleteSchema = z.object({
  name: z.string().optional(),
  times_tried: z.union([z.number(), z.string()]).optional(),
  core_identity: z.string().min(1, 'core_identity is required'),
  primary_pillar: z.string().optional(),
  dark_future: z.string().optional(),
  quit_pattern: z.string().optional(),
  favorite_excuse: z.string().optional(),
  who_disappointed: z.array(z.string()).optional(),
  selected_pillars: z.array(z.string()).min(1, 'selected_pillars required'),
  future_self_intro_recording: base64Audio,
  why_recording: base64Audio,
  pledge_recording: base64Audio,
  merged_voice_recording: z.string().optional(),
  call_time: z.string().optional(),
  timezone: z.string().optional(),
  future_self_statement: z.string().optional(),
  favorite_excuse_context: z.string().optional(),
});

export type ConversionCompletePayload = z.infer<typeof ConversionCompleteSchema>;
