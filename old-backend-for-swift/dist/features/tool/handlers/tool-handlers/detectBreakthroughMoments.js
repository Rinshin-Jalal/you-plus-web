// 💡 NEW: Breakthrough moment detection for positive reinforcement
export const postToolDetectBreakthroughMoments = async (c) => {
    const { userId, currentChallenge } = await c.req.json();
    const env = c.env;
    if (!userId || !currentChallenge) {
        return c.json({ error: "Missing userId or currentChallenge" }, 400);
    }
    try {
        const { findBreakthroughMoments } = await import("@/services/embedding-service");
        const breakthroughAnalysis = await findBreakthroughMoments(userId, currentChallenge, env);
        return c.json({
            success: true,
            breakthroughAnalysis: {
                hasSimilarBreakthroughs: breakthroughAnalysis.similarBreakthroughs.length > 0,
                relevantMoments: breakthroughAnalysis.similarBreakthroughs.slice(0, 3),
                successPattern: breakthroughAnalysis.category,
                confidenceBooster: breakthroughAnalysis.confidenceBooster,
                lastSuccess: breakthroughAnalysis.similarBreakthroughs[0]?.created_at ||
                    null,
            },
            motivationScript: breakthroughAnalysis.similarBreakthroughs.length > 0
                ? `"Remember when you faced ${breakthroughAnalysis.similarBreakthroughs[0]?.text_content}? You broke through that. You have the strength to do this too."`
                : "This is new territory - you're growing beyond your previous limits. That's exactly where transformation happens.",
            reinforcementTechnique: breakthroughAnalysis.category === "momentum"
                ? "Build on existing success patterns"
                : breakthroughAnalysis.category === "resistance"
                    ? "Address the core resistance first"
                    : "Create new neural pathways through small wins",
            message: `Breakthrough analysis complete - ${breakthroughAnalysis.similarBreakthroughs.length > 0
                ? "SUCCESS PATTERN IDENTIFIED"
                : "new growth opportunity"}`,
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Breakthrough moment analysis failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
