// 🧠 NEW: Advanced behavioral pattern analysis for AI agents
export const postToolAnalyzeBehavioralPatterns = async (c) => {
    const { userId } = await c.req.json();
    const env = c.env;
    if (!userId) {
        return c.json({ error: "Missing userId" }, 400);
    }
    try {
        const { detectBehavioralPatterns } = await import("@/services/embedding-service");
        const patterns = await detectBehavioralPatterns(userId, env);
        return c.json({
            success: patterns.success,
            behavioralAnalysis: patterns.success
                ? {
                    recurringExcuses: patterns.behavioralPatterns.recurringExcuses,
                    triggerEvolution: patterns.behavioralPatterns.triggerEvolution,
                    breakthroughCatalysts: patterns.behavioralPatterns.breakthroughCatalysts,
                    emotionalPatterns: patterns.behavioralPatterns.emotionalPatterns,
                    languageEvolution: patterns.behavioralPatterns.languageEvolution,
                    aiInsights: patterns.insights,
                    recommendedActions: patterns.recommendations,
                }
                : null,
            message: patterns.success
                ? "Comprehensive behavioral analysis complete"
                : "Behavioral analysis failed",
            details: patterns.error || undefined,
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Behavioral pattern analysis failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
