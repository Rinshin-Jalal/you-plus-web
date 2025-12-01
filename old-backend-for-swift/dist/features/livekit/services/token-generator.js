/**
 * LiveKit Token Generator Service
 * Generates JWT tokens for iOS clients to connect to LiveKit Cloud
 */
import { SignJWT } from "jose";
/**
 * Generate JWT token for LiveKit access
 * Token allows iOS app to connect to LiveKit Cloud room
 */
export async function generateLiveKitToken(env, payload, durationSeconds = 3600 // 1 hour default
) {
    // Get credentials from environment
    const apiKey = env.LIVEKIT_API_KEY;
    const apiSecret = env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
        throw new Error("Missing LiveKit credentials: LIVEKIT_API_KEY or LIVEKIT_API_SECRET");
    }
    // Create expiration time
    const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
    // Build token claims
    const claims = {
        sub: payload.identity, // Subject = participant identity
        iat: Math.floor(Date.now() / 1000), // Issued at
        exp: expiresAt, // Expiration
        nbf: Math.floor(Date.now() / 1000), // Not before
        // LiveKit-specific claims
        video: {
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
        },
        room: payload.roomName,
        roomJoin: true,
        metadata: JSON.stringify({
            userId: payload.userId,
            callUUID: payload.callUUID,
            ...payload.metadata,
        }),
    };
    try {
        // Create secret key for signing
        const secret = new TextEncoder().encode(apiSecret);
        // Generate signed JWT
        const token = await new SignJWT(claims)
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setExpirationTime(expiresAt)
            .sign(secret);
        return {
            token,
            expiresAt,
            expiresIn: durationSeconds,
        };
    }
    catch (error) {
        console.error("Error generating LiveKit token:", error);
        throw new Error(`Failed to generate LiveKit token: ${String(error)}`);
    }
}
/**
 * Generate unique room name for a call
 * Format: youplus-{userId}-{callUUID}
 */
export function generateRoomName(userId, callUUID) {
    // Sanitize inputs (LiveKit room names must be alphanumeric + dashes/underscores)
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, "");
    const sanitizedCallUUID = callUUID.replace(/[^a-zA-Z0-9-_]/g, "");
    return `youplus-${sanitizedUserId}-${sanitizedCallUUID}`.toLowerCase();
}
/**
 * Generate participant identity for iOS client
 * Format: {userId}@{callUUID}
 */
export function generateParticipantIdentity(userId, callUUID) {
    return `${userId}@${callUUID}`;
}
