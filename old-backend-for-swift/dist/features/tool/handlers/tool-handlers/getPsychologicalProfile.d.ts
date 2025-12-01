/**
 * Handler: POST /tool/get-psychological-profile
 *
 * Assembles a comprehensive psychological profile including identity, behavior metrics, call performance, and AI recommendations.
 *
 * Request body:
 *   - userId: string
 *
 * Response:
 *   - success: boolean
 *   - psychologicalProfile: object
 *   - aiRecommendations: object
 *   - message: string
 */
import { Context } from "hono";
export declare const postToolGetPsychologicalProfile: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    psychologicalProfile: {
        identity: {
            name: string | undefined;
            trustLevel: number;
            shameTrigger: string | undefined;
            financialPainPoint: string | undefined;
            relationshipDamage: string | undefined;
            sabotagePattern: string | undefined;
            breakingPoint: string | undefined;
            accountabilityHistory: string | undefined;
            currentSelfSummary: string | undefined;
            aspirationalGap: string | undefined;
            nonNegotiableCommitment: string | undefined;
            warCry: string | undefined;
        };
        identityCore: {
            identitySummary: any;
            shameTrigger: any;
            financialPainPoint: any;
            relationshipDamage: any;
            sabotagePattern: any;
            breakingPoint: any;
            currentSelfSummary: any;
            aspirationalGap: any;
            nonNegotiableCommitment: any;
            warCry: any;
        };
        behavioralMetrics: {
            currentStreak: number;
            successRate: number;
            totalPromises: number;
            recentTrend: string;
        };
        callPerformance: {
            successRate: number;
            recentTrend: "stable" | "improving" | "declining";
            mostEffectiveTone: string;
            excuseFrequency: number;
            breakthroughMoments: number;
        } | null;
        identityAlignment: {
            consistencyScore: number;
            consistentAreas: string[];
            contradictions: string[];
            hiddenPatterns: string[];
        } | null;
    };
    aiRecommendations: {
        callStrategy: string[];
        identityUpdates: string[];
        promiseFocus: string[];
    };
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
