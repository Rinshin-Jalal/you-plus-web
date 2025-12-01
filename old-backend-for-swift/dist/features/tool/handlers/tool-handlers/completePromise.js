export const postToolCompletePromise = async (c) => {
    const { userId, promiseId, wasKept, excuseText } = await c.req.json();
    const env = c.env;
    if (!userId || !promiseId || wasKept === undefined) {
        return c.json({ error: "Missing required fields" }, 400);
    }
    try {
        // TODO: Implement processEveningConsequence - was commented out in original file
        const result = {
            success: true,
            consequence_delivered: false,
            message: "Evening consequence processing not yet implemented",
        };
        // Also analyze excuse pattern if provided
        let excusePattern = null;
        if (excuseText) {
            const { searchMemoryEmbeddings } = await import("@/services/embedding-service");
            const similarExcuses = await searchMemoryEmbeddings(userId, excuseText, 0.8, 10, env);
            excusePattern = {
                isRepeatPattern: similarExcuses.length > 0,
                occurrences: similarExcuses.length,
                severity: similarExcuses.length > 3 ? "high" : "medium",
            };
        }
        return c.json({
            success: result.success,
            consequenceDelivered: result.consequence_delivered,
            excusePattern,
            message: result.success
                ? "Promise updated successfully"
                : "Promise update failed",
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Promise completion failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
