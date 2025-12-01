import { getUserContext } from "@/features/core/utils/database";
import { calculateOptimalTone } from "@/features/call/services/tone-engine";
import { trackUserPromisePatterns } from "@/services/embedding-service";
export async function postToolGetUserContext(c) {
    const { userId } = await c.req.json();
    const env = c.env;
    if (!userId) {
        return c.json({ error: "Missing userId" }, 400);
    }
    try {
        const userContext = await getUserContext(env, userId);
        const toneAnalysis = calculateOptimalTone(userContext);
        const promiseAnalysis = await trackUserPromisePatterns(userId, env);
        return c.json({
            success: true,
            context: {
                streak: userContext.stats.currentStreak,
                successRate: Math.round(userContext.stats.successRate * 100),
                totalPromises: userContext.stats.totalPromises,
                todayPromises: userContext.todayPromises,
                yesterdayPromises: userContext.yesterdayPromises,
                recentPromises: userContext.recentStreakPattern?.slice(0, 5) || [],
                toneRecommendation: toneAnalysis,
                memoryCount: Object.values(userContext.memoryInsights?.countsByType || {}).reduce((sum, count) => sum + count, 0),
                memoryInsights: {
                    countsByType: userContext.memoryInsights?.countsByType || {},
                    topExcuseCount7d: userContext.memoryInsights?.topExcuseCount7d || 0,
                    emergingPatterns: userContext.memoryInsights?.emergingPatterns || [],
                },
                behavioralProfile: promiseAnalysis.success
                    ? {
                        recentTrend: promiseAnalysis.promiseAnalysis.recentTrend,
                        mostReliableType: promiseAnalysis.promiseAnalysis.behavioralInsights
                            .mostReliablePromiseType,
                        leastReliableType: promiseAnalysis.promiseAnalysis.behavioralInsights
                            .leastReliablePromiseType,
                        commonFailures: promiseAnalysis.promiseAnalysis.behavioralInsights
                            .commonFailureReasons,
                        callCorrelation: promiseAnalysis.promiseAnalysis.callCorrelation
                            .callSuccessToPromiseKeeping,
                    }
                    : null,
                identity: userContext.identity
                    ? {
                        // V3 PSYCHOLOGICAL WEAPONS
                        trustPercentage: userContext.identityStatus?.trust_percentage || 0,
                        shameTrigger: userContext.identity.shame_trigger,
                        financialPainPoint: userContext.identity.financial_pain_point,
                        relationshipDamage: userContext.identity.relationship_damage_specific,
                        sabotagePattern: userContext.identity.self_sabotage_pattern,
                        breakingPoint: userContext.identity.breaking_point_event,
                        accountabilityHistory: userContext.identity.accountability_history,
                        currentSelfSummary: userContext.identity.current_self_summary,
                        aspirationalGap: userContext.identity.aspirational_identity_gap,
                        nonNegotiableCommitment: userContext.identity.non_negotiable_commitment,
                        warCry: userContext.identity.war_cry_or_death_vision,
                        // Legacy fields (for backward compatibility)
                        dailyNonNegotiable: userContext.identity.daily_non_negotiable,
                    }
                    : null,
            },
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Context retrieval failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
}
