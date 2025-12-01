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
// 💥 NEW: Deliver personalized consequences using behavioral data
export const postToolDeliverConsequence = async (c) => {
    const { userId, excuseText, escalationLevel = "standard" } = await c.req
        .json();
    const env = c.env;
    if (!userId || !excuseText) {
        return c.json({ error: "Missing userId or excuseText" }, 400);
    }
    const validLevels = ["standard", "harsh", "nuclear"];
    if (!validLevels.includes(escalationLevel)) {
        return c.json({
            error: `Invalid escalation level. Use: ${validLevels.join(", ")}`,
        }, 400);
    }
    try {
        const userContext = await getUserContext(env, userId);
        const identity = await getIdentityData(userId, env);
        // Import consequence functions
        const { generateHarshConsequence, generateStandardConsequence } = await import("@/services/prompt-engine");
        // Analyze excuse pattern
        const { searchMemoryEmbeddings } = await import("@/services/embedding-service");
        const similarExcuses = await searchMemoryEmbeddings(userId, excuseText, 0.8, 10, env);
        // Performance analysis
        const kept = userContext.recentStreakPattern?.filter((p) => p.status === "kept").length || 0;
        const broken = userContext.recentStreakPattern?.filter((p) => p.status === "broken").length || 0;
        const successRate = kept + broken > 0
            ? Math.round((kept / (kept + broken)) * 100)
            : 0;
        // Generate consequence based on escalation level and performance
        let consequence;
        let personalizedScript = "";
        if (escalationLevel === "nuclear" ||
            (escalationLevel === "harsh" && successRate < 40)) {
            consequence = generateHarshConsequence();
        }
        else {
            consequence = generateStandardConsequence();
        }
        // Add devastating personalization using identity data
        if (identity?.nightmare_self) {
            personalizedScript +=
                `This excuse is turning you into exactly what you fear: "${identity.nightmare_self}". `;
        }
        if (identity?.desired_outcome) {
            personalizedScript +=
                `You said you wanted "${identity.desired_outcome}" but this excuse betrays that completely. `;
        }
        if (similarExcuses.length > 0) {
            personalizedScript +=
                `You've used this exact excuse ${similarExcuses.length} times before. You're stuck in a pattern. `;
        }
        if (identity?.final_oath) {
            personalizedScript +=
                `Your sacred oath says "${identity.final_oath}" - this excuse violates your core identity.`;
        }
        if (identity?.current_struggle &&
            excuseText.toLowerCase().includes(identity.current_struggle.toLowerCase())) {
            personalizedScript +=
                ` This is your known struggle pattern: "${identity.current_struggle}". You're falling into your predictable pattern.`;
        }
        // Save the excuse for future pattern analysis
        const { createMemoryEmbedding } = await import("@/services/embedding-service");
        await createMemoryEmbedding(userId, `excuse-${Date.now()}`, "excuse", excuseText, env);
        return c.json({
            success: true,
            consequence,
            personalizedScript,
            escalationLevel,
            patternAnalysis: {
                isRepeatedExcuse: similarExcuses.length > 0,
                timesPreviouslyUsed: similarExcuses.length,
                successRate: successRate,
                severity: similarExcuses.length > 3
                    ? "critical"
                    : similarExcuses.length > 1
                        ? "high"
                        : "medium",
            },
            message: `Delivered ${escalationLevel} consequence with personalized confrontation`,
            fullResponse: `${consequence} ${personalizedScript}`.trim(),
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Consequence delivery failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
