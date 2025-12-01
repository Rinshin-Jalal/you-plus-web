/**
 * LiveKit Webhook Handler Endpoints
 * Routes for receiving webhooks from LiveKit Cloud
 */
import { Context } from "hono";
/**
 * POST /webhook/livekit
 * Main webhook endpoint for all LiveKit events
 */
export declare const postLiveKitWebhook: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    status: string;
    event: import("@/types/livekit").LiveKitWebhookEventType;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * GET /webhook/livekit/test
 * Test endpoint to verify webhook configuration
 */
export declare const getLiveKitWebhookTest: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    status: string;
    message: string;
    event: {
        event: import("@/types/livekit").LiveKitWebhookEventType;
        createdAt: number;
        room?: {
            sid: string;
            name: string;
            emptyTimeout: number;
            creationTime: string;
            metadata: string;
            numParticipants: number;
            duration: number;
        } | undefined;
        track?: {
            track: {
                sid: string;
                type: "audio" | "video" | "data";
                name: string;
                width: number;
                height: number;
                mimeType: string;
                bitrate: number;
                ssrc: number;
                layersSSRC: number[];
            };
            participant: {
                sid: string;
                identity: string;
                state: "ACTIVE" | "DISCONNECTED";
                joinedAt: number;
                name: string;
                version: number;
                permission?: {
                    canPublish: boolean;
                    canPublishData: boolean;
                    canSubscribe: boolean;
                    canPublishSources: string[];
                    hidden: boolean;
                    recorder: boolean;
                } | undefined;
                region: string;
                isPublisher: boolean;
                isSubscriber: boolean;
                tracks: {
                    sid: string;
                    type: "audio" | "video" | "data";
                    name: string;
                    muted: boolean;
                    width: number;
                    height: number;
                    simulcast: boolean;
                    layerLocked: boolean;
                    layers: {
                        quality: "low" | "medium" | "high";
                        width: number;
                        height: number;
                        bitrate: number;
                        ssrc: number;
                    }[];
                }[];
                metadata: string;
                disconnectReason: number;
            };
        } | undefined;
        participant?: {
            sid: string;
            state: "ACTIVE" | "DISCONNECTED";
            identity: string;
            name: string;
            metadata: string;
            joinedAt: number;
        } | undefined;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">)>;
/**
 * GET /webhook/livekit/health
 * Health check endpoint
 */
export declare const getLiveKitWebhookHealth: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    status: string;
    configured: boolean;
    timestamp: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
