/**
 * Handler: POST /tool/get-user-context
 *
 * Retrieves the current user context including streaks, stats, tone recommendation, and behavior profile.
 *
 * Request body:
 *   - userId: string
 *
 * Response:
 *   - success: boolean
 *   - context: object
 */
import { Context } from "hono";
export declare function postToolGetUserContext(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    context: {
        streak: number;
        successRate: number;
        totalPromises: number;
        todayPromises: {
            id: string;
            user_id: string;
            created_at: string;
            promise_date: string;
            promise_text: string;
            status: import("../../../../types/database").PromiseStatus;
            excuse_text?: string | undefined;
            promise_order: number;
            priority_level: import("../../../../types/database").PromisePriority;
            category: string;
            time_specific: boolean;
            target_time?: string | undefined;
            created_during_call: boolean;
            parent_promise_id?: string | undefined;
        }[];
        yesterdayPromises: {
            id: string;
            user_id: string;
            created_at: string;
            promise_date: string;
            promise_text: string;
            status: import("../../../../types/database").PromiseStatus;
            excuse_text?: string | undefined;
            promise_order: number;
            priority_level: import("../../../../types/database").PromisePriority;
            category: string;
            time_specific: boolean;
            target_time?: string | undefined;
            created_during_call: boolean;
            parent_promise_id?: string | undefined;
        }[];
        recentPromises: {
            id: string;
            user_id: string;
            created_at: string;
            promise_date: string;
            promise_text: string;
            status: import("../../../../types/database").PromiseStatus;
            excuse_text?: string | undefined;
            promise_order: number;
            priority_level: import("../../../../types/database").PromisePriority;
            category: string;
            time_specific: boolean;
            target_time?: string | undefined;
            created_during_call: boolean;
            parent_promise_id?: string | undefined;
        }[];
        toneRecommendation: {
            recommended_mood: import("../../../../types/database").BigBruhhTone;
            intensity: number;
            reasoning: string;
            reasoningFactors: {
                factor: string;
                value: string | number;
            }[];
            confidence_score: number;
            dataQuality: "insufficient" | "partial" | "robust";
        };
        memoryCount: number;
        memoryInsights: {
            countsByType: {
                [x: string]: number;
            };
            topExcuseCount7d: number;
            emergingPatterns: {
                sampleText: string;
                recentCount: number;
                baselineCount: number;
                growthFactor: number;
            }[];
        };
        behavioralProfile: {
            recentTrend: "stable" | "improving" | "declining";
            mostReliableType: string;
            leastReliableType: string;
            commonFailures: string[];
            callCorrelation: number;
        } | null;
        identity: {
            trustPercentage: number;
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
            dailyNonNegotiable: string | undefined;
        } | null;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
