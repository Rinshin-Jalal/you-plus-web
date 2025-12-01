import { User } from "@/types/database";
import type { Env } from "@/index";
/**
 * YOU+ SCHEDULER ENGINE
 *
 * Orchestrates AI accountability calls across global timezones.
 * - Runs every 17 minutes (Cloudflare Workers: "\*\/17 * * * *")
 * - Prevents duplicate calls (2-hour cooldown)
 * - Enforces weekly call limits (max 7 per user)
 * - Handles first-day onboarding rules
 * - Limits concurrent batches (max 10)
 * - All filtering and eligibility handled in optimized SQL for speed and reliability
 */
export declare class UserScheduleEngine {
    private env;
    private supabase;
    constructor(env: Env);
    getUsersNeedingCallsNow(): Promise<{
        dailyReckoning: User[];
        firstDay: User[];
    }>;
    processScheduledCalls(): Promise<{
        dailyReckoning: {
            processed: number;
            errors: number;
            results: any[];
        };
        firstDay: {
            processed: number;
            errors: number;
            results: any[];
        };
    }>;
    private batchProcessCalls;
    /**
     * Get schedule preview for debugging
     * Shows when each user's next calls are scheduled
     */
    getSchedulePreview(): Promise<{
        users: Array<{
            id: string;
            name: string;
            timezone: string;
            nextCall: string | null;
            callWindow: string;
        }>;
    }>;
    /**
     * Calculate when the next call should happen for a user
     */
    private calculateNextCallTime;
}
/**
 * Factory function to create scheduler instance
 */
export declare function createScheduler(env: Env): UserScheduleEngine;
/**
 * Utility function to check if any users need calls right now
 * Uses efficient SQL function with first-day rules
 */
export declare function shouldTriggerCalls(env: Env): Promise<boolean>;
