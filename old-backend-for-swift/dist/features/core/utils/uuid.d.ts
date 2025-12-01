/**
 * Generate a UUID v4 (random) for call identification
 */
export declare function generateUUID(): string;
/**
 * Generate a call-specific UUID with prefix
 */
export declare function generateCallUUID(callType: "morning" | "evening" | "promise_followup" | "emergency" | string): string;
