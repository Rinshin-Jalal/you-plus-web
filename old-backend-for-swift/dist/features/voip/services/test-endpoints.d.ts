/**
 * VoIP Test Endpoints Service
 *
 * This module provides test endpoints for VoIP functionality,
 * allowing administrators to test VoIP push notifications and
 * certificate configurations.
 */
import { Env } from "@/index";
/**
 * Execute a simple VoIP test with just a token
 *
 * This function performs a basic VoIP push test using only
 * the device token. It's useful for quick connectivity tests
 * without requiring full user data.
 *
 * @param voipToken The device's VoIP push token
 * @param env Environment variables for push service
 * @returns Object with test results and success status
 */
export declare function executeSimpleVoipTest(voipToken: string, env: Env): Promise<{
    success: boolean;
    message: string;
    error?: string;
    callUUID?: string;
}>;
/**
 * Execute an advanced VoIP test with full user context
 *
 * This function performs a comprehensive VoIP push test using
 * the device token, user ID, and call type. It simulates
 * a real call scenario for more thorough testing.
 *
 * @param voipToken The device's VoIP push token
 * @param userId The user ID for the test
 * @param callType The type of call to simulate
 * @param env Environment variables for push service
 * @returns Object with test results and success status
 */
export declare function executeAdvancedVoipTest(voipToken: string, userId: string, callType: string, env: Env): Promise<{
    success: boolean;
    message: string;
    error?: string;
    callUUID?: string;
}>;
