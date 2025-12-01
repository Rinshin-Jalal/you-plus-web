/**
 * Handler: POST /tool/get-onboarding-intelligence
 *
 * Provides targeted onboarding intelligence based on identity data and category.
 *
 * Request body:
 *   - userId: string
 *   - category: 'fears' | 'goals' | 'past_failures' | 'transformation_vision' | 'core_struggle' | 'manifesto'
 *
 * Response:
 *   - success: boolean
 *   - category: string
 *   - intelligence: object
 *   - confrontationScript: string
 *   - hasData: boolean
 *   - message: string
 *   - dataSource: object
 */
import { Context } from "hono";
export declare const postToolGetOnboardingIntelligence: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    category: any;
    intelligence: {
        shameTrigger: any;
        currentSelfSummary: any;
        breakingPointEvent: any;
        relationshipDamage: any;
    } | {
        aspirationalGap: any;
        currentSelfSummary: any;
        nonNegotiableCommitment: any;
        warCry: any;
    } | {
        sabotagePattern: any;
        accountabilityHistory: any;
        financialPainPoint: any;
    } | {
        aspirationalGap: any;
        breakingPointEvent: any;
        warCry: any;
        nonNegotiableCommitment: any;
    } | {
        currentSelfSummary: any;
        sabotagePattern: any;
        accountabilityHistory: any;
    } | {
        nonNegotiableCommitment: any;
        warCry: any;
        relationshipDamage: any;
        financialPainPoint: any;
    };
    confrontationScript: string;
    hasData: boolean;
    message: string;
    dataSource: {
        identityData: boolean;
        identityFields: number;
        psychologicalDepth: string;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
