import { getUserContext } from "@/features/core/utils/database";
// Helper function to get identity data from database (main psychological data source)
async function getIdentityData(userId, env) {
    const { createSupabaseClient } = await import("@/utils/database");
    const supabase = createSupabaseClient(env);
    const { data: identityRecord, error } = await supabase
        .from("identity")
        .select("*")
        .eq("user_id", userId)
        .single();
    if (error || !identityRecord) {
        return null;
    }
    return identityRecord;
}
// 🎯 NEW: Psychological profile for deep AI understanding
export const postToolGetPsychologicalProfile = async (c) => {
    const { userId } = await c.req.json();
    const env = c.env;
    if (!userId) {
        return c.json({ error: "Missing userId" }, 400);
    }
    try {
        const [userContext, identity, { correlateIdentityWithCalls }, { analyzeCallSuccess }, { trackUserPromisePatterns },] = await Promise.all([
            getUserContext(env, userId),
            getIdentityData(userId, env),
            import("@/services/embedding-service").then((m) => ({
                correlateIdentityWithCalls: m.correlateIdentityWithCalls,
            })),
            import("@/services/embedding-service").then((m) => ({
                analyzeCallSuccess: m.analyzeCallSuccess,
            })),
            import("@/services/embedding-service").then((m) => ({
                trackUserPromisePatterns: m.trackUserPromisePatterns,
            })),
        ]);
        const [identityCorrelation, callAnalysis, promiseAnalysis] = await Promise.all([
            correlateIdentityWithCalls(userId, env),
            analyzeCallSuccess(userId, env),
            trackUserPromisePatterns(userId, env),
        ]);
        return c.json({
            success: true,
            psychologicalProfile: {
                // V3 PSYCHOLOGICAL WEAPONS
                identity: {
                    name: userContext.identity?.name,
                    trustLevel: userContext.identityStatus?.trust_percentage || 0,
                    shameTrigger: userContext.identity?.shame_trigger,
                    financialPainPoint: userContext.identity?.financial_pain_point,
                    relationshipDamage: userContext.identity?.relationship_damage_specific,
                    sabotagePattern: userContext.identity?.self_sabotage_pattern,
                    breakingPoint: userContext.identity?.breaking_point_event,
                    accountabilityHistory: userContext.identity?.accountability_history,
                    currentSelfSummary: userContext.identity?.current_self_summary,
                    aspirationalGap: userContext.identity?.aspirational_identity_gap,
                    nonNegotiableCommitment: userContext.identity?.non_negotiable_commitment,
                    warCry: userContext.identity?.war_cry_or_death_vision,
                },
                identityCore: {
                    identitySummary: identity?.identity_summary,
                    shameTrigger: identity?.shame_trigger,
                    financialPainPoint: identity?.financial_pain_point,
                    relationshipDamage: identity?.relationship_damage_specific,
                    sabotagePattern: identity?.self_sabotage_pattern,
                    breakingPoint: identity?.breaking_point_event,
                    currentSelfSummary: identity?.current_self_summary,
                    aspirationalGap: identity?.aspirational_identity_gap,
                    nonNegotiableCommitment: identity?.non_negotiable_commitment || identity?.daily_non_negotiable,
                    warCry: identity?.war_cry_or_death_vision,
                },
                behavioralMetrics: {
                    currentStreak: userContext.stats.currentStreak,
                    successRate: Math.round(userContext.stats.successRate * 100),
                    totalPromises: userContext.stats.totalPromises,
                    recentTrend: promiseAnalysis.success
                        ? promiseAnalysis.promiseAnalysis.recentTrend
                        : "unknown",
                },
                callPerformance: callAnalysis.success
                    ? {
                        successRate: callAnalysis.callAnalysis.successRate,
                        recentTrend: callAnalysis.callAnalysis.recentTrend,
                        mostEffectiveTone: callAnalysis.callAnalysis.mostEffectiveTone,
                        excuseFrequency: callAnalysis.callAnalysis.psychologicalInsights.excuseFrequency,
                        breakthroughMoments: callAnalysis.callAnalysis.psychologicalInsights
                            .breakthroughMoments,
                    }
                    : null,
                identityAlignment: identityCorrelation.success
                    ? {
                        consistencyScore: identityCorrelation.correlation.identityConsistency.score,
                        consistentAreas: identityCorrelation.correlation.identityConsistency
                            .consistentAreas,
                        contradictions: identityCorrelation.correlation.contradictions
                            .majorContradictions,
                        hiddenPatterns: identityCorrelation.correlation.hiddenPatterns.callOnlyInsights,
                    }
                    : null,
            },
            aiRecommendations: {
                callStrategy: callAnalysis.success
                    ? callAnalysis.callAnalysis.recommendedActions
                    : [],
                identityUpdates: identityCorrelation.success
                    ? identityCorrelation.identityUpdateSuggestions
                    : [],
                promiseFocus: promiseAnalysis.success
                    ? promiseAnalysis.promiseAnalysis.recommendations
                    : [],
            },
            message: "Complete psychological profile assembled for AI guidance",
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Psychological profile generation failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
