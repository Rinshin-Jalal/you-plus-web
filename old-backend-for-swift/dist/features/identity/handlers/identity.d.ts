/**
 * Identity System - Current identity management and evolution tracking
 *
 * This module provides comprehensive identity management for the YOU+ accountability
 * system. It handles the user's current identity, psychological profile, performance
 * tracking, and behavioral statistics. The identity system is central to creating
 * personalized accountability experiences.
 *
 * Key Features:
 * - Current identity management with 60+ psychological data points
 * - Trust percentage and streak tracking
 * - Promise performance analytics
 * - Voice clip management for emotional impact
 * - Performance statistics and trending analysis
 * - Final oath and commitment tracking
 *
 * Psychological Components:
 * - Identity Name: The persona the user wants to become
 * - Fear Version: Who they're afraid of becoming
 * - Desired Outcome: Their transformation goal
 * - Key Sacrifice: What they must give up
 * - Identity Oath: Their sacred commitment
 * - Enforcement Tone: How they want accountability
 *
 * Data Flow:
 * 1. User creates/updates identity during onboarding
 * 2. System tracks performance against identity goals
 * 3. Trust percentage adjusts based on promise-keeping
 * 4. Voice clips provide emotional connection to commitments
 * 5. Statistics drive behavioral insights and interventions
 */
import { Context } from "hono";
/**
 * Get current identity with status and statistics (Super MVP)
 *
 * Returns identity profile using Super MVP schema with simplified fields.
 * All psychological data is stored in onboarding_context JSONB field.
 *
 * Super MVP Features:
 * - Core identity fields (name, daily_commitment, chosen_path, call_time, strike_limit)
 * - Voice recording URLs (3 audio files)
 * - Onboarding context JSONB (all psychological data)
 * - Simple streak tracking (current_streak_days, total_calls_completed)
 * - Call statistics and success rates
 * - Days active since identity creation
 *
 * @param c Hono context with userId parameter
 * @returns JSON response with Super MVP identity data and statistics
 */
export declare const getCurrentIdentity: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: any;
        userId: any;
        createdAt: any;
        updatedAt: any;
        daysActive: number;
        name: any;
        dailyCommitment: any;
        chosenPath: any;
        callTime: any;
        strikeLimit: any;
        voiceRecordings: {
            whyItMatters: any;
            costOfQuitting: any;
            commitment: any;
        };
        onboardingContext: any;
        currentStreakDays: any;
        totalCallsCompleted: any;
        lastCallAt: any;
        stats: {
            totalCalls: number;
            answeredCalls: number;
            successRate: number;
            longestStreak: any;
        };
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * Update current identity (Super MVP)
 *
 * Allows updating user's identity profile with Super MVP schema fields.
 * Only core operational fields can be updated. Psychological data is
 * stored in onboarding_context JSONB and set during onboarding.
 *
 * Updatable Fields (Super MVP):
 * - dailyCommitment: The daily action they committed to
 * - callTime: TIME format "HH:MM:SS" for daily accountability call
 * - strikeLimit: Number of allowed missed days (1-5)
 * - onboardingContext: JSONB object (optional - for corrections)
 *
 * Note: name and chosenPath are typically set during onboarding and not changed
 *
 * @param c Hono context with identity data in request body
 * @returns JSON response confirming identity update
 */
export declare const updateIdentity: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: any;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * Update identity status (Super MVP - simplified streak tracking)
 *
 * This endpoint manages performance tracking with Super MVP's simplified schema.
 * Only basic streak and call tracking - no trust percentage or promise counts.
 * Uses upsert to handle both creation and updates seamlessly.
 *
 * Super MVP Status Fields:
 * - current_streak_days: Consecutive days of kept commitments
 * - total_calls_completed: Total number of completed accountability calls
 * - last_call_at: Timestamp of last completed call
 *
 * @param c Hono context with status data in request body
 * @returns JSON response confirming status update
 */
export declare const updateIdentityStatus: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
    data: any;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * Get identity performance statistics (Super MVP)
 *
 * Provides performance analytics using Super MVP's simplified schema.
 * Calculates success rates, trends, and behavioral insights for accountability.
 *
 * Super MVP Metrics:
 * - Days Active: Time since identity creation
 * - Current Streak: Consecutive days of kept commitments
 * - Total Calls Completed: Count of completed accountability calls
 * - Promise Success Rate: Kept vs broken promises
 * - Call Answer Rate: Responsiveness to accountability
 * - Performance Trending: Excellent/Good/Needs Improvement
 *
 * @param c Hono context with userId parameter
 * @returns JSON response with Super MVP performance statistics
 */
export declare const getIdentityStats: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: {
        daysActive: number;
        currentStreakDays: any;
        totalCallsCompleted: any;
        lastCallAt: any;
        promises: {
            total: number;
            kept: number;
            broken: number;
            successRate: number;
        };
        calls: {
            total: number;
            answered: number;
            answerRate: number;
        };
        performance: {
            trending: string;
            consistencyScore: any;
        };
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
