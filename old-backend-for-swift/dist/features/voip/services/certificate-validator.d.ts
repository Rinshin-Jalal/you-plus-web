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
/**
 * Status of iOS VoIP certificate configuration
 */
interface CertificateStatus {
    hasKeyId: boolean;
    hasTeamId: boolean;
    hasAuthKey: boolean;
    readyForTesting: boolean;
    missingConfiguration: string[];
}
/**
 * Environment variables containing iOS VoIP certificate configuration
 */
interface VoIPEnvironment {
    IOS_VOIP_KEY_ID?: string;
    IOS_VOIP_TEAM_ID?: string;
    IOS_VOIP_AUTH_KEY?: string;
}
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
export declare function validateCertificateConfig(env: VoIPEnvironment): CertificateStatus;
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
export declare function testCertificates(env: VoIPEnvironment): Promise<{
    success: boolean;
    message: string;
    error: string;
    configStatus: {
        hasKeyId: boolean;
        hasTeamId: boolean;
        hasAuthKey: boolean;
    };
    instructions: string;
    certificates?: never;
} | {
    success: boolean;
    message: string;
    certificates: boolean;
    configStatus: {
        hasKeyId: boolean;
        hasTeamId: boolean;
        hasAuthKey: boolean;
    };
    error?: never;
    instructions?: never;
} | {
    success: boolean;
    message: string;
    error: string;
    configStatus: {
        hasKeyId: boolean;
        hasTeamId: boolean;
        hasAuthKey: boolean;
    };
    instructions?: never;
    certificates?: never;
}>;
export {};
