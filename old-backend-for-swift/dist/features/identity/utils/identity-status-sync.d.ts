import { Env } from "@/index";
/**
 * Sync identity_status table with actual data from promises table
 *
 * Calculates:
 * - promises_made_count: Total promises with definitive status (kept or broken)
 * - promises_broken_count: Total broken promises
 * - current_streak_days: Consecutive days with all promises kept
 * - trust_percentage: Trust score based on recent performance (last 7 days)
 * - status_summary: AI-generated discipline + notification messaging
 */
export declare function syncIdentityStatus(userId: string, env: Env): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}>;
