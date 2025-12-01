import { getUserContext } from "@/features/core/utils/database";
export async function postToolGetExcuseHistory(c) {
    const { userId, limit = 5 } = await c.req.json();
    const env = c.env;
    if (!userId) {
        return c.json({ error: "Missing userId" }, 400);
    }
    try {
        const userContext = await getUserContext(env, userId);
        const { memoryInsights } = userContext;
        // Get excuse count from the new structure
        const excuseCount = memoryInsights?.countsByType?.excuse || 0;
        const topExcuseCount = memoryInsights?.topExcuseCount7d || 0;
        // Generate synthetic excuses data based on available patterns
        const excuses = [];
        if (topExcuseCount > 0) {
            // Use emerging patterns if available to create more specific excuse data
            const excusePatterns = memoryInsights?.emergingPatterns?.filter((p) => p.sampleText && p.recentCount > 0) || [];
            for (let i = 0; i < Math.min(limit, Math.max(excusePatterns.length, 1)); i++) {
                const pattern = excusePatterns[i];
                if (pattern) {
                    excuses.push({
                        text: pattern.sampleText,
                        date: new Date().toISOString(),
                        timesUsed: pattern.recentCount,
                        growthFactor: pattern.growthFactor
                    });
                }
                else {
                    // Fallback generic excuse data
                    excuses.push({
                        text: "Generic excuse pattern detected",
                        date: new Date().toISOString(),
                        timesUsed: 1,
                        growthFactor: 1.0
                    });
                }
            }
        }
        return c.json({
            success: true,
            excuses,
            totalCount: topExcuseCount,
            excuseTypeCount: excuseCount,
            message: topExcuseCount > 0
                ? `Found ${topExcuseCount} recent excuses to confront (${excuseCount} total patterns)`
                : "No recent excuse patterns found",
            confrontationSuggestion: excuses.length > 0 && excuses[0]
                ? `"You've used the excuse '${excuses[0].text}' ${excuses[0].timesUsed} time${excuses[0].timesUsed !== 1 ? 's' : ''} recently. What makes today different?"`
                : null,
            insights: {
                countsByType: memoryInsights?.countsByType || {},
                topExcuseCount7d: topExcuseCount,
                emergingPatterns: memoryInsights?.emergingPatterns || []
            }
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Excuse history retrieval failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
}
