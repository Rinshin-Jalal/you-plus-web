/**
 * iOS VoIP Certificate Validator Service
 *
 * This module validates and tests iOS VoIP push notification certificates
 * required for sending VoIP calls to iOS devices. It ensures all required
 * Apple Push Notification Service (APNs) credentials are properly configured.
 *
 * Required iOS VoIP Certificates:
 * - IOS_VOIP_KEY_ID: The Key ID from Apple Developer account
 * - IOS_VOIP_TEAM_ID: The Team ID from Apple Developer account
 * - IOS_VOIP_AUTH_KEY: The private key file content (.p8 file)
 *
 * These certificates are essential for:
 * - Sending VoIP push notifications to iOS devices
 * - Enabling background call reception
 * - Meeting Apple's VoIP requirements
 */
import { testIosVoipCertificates } from "@/features/core/services/push-notification-service";
/**
 * Validate iOS VoIP certificate configuration
 *
 * This function checks if all required iOS VoIP certificate environment
 * variables are present and properly configured. It provides detailed
 * feedback about what's missing and whether the system is ready for testing.
 *
 * @param env Environment variables containing certificate configuration
 * @returns CertificateStatus object with validation results
 */
export function validateCertificateConfig(env) {
    const status = {
        hasKeyId: !!env.IOS_VOIP_KEY_ID,
        hasTeamId: !!env.IOS_VOIP_TEAM_ID,
        hasAuthKey: !!env.IOS_VOIP_AUTH_KEY,
        readyForTesting: false,
        missingConfiguration: [],
    };
    // Check what's missing and build list of missing configurations
    if (!env.IOS_VOIP_KEY_ID) {
        status.missingConfiguration.push("IOS_VOIP_KEY_ID");
    }
    if (!env.IOS_VOIP_TEAM_ID) {
        status.missingConfiguration.push("IOS_VOIP_TEAM_ID");
    }
    if (!env.IOS_VOIP_AUTH_KEY) {
        status.missingConfiguration.push("IOS_VOIP_AUTH_KEY");
    }
    // System is ready for testing only if all required certificates are present
    status.readyForTesting = status.missingConfiguration.length === 0;
    return status;
}
/**
 * Test iOS VoIP certificate configuration
 *
 * This function validates certificate configuration and then performs
 * actual certificate testing to ensure that credentials work with Apple's
 * Push Notification Service. It provides detailed error messages and
 * instructions for fixing configuration issues.
 *
 * @param env Environment variables containing certificate configuration
 * @returns Object with test results, error details, and configuration status
 */
export async function testCertificates(env) {
    // First validate that all required certificates are present
    const status = validateCertificateConfig(env);
    if (!status.readyForTesting) {
        return {
            success: false,
            message: "❌ iOS VoIP certificates not configured",
            error: `Missing: ${status.missingConfiguration.join(", ")}`,
            configStatus: {
                hasKeyId: status.hasKeyId,
                hasTeamId: status.hasTeamId,
                hasAuthKey: status.hasAuthKey,
            },
            instructions: "Run: wrangler secret put IOS_VOIP_KEY_ID, IOS_VOIP_TEAM_ID, IOS_VOIP_AUTH_KEY",
        };
    }
    try {
        // Perform actual certificate testing with Apple's servers
        // This validates that credentials are correct and functional
        const certTest = await testIosVoipCertificates({
            IOS_VOIP_KEY_ID: env.IOS_VOIP_KEY_ID,
            IOS_VOIP_TEAM_ID: env.IOS_VOIP_TEAM_ID,
            IOS_VOIP_AUTH_KEY: env.IOS_VOIP_AUTH_KEY,
        });
        return {
            success: true,
            message: "✅ Certificate test completed",
            certificates: certTest,
            configStatus: {
                hasKeyId: status.hasKeyId,
                hasTeamId: status.hasTeamId,
                hasAuthKey: status.hasAuthKey,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            message: "❌ Certificate test failed",
            error: error instanceof Error ? error.message : "Unknown error",
            configStatus: {
                hasKeyId: status.hasKeyId,
                hasTeamId: status.hasTeamId,
                hasAuthKey: status.hasAuthKey,
            },
        };
    }
}
