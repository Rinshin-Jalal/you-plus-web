import { randomUUID } from "node:crypto";
/**
 * Generate a UUID v4 (random) for call identification
 */
export function generateUUID() {
    return randomUUID();
}
/**
 * Generate a call-specific UUID with prefix
 */
export function generateCallUUID(callType) {
    const uuid = generateUUID();
    return `${callType}-${uuid}`;
}
