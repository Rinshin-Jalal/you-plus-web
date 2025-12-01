/**
 * Retry Processor Service
 *
 * This module handles the scheduled processing of call timeouts and retries.
 * It runs as part of the cron job to detect missed calls and send retries.
 *
 * Key Features:
 * - Processes timed out calls and triggers retries
 * - Sends escalated retry notifications
 * - Manages retry attempt limits
 * - Provides detailed logging for monitoring
 */
import { Env } from "@/index";
/**
 * Process all timed out calls and trigger retries
 */
export declare function processCallTimeouts(env: Env): Promise<void>;
/**
 * Process scheduled retries that are due to be sent
 */
export declare function processScheduledRetries(env: Env): Promise<void>;
/**
 * Main function to process all retry-related tasks
 */
export declare function processAllRetries(env: Env): Promise<void>;
