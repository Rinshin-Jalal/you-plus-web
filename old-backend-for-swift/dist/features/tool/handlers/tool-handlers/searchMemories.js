import { searchMemoryEmbeddings } from "@/services/embedding-service";
export async function postToolSearchMemories(c) {
    const { userId, query } = await c.req.json();
    const env = c.env;
    if (!userId || !query) {
        return c.json({ error: "Missing userId or query" }, 400);
    }
    try {
        const results = await searchMemoryEmbeddings(userId, query, 0.7, 5, env);
        return c.json({
            success: true,
            memories: results,
            count: results.length,
            message: results.length > 0 ? "Found similar patterns" : "No patterns found",
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Memory search failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
}
