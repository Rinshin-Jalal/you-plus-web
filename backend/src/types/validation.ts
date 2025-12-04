/**
 * API Validation Schemas using Zod
 * 
 * This file contains all Zod schemas for validating API requests and responses.
 * These schemas provide runtime type checking and validation for all API endpoints.
 * 
 * Using these schemas ensures:
 * 1. Type safety at runtime (not just compile time)
 * 2. Automatic request/response validation
 * 3. Clear error messages for invalid data
 * 4. Self-documenting API contracts
 */

import { z } from "zod";

// Common base schemas
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().optional(),
});

export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
  validationErrors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
  })).optional(),
});

// User-related schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  subscription_status: z.enum(["active", "trialing", "cancelled", "past_due"]),
  timezone: z.string(),
  call_window_start: z.string().optional(),
  call_window_timezone: z.string().optional(),
  voice_clone_id: z.string().optional(),
  push_token: z.string().optional(),
  onboarding_completed: z.boolean(),
  onboarding_completed_at: z.string().optional(),
  schedule_change_count: z.number(),
  voice_reclone_count: z.number(),
  revenuecat_customer_id: z.string().optional(),
});

// Promise-related schemas
export const PromiseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  promise_date: z.string(),
  promise_text: z.string().min(1),
  status: z.enum(["pending", "kept", "broken"]),
  excuse_text: z.string().optional(),
  promise_order: z.number(),
  priority_level: z.enum(["low", "medium", "high", "critical"]),
  category: z.string(),
  time_specific: z.boolean(),
  target_time: z.string().optional(),
  created_during_call: z.boolean(),
  parent_promise_id: z.string().uuid().optional(),
});

export const CreatePromiseRequestSchema = z.object({
  userId: z.string().uuid(),
  promiseText: z.string().min(1, "Promise text cannot be empty"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  category: z.string().optional(),
  targetTime: z.string().optional(),
  createdDuringCall: z.boolean().optional(),
  parentPromiseId: z.string().uuid().optional(),
});

export const CreatePromiseResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  promiseId: z.string().uuid(),
  message: z.string(),
});

// Call-related schemas
export const CallRecordingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  call_type: z.enum(["morning", "evening", "first_call", "apology_call", "emergency", "daily_reckoning"]),
  audio_url: z.string().url(),
  duration_sec: z.number(),
  confidence_scores: z.record(z.any()).optional(),
  conversation_id: z.string().optional(),
  status: z.string().optional(),
  transcript_json: z.record(z.any()).optional(),
  transcript_summary: z.string().optional(),
  cost_cents: z.number().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  call_successful: z.enum(["success", "failure", "unknown"]).optional(),
  source: z.enum(["vapi", "elevenlabs"]).optional(),
  is_retry: z.boolean().optional(),
  retry_attempt_number: z.number().optional(),
  original_call_uuid: z.string().optional(),
  retry_reason: z.enum(["missed", "declined", "failed"]).optional(),
  urgency: z.enum(["high", "critical", "emergency"]).optional(),
  acknowledged: z.boolean().optional(),
  acknowledged_at: z.string().optional(),
  timeout_at: z.string().optional(),
});

export const CallConfigRequestSchema = z.object({
  userId: z.string().uuid(),
  callType: z.enum(["morning", "evening", "first_call", "apology_call"]),
});

export const CallConfigResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  payload: z.object({
    callUUID: z.string(),
    userId: z.string().uuid(),
    callType: z.enum(["morning", "evening", "first_call", "apology_call"]),
    agentId: z.string(),
    mood: z.string(),
    handoff: z.object({
      initiatedBy: z.enum(["manual", "scheduled", "triggered"]),
    }),
    metadata: z.record(z.any()),
    voiceId: z.string().optional(),
  }),
});

// Onboarding schemas
export const OnboardingResponseSchema = z.object({
  type: z.enum([
    "text",
    "voice",
    "choice",
    "multi_select",      // NEW: Multiple choice selection
    "slider",            // NEW: Slider input (1-10 scale)
    "rating_stars",      // NEW: 1-5 star rating
    "dual_sliders",
    "timezone_selection",
    "long_press_activate",
    "time_window_picker",
    "time_picker",
    "date_picker",
    "number_stepper"
  ]),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({}), z.array(z.any())]),
  timestamp: z.string(),
  duration: z.number().optional(),
  voiceUri: z.string().optional(),
  db_field: z.array(z.string()).optional(),
  selected_option: z.string().optional(),
  selected_options: z.array(z.string()).optional(),  // NEW: For multi_select
  sliders: z.array(z.number()).optional(),
  rating: z.number().min(1).max(5).optional(),       // NEW: For rating_stars
});

export const OnboardingStateSchema = z.object({
  currentStep: z.number(),
  responses: z.record(OnboardingResponseSchema),
  userName: z.string().optional(),
  brotherName: z.string().optional(),
  wakeUpTime: z.string().optional(),
  userPath: z.string().optional(),
  userTimezone: z.string().optional(),
  progressPercentage: z.number().optional(),
});

export const DeviceMetadataSchema = z.object({
  type: z.enum(["apns", "fcm", "voip"]),
  device_model: z.string().optional(),
  os_version: z.string().optional(),
  app_version: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const OnboardingV3CompleteRequestSchema = z.object({
  state: OnboardingStateSchema,
  pushToken: z.string().optional(),
  deviceMetadata: DeviceMetadataSchema.optional(),
});

export const OnboardingV3CompleteResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  message: z.string(),
  completedAt: z.string(),
  totalSteps: z.number(),
  filesProcessed: z.number(),
  processingWarnings: z.string().nullable(),
  identityExtraction: z.object({
    success: z.boolean(),
    fieldsExtracted: z.number().optional(),
    error: z.string().optional(),
  }),
  identityStatusSync: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
});

// Tool function schemas
export const SearchMemoriesRequestSchema = z.object({
  userId: z.string().uuid(),
  query: z.string().min(1),
  contentType: z.enum(["excuse", "craving", "demon", "echo", "pattern", "breakthrough"]).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const SearchMemoriesResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  memories: z.array(z.object({
    id: z.string().uuid(),
    content_type: z.string(),
    text_content: z.string(),
    similarity_score: z.number(),
    created_at: z.string(),
    metadata: z.record(z.any()),
  })),
});

export const GetUserContextRequestSchema = z.object({
  userId: z.string().uuid(),
});

export const GetUserContextResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  userContext: z.object({
    user: UserSchema,
    todayPromises: z.array(PromiseSchema),
    yesterdayPromises: z.array(PromiseSchema),
    recentStreakPattern: z.array(PromiseSchema),
    identity: z.any().nullable(),
    identityStatus: z.any().nullable(),
    stats: z.object({
      totalPromises: z.number(),
      keptPromises: z.number(),
      brokenPromises: z.number(),
      successRate: z.number(),
      currentStreak: z.number(),
    }),
    memoryInsights: z.object({
      countsByType: z.record(z.number()),
      topExcuseCount7d: z.number(),
      emergingPatterns: z.array(z.object({
        sampleText: z.string(),
        recentCount: z.number(),
        baselineCount: z.number(),
        growthFactor: z.number(),
      })),
    }),
  }),
});

// Voice-related schemas
export const VoiceCloneRequestSchema = z.object({
  userId: z.string().uuid(),
  audioData: z.string(), // Base64 encoded audio
  voiceName: z.string().min(1),
});

export const VoiceCloneResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  voiceId: z.string(),
  message: z.string(),
});

export const TranscribeAudioRequestSchema = z.object({
  audioData: z.string(), // Base64 encoded audio
  language: z.string().optional(),
});

export const TranscribeAudioResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  transcript: z.string(),
  confidence: z.number().optional(),
});

// Push token schemas
export const PushTokenRequestSchema = z.object({
  token: z.string().min(1),
  type: z.enum(["apns", "fcm", "voip"]).optional(),
  device_model: z.string().optional(),
  os_version: z.string().optional(),
  app_version: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const PushTokenResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  message: z.string(),
});

// Export type inference from schemas
export type CreateUserRequest = z.infer<typeof CreatePromiseRequestSchema>;
export type CreatePromiseResponse = z.infer<typeof CreatePromiseResponseSchema>;
export type CallConfigRequest = z.infer<typeof CallConfigRequestSchema>;
export type CallConfigResponse = z.infer<typeof CallConfigResponseSchema>;
export type OnboardingV3CompleteRequest = z.infer<typeof OnboardingV3CompleteRequestSchema>;
export type OnboardingV3CompleteResponse = z.infer<typeof OnboardingV3CompleteResponseSchema>;
export type SearchMemoriesRequest = z.infer<typeof SearchMemoriesRequestSchema>;
export type SearchMemoriesResponse = z.infer<typeof SearchMemoriesResponseSchema>;
export type GetUserContextRequest = z.infer<typeof GetUserContextRequestSchema>;
export type GetUserContextResponse = z.infer<typeof GetUserContextResponseSchema>;
export type VoiceCloneRequest = z.infer<typeof VoiceCloneRequestSchema>;
export type VoiceCloneResponse = z.infer<typeof VoiceCloneResponseSchema>;
export type TranscribeAudioRequest = z.infer<typeof TranscribeAudioRequestSchema>;
export type TranscribeAudioResponse = z.infer<typeof TranscribeAudioResponseSchema>;
export type PushTokenRequest = z.infer<typeof PushTokenRequestSchema>;
export type PushTokenResponse = z.infer<typeof PushTokenResponseSchema>;