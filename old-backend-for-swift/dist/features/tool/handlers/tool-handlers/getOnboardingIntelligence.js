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
// 🎯 NEW: Get onboarding intelligence for targeted confrontation
export const postToolGetOnboardingIntelligence = async (c) => {
    const { userId, category } = await c.req.json();
    const env = c.env;
    if (!userId || !category) {
        return c.json({ error: "Missing userId or category" }, 400);
    }
    const validCategories = [
        "fears",
        "goals",
        "past_failures",
        "transformation_vision",
        "core_struggle",
        "manifesto",
    ];
    if (!validCategories.includes(category)) {
        return c.json({
            error: `Invalid category. Use: ${validCategories.join(", ")}`,
        }, 400);
    }
    try {
        // Get identity data (primary psychological data source)
        const identity = await getIdentityData(userId, env);
        const userContext = await getUserContext(env, userId);
        // V3 PSYCHOLOGICAL WEAPONS - Updated intelligence categories
        const intelligenceMap = {
            fears: {
                data: {
                    shameTrigger: identity?.shame_trigger,
                    currentSelfSummary: identity?.current_self_summary,
                    breakingPointEvent: identity?.breaking_point_event,
                    relationshipDamage: identity?.relationship_damage_specific,
                },
                confrontationScript: `"Remember what disgusts you about yourself? '${identity?.shame_trigger}'. You're becoming exactly that right now with this excuse."`,
            },
            goals: {
                data: {
                    aspirationalGap: identity?.aspirational_identity_gap,
                    currentSelfSummary: identity?.current_self_summary,
                    nonNegotiableCommitment: identity?.non_negotiable_commitment,
                    warCry: identity?.war_cry_or_death_vision,
                },
                confrontationScript: `"You want: '${identity?.aspirational_identity_gap}'. But you're: '${identity?.current_self_summary}'. This excuse makes the gap wider."`,
            },
            past_failures: {
                data: {
                    sabotagePattern: identity?.self_sabotage_pattern,
                    accountabilityHistory: identity?.accountability_history,
                    financialPainPoint: identity?.financial_pain_point,
                },
                confrontationScript: `"Your pattern: '${identity?.self_sabotage_pattern}'. You're doing it again right now. Same emotion, same rationalization, same quit."`,
            },
            transformation_vision: {
                data: {
                    aspirationalGap: identity?.aspirational_identity_gap,
                    breakingPointEvent: identity?.breaking_point_event,
                    warCry: identity?.war_cry_or_death_vision,
                    nonNegotiableCommitment: identity?.non_negotiable_commitment,
                },
                confrontationScript: `"Your vision: '${identity?.aspirational_identity_gap}'. You said only '${identity?.breaking_point_event}' would force change. Why wait for catastrophe?"`,
            },
            core_struggle: {
                data: {
                    currentSelfSummary: identity?.current_self_summary,
                    sabotagePattern: identity?.self_sabotage_pattern,
                    accountabilityHistory: identity?.accountability_history,
                },
                confrontationScript: `"Who you are NOW: '${identity?.current_self_summary}'. Your quit pattern: '${identity?.self_sabotage_pattern}'. You're in it right now."`,
            },
            manifesto: {
                data: {
                    nonNegotiableCommitment: identity?.non_negotiable_commitment,
                    warCry: identity?.war_cry_or_death_vision,
                    relationshipDamage: identity?.relationship_damage_specific,
                    financialPainPoint: identity?.financial_pain_point,
                },
                confrontationScript: `"Your commitment: '${identity?.non_negotiable_commitment}'. Breaking this means: '${identity?.relationship_damage_specific}' was right about you."`,
            },
        };
        const intelligence = intelligenceMap[category];
        return c.json({
            success: true,
            category,
            intelligence: intelligence.data,
            confrontationScript: intelligence.confrontationScript,
            hasData: Object.values(intelligence.data).some((val) => val && typeof val === "string" && val.trim()),
            message: `Retrieved ${category} intelligence from identity data for targeted accountability`,
            dataSource: {
                identityData: identity ? true : false,
                identityFields: identity ? Object.keys(identity).length : 0,
                psychologicalDepth: identity ? "comprehensive" : "limited",
            },
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Onboarding intelligence retrieval failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
