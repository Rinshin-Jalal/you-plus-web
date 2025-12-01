import { Env } from "@/index";
/**
 * 📚 Retrieve All Psychological Memory Embeddings for User
 *
 * Fetches the complete psychological memory bank for a user, including all
 * embedded patterns, excuses, breakthroughs, and behavioral data. Used for
 * comprehensive pattern analysis and personalized accountability responses.
 *
 * @param userId - Target user's psychological memory bank
 * @param env - Database environment configuration
 * @returns Complete memory embedding records with vectors and metadata
 *
 * 🧠 Returned Data Structure:
 * • id, user_id, source_id - Record identifiers
 * • content_type - Pattern category (excuse, breakthrough, etc.)
 * • text_content - Original psychological text
 * • embedding - 1536-dimensional vector
 * • metadata - Additional context and timestamps
 */
export declare function getMemoryEmbeddings(userId: string, env: Env): Promise<any[]>;
/**
 * 💾 Create New Psychological Memory Embedding
 *
 * Generates and stores a new memory embedding for psychological content. Each
 * memory becomes searchable via semantic similarity, enabling the AI to reference
 * past patterns, excuses, breakthroughs for personalized accountability.
 *
 * @param userId - User who owns this psychological memory
 * @param sourceId - Source identifier (call_id, identity_record_id, etc.)
 * @param contentType - Memory category (excuse, breakthrough, trigger_moment, etc.)
 * @param textContent - Actual psychological text to embed and remember
 * @param env - Environment with database and OpenAI access
 * @returns Created memory embedding record with generated vector
 *
 * 🔮 Memory Creation Process:
 * 1. Generate 1536-dimensional embedding vector via OpenAI
 * 2. Store in memory_embeddings table with metadata
 * 3. Enable future semantic search and pattern recognition
 * 4. Return complete record for immediate use
 */
export declare function createMemoryEmbedding(userId: string, sourceId: string, contentType: string, textContent: string, env: Env, extraMetadata?: Record<string, any>): Promise<any>;
/**
 * 🔍 Search Psychological Memory Bank via Semantic Similarity
 *
 * Finds similar psychological patterns from user's memory bank using vector
 * similarity search. Powers accountability calls with personalized references
 * to past behaviors, excuses, breakthroughs, and commitments.
 *
 * @param userId - User's psychological memory bank to search
 * @param query - Current psychological content to match against memories
 * @param matchThreshold - Similarity threshold (0.7 = 70% similar, 0.8 = stricter)
 * @param matchCount - Maximum similar memories to return (default: 5)
 * @param env - Environment with database and OpenAI access
 * @returns Ranked array of similar memories with similarity scores
 *
 * 🎯 Accountability Use Cases:
 * • Query: "I'm too busy today" → Find: Similar excuse patterns
 * • Query: "I want to give up" → Find: Past breakthrough moments
 * • Query: Current behavior → Find: Previous commitment violations
 *
 * 📊 Similarity Thresholds:
 * • 0.9+ = Nearly identical (exact pattern match)
 * • 0.8+ = Very similar (strong pattern recognition)
 * • 0.7+ = Similar theme (useful for accountability)
 * • 0.6+ = Loosely related (broader pattern detection)
 */
export declare function searchMemoryEmbeddings(userId: string, query: string, matchThreshold: number | undefined, matchCount: number | undefined, env: Env): Promise<any>;
/**
 * 🎯 Search Memories by Specific Content Types
 *
 * Specialized search that filters by psychological content types for targeted
 * accountability responses. Perfect for finding specific patterns like excuses,
 * breakthroughs, or trigger moments.
 *
 * @param userId - User's memory bank to search
 * @param query - Current psychological content to match
 * @param contentTypes - Array of content types to search within
 * @param matchThreshold - Similarity threshold (default: 0.7)
 * @param matchCount - Maximum results to return (default: 5)
 * @param env - Environment configuration
 * @returns Filtered and ranked similar memories by type
 *
 * 💡 Example Usage:
 * • searchPsychologicalPatterns(userId, "I'm too tired", ["excuse", "excuse_pattern"])
 * • searchPsychologicalPatterns(userId, "giving up", ["breakthrough", "vision"])
 * • searchPsychologicalPatterns(userId, "morning routine", ["trigger_moment", "commitment"])
 */
export declare function searchPsychologicalPatterns(userId: string, query: string, contentTypes: string[], matchThreshold: number | undefined, matchCount: number | undefined, env: Env): Promise<any>;
/**
 * 🧩 Build a compact payload for prompt enrichment from Top-K related memories
 * Returns a small object with related_memories and a one-line pattern_summary
 */
export declare function buildRelatedMemoriesPayload(userId: string, query: string, env: Env, matchThreshold?: number, matchCount?: number): Promise<{
    related_memories: Array<{
        text: string;
        date: string;
        emotion?: string;
    }>;
    pattern_summary: string;
}>;
/**
 * 📊 Get Memory Insights (Processed Data Instead of Raw Embeddings)
 *
 * Instead of exposing raw memory embeddings to UserContext, this function returns
 * processed insights, statistics, and behavioral indicators while protecting
 * sensitive psychological content.
 *
 * @param userId - User to analyze memory patterns for
 * @param env - Environment configuration
 * @returns Processed insights without raw memory content
 *
 * 🛡️ Privacy Protection:
 * • No raw psychological text content exposed
 * • Statistical summaries instead of specific memories
 * • Behavioral trend indicators without specific examples
 * • Count-based metrics for accountability patterns
 */
export declare function getMemoryInsights(userId: string, env: Env): Promise<{
    memoryStats: {
        totalMemories: number;
        recentMemories: number;
        contentTypeBreakdown: Record<string, number>;
        weeklyTrend: "increasing" | "decreasing" | "stable";
    };
    behavioralIndicators: {
        excuseFrequency: "high" | "moderate" | "low";
        breakthroughMoments: number;
        patternStrength: "strong" | "moderate" | "weak";
        emotionalTrend: "positive" | "negative" | "neutral";
    };
    accountabilitySignals: {
        recurringPatternCount: number;
        lastMemoryDate: string | null;
        criticalThemesCount: number;
        growthIndicators: number;
    };
    systemHealth: {
        memorySystemActive: boolean;
        lastProcessedAt: string;
        dataQualityScore: number;
    };
}>;
