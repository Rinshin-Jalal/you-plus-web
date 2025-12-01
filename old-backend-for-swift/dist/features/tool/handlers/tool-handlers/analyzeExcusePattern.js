// 🔍 NEW: Smart excuse pattern detection for confrontation
export const postToolAnalyzeExcusePattern = async (c) => {
    const { userId, currentExcuse } = await c.req.json();
    const env = c.env;
    if (!userId || !currentExcuse) {
        return c.json({ error: "Missing userId or currentExcuse" }, 400);
    }
    try {
        const { findExcusePatterns } = await import("@/services/embedding-service");
        const excuseAnalysis = await findExcusePatterns(userId, currentExcuse, env);
        return c.json({
            success: true,
            excuseAnalysis: {
                isRepeatedPattern: excuseAnalysis.similarExcuses.length > 0,
                timesPreviouslyUsed: excuseAnalysis.similarExcuses.length,
                severity: excuseAnalysis.similarExcuses.length > 3
                    ? "critical"
                    : excuseAnalysis.similarExcuses.length > 1
                        ? "high"
                        : "medium",
                similarExcuses: excuseAnalysis.similarExcuses.slice(0, 3),
                patternCategory: excuseAnalysis.category,
                confrontationStrength: excuseAnalysis.confrontationStrength,
                lastUsed: excuseAnalysis.similarExcuses[0]?.created_at || null,
            },
            confrontationScript: excuseAnalysis.similarExcuses.length > 0
                ? `"You've used this exact excuse ${excuseAnalysis.similarExcuses.length} times before. The last time was ${excuseAnalysis.similarExcuses[0]?.created_at}. You're stuck in a pattern."`
                : "This is a new excuse pattern - probe deeper into the underlying resistance.",
            message: `Excuse pattern analysis complete - ${excuseAnalysis.similarExcuses.length > 0
                ? "REPEAT PATTERN DETECTED"
                : "new pattern"}`,
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Excuse pattern analysis failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
