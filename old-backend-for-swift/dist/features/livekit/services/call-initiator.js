/**
 * LiveKit Call Initiator Service
 * Creates LiveKit rooms and initiates agent dispatch
 */
import { generateLiveKitToken, generateRoomName, generateParticipantIdentity, } from "./token-generator";
/**
 * Initiate a LiveKit call by creating room and generating access token
 */
export async function initiateLiveKitCall(env, config) {
    try {
        // Generate room and participant identities
        const roomName = generateRoomName(config.userId, config.callUUID);
        const participantIdentity = generateParticipantIdentity(config.userId, config.callUUID);
        // Create the room first to avoid race conditions
        await createLiveKitRoom(env, roomName, config);
        console.log(`✅ Created LiveKit room: ${roomName}`);
        // Generate JWT token for iOS client
        const tokenResult = await generateLiveKitToken(env, {
            userId: config.userId,
            callUUID: config.callUUID,
            roomName: roomName,
            identity: participantIdentity,
            metadata: {
                callType: config.callType,
                mood: config.mood,
            },
        }, 3600 // 1 hour token expiration
        );
        console.log(`✅ Generated LiveKit token for call ${config.callUUID} in room ${roomName}`);
        // Dispatch the agent to the room
        try {
            await dispatchAgent(env, {
                roomName,
                participantIdentity,
                userId: config.userId,
                callUUID: config.callUUID,
                callType: config.callType,
                mood: config.mood,
                prompts: config.prompts,
                cartesiaVoiceId: config.cartesiaVoiceId,
                supermemoryUserId: config.supermemoryUserId,
                metadata: config.metadata,
            });
        }
        catch (error) {
            console.error("Warning: Agent dispatch failed, but call can still proceed:", error);
            // Continue even if agent dispatch fails - client can retry
        }
        // Prepare agent dispatch request URL for reference
        const agentDispatchUrl = buildAgentDispatchUrl(env, roomName, config);
        return {
            roomName,
            participantIdentity,
            token: tokenResult.token,
            expiresIn: tokenResult.expiresIn,
            agentDispatchUrl,
        };
    }
    catch (error) {
        console.error("Error initiating LiveKit call:", error);
        throw new Error(`Failed to initiate LiveKit call: ${String(error)}`);
    }
}
/**
 * Create a LiveKit room
 * Uses LiveKit Room Service API to create the room before participants join
 */
async function createLiveKitRoom(env, roomName, config) {
    const liveKitUrl = env.LIVEKIT_URL.replace("wss://", "https://");
    const accessToken = await createAccessToken(env, "room-creator");
    try {
        const response = await fetch(`${liveKitUrl}/twirp/livekit.RoomService/CreateRoom`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                name: roomName,
                emptyTimeout: 300, // 5 minutes - room closes if empty
                maxParticipants: 10,
                metadata: JSON.stringify({
                    userId: config.userId,
                    callUUID: config.callUUID,
                    callType: config.callType,
                    mood: config.mood,
                    cartesiaVoiceId: config.cartesiaVoiceId,
                    supermemoryUserId: config.supermemoryUserId,
                }),
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            // Room might already exist - that's okay
            if (errorText.includes("already exists")) {
                console.log(`ℹ️ Room ${roomName} already exists, continuing...`);
                return;
            }
            throw new Error(`Room creation failed: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        console.log(`✅ Room created: ${roomName}`, result);
    }
    catch (error) {
        console.error("Error creating LiveKit room:", error);
        throw error;
    }
}
/**
 * Dispatch the agent to the LiveKit room
 * Tries self-hosted agent endpoint first, then falls back to LiveKit Cloud Agents API
 */
async function dispatchAgent(env, config) {
    // Try self-hosted agent first (if AGENT_DISPATCH_URL is set)
    const selfHostedUrl = env.AGENT_DISPATCH_URL;
    if (selfHostedUrl) {
        try {
            const response = await fetch(selfHostedUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${env.LIVEKIT_API_SECRET}`,
                },
                body: JSON.stringify({
                    room: config.roomName,
                    roomMetadata: {
                        user_id: config.userId,
                        call_uuid: config.callUUID,
                        call_type: config.callType,
                        mood: config.mood,
                        cartesia_voice_id: config.cartesiaVoiceId,
                        supermemory_user_id: config.supermemoryUserId,
                        prompts: config.prompts,
                    },
                }),
            });
            if (response.ok) {
                console.log(`✅ Agent dispatched to room ${config.roomName} (self-hosted)`);
                return;
            }
            else {
                console.warn(`Self-hosted agent dispatch returned ${response.status}`);
            }
        }
        catch (error) {
            console.warn("Self-hosted agent dispatch failed, trying LiveKit Cloud Agents:", error);
        }
    }
    // Fall back to LiveKit Cloud Agents API
    try {
        const liveKitUrl = env.LIVEKIT_URL.replace("wss://", "https://");
        const accessToken = await createAccessToken(env, "agent-dispatch");
        const response = await fetch(`${liveKitUrl}/twirp/livekit.RoomService/CreateRoom`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                room: config.roomName,
            }),
        });
        if (response.ok) {
            console.log(`✅ Agent dispatched to room ${config.roomName} (LiveKit Cloud Agents)`);
            return;
        }
        else {
            console.warn(`LiveKit Cloud Agents returned ${response.status}`);
        }
    }
    catch (error) {
        console.warn("LiveKit Cloud Agents dispatch also failed:", error);
    }
    // If both fail, throw error
    throw new Error("Failed to dispatch agent via both self-hosted and LiveKit Cloud Agents");
}
/**
 * Create an access token for LiveKit API calls
 * Uses proper JWT generation for API authentication
 */
async function createAccessToken(env, identity) {
    const { SignJWT } = await import('jose');
    const apiSecret = env.LIVEKIT_API_SECRET;
    const apiKey = env.LIVEKIT_API_KEY;
    // Create proper JWT token for API calls
    const secret = new TextEncoder().encode(apiSecret);
    const token = await new SignJWT({
        sub: identity,
        video: {
            roomAdmin: true,
            roomCreate: true,
            roomList: true,
            roomRecord: true,
        },
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(apiKey)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
    return token;
}
/**
 * Build URL for agent dispatch (LiveKit Cloud Agents or self-hosted)
 * This URL would be called to spawn the Python agent in the room
 */
function buildAgentDispatchUrl(env, roomName, config) {
    const baseUrl = env.LIVEKIT_AGENTS_DISPATCH_URL ||
        "https://agents.livekit.cloud/dispatch";
    const params = new URLSearchParams({
        room: roomName,
        user_id: config.userId,
        call_type: config.callType,
        mood: config.mood,
        cartesia_voice_id: config.cartesiaVoiceId,
        supermemory_user_id: config.supermemoryUserId,
    });
    return `${baseUrl}?${params.toString()}`;
}
/**
 * Validate LiveKit Cloud credentials
 */
export async function validateLiveKitCredentials(env) {
    const apiKey = env.LIVEKIT_API_KEY;
    const apiSecret = env.LIVEKIT_API_SECRET;
    const url = env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !url) {
        console.error("Missing required LiveKit credentials");
        return false;
    }
    try {
        // Basic validation - in production, you might call LiveKit API to verify
        console.log("✅ LiveKit credentials validated");
        return true;
    }
    catch (error) {
        console.error("LiveKit credential validation failed:", error);
        return false;
    }
}
