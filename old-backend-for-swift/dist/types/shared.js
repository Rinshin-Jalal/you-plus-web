/**
 * Shared Types for Frontend-Backend Communication
 *
 * This file contains shared type definitions used by both frontend and backend.
 * These types ensure type safety across the entire application stack.
 */
import { z } from "zod";
// Base response wrapper
export const BaseResponseSchema = z.object({
    success: z.boolean(),
    timestamp: z.string(),
    requestId: z.string().optional(),
});
// Success response wrapper
export const SuccessResponseSchema = (dataSchema) => BaseResponseSchema.extend({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
});
// Pagination schemas
export const PaginationParamsSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export const PaginationMetaSchema = z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
});
export const PaginatedResponseSchema = (dataSchema) => SuccessResponseSchema(z.object({
    items: z.array(dataSchema),
    meta: PaginationMetaSchema,
}));
// User-related shared types
export const UserProfileSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    timezone: z.string(),
    onboardingCompleted: z.boolean(),
    subscriptionStatus: z.enum(["active", "trialing", "cancelled", "past_due"]),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const UserPreferencesSchema = z.object({
    callWindowStart: z.string().optional(),
    callWindowTimezone: z.string().optional(),
    voiceCloneId: z.string().optional(),
    pushNotifications: z.boolean().default(true),
    emailNotifications: z.boolean().default(true),
});
// Promise-related shared types
export const PromiseStatusSchema = z.enum(["pending", "kept", "broken"]);
export const PriorityLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const PromiseSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    text: z.string(),
    status: PromiseStatusSchema,
    priority: PriorityLevelSchema,
    category: z.string(),
    targetTime: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    excuseText: z.string().optional(),
    isTimeSpecific: z.boolean(),
    createdDuringCall: z.boolean(),
});
export const CreatePromiseRequestSchema = z.object({
    text: z.string().min(1, "Promise text cannot be empty"),
    priority: PriorityLevelSchema.optional(),
    category: z.string().optional(),
    targetTime: z.string().optional(),
    isTimeSpecific: z.boolean().optional(),
});
export const UpdatePromiseRequestSchema = z.object({
    status: PromiseStatusSchema.optional(),
    excuseText: z.string().optional(),
});
// Call-related shared types
export const CallTypeSchema = z.enum([
    "morning",
    "evening",
    "first_call",
    "apology_call",
    "emergency",
    "daily_reckoning"
]);
export const CallStatusSchema = z.enum([
    "scheduled",
    "in_progress",
    "completed",
    "failed",
    "missed",
    "declined"
]);
export const CallSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    type: CallTypeSchema,
    status: CallStatusSchema,
    scheduledAt: z.string(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
    duration: z.number().optional(),
    audioUrl: z.string().optional(),
    transcript: z.string().optional(),
    summary: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});
// Onboarding shared types
export const OnboardingStepTypeSchema = z.enum([
    "text",
    "voice",
    "choice",
    "dual_sliders",
    "timezone_selection",
    "long_press_activate",
    "time_window_picker",
    "time_picker"
]);
export const OnboardingResponseSchema = z.object({
    type: OnboardingStepTypeSchema,
    value: z.union([z.string(), z.number(), z.boolean(), z.object({}), z.array(z.any())]),
    timestamp: z.string(),
    duration: z.number().optional(),
    voiceUri: z.string().optional(),
    dbField: z.array(z.string()).optional(),
    selectedOption: z.string().optional(),
    sliders: z.array(z.number()).optional(),
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
// Device metadata for push notifications
export const DeviceMetadataSchema = z.object({
    type: z.enum(["apns", "fcm", "voip"]),
    deviceModel: z.string().optional(),
    osVersion: z.string().optional(),
    appVersion: z.string().optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
});
// API request/response wrappers
export const ApiRequestSchema = (dataSchema) => z.object({
    data: dataSchema,
    metadata: z.object({
        timestamp: z.string(),
        version: z.string().optional(),
    }).optional(),
});
export const ApiResponseSchema = (dataSchema) => BaseResponseSchema.extend({
    data: dataSchema.optional(),
    message: z.string().optional(),
    metadata: z.object({
        requestId: z.string(),
        processingTime: z.number().optional(),
    }).optional(),
});
