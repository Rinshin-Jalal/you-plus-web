import { Env } from "@/index";
/**
 * 🔍 Extract Psychological Content from Real Call Conversations
 *
 * Analyzes transcript_json from actual accountability calls to extract genuine
 * psychological patterns, excuses, breakthroughs, and behavioral insights.
 * This replaces artificial identity→memory mappings with REAL conversation data.
 *
 * @param userId - User whose call history to analyze
 * @param env - Environment with database access
 * @returns Extracted psychological content from real conversations
 *
 * 🎯 Extraction Categories:
 * • Excuses: Real rationalization patterns from call transcripts
 * • Breakthroughs: Actual breakthrough moments captured in conversations
 * • Commitments: Promises made during accountability calls
 * • Triggers: Real trigger moments discussed in calls
 * • Patterns: Recurring behavioral themes from transcript analysis
 * • Emotions: Emotional states captured through conversation flow
 */
export declare function extractCallPsychologicalContent(userId: string, env: Env): Promise<{
    success: boolean;
    extractedContent: Array<{
        callId: string;
        contentType: string;
        textContent: string;
        callDate: string;
        callSuccess: string;
        confidence: number;
    }>;
    totalCalls: number;
    error?: string;
}>;
/**
 * 🚀 Generate Memory Embeddings from Real Call Conversations
 *
 * Creates searchable memory embeddings from REAL psychological content extracted
 * from accountability call transcripts. This provides dynamic, conversation-based
 * memories that complement static identity embeddings.
 *
 * @param userId - User to generate call-based memories for
 * @param env - Environment with database and OpenAI access
 * @returns Summary of generated call-based memory embeddings
 *
 * 💫 Call Memory Types:
 * • call_excuse - Real excuses from conversation transcripts
 * • call_breakthrough - Actual breakthrough moments in calls
 * • call_commitment - Promises made during accountability calls
 * • call_trigger - Trigger moments discussed in real conversations
 * • call_pattern - Behavioral patterns from transcript analysis
 * • call_emotion - Emotional states captured in conversations
 */
export declare function generateCallMemoryEmbeddings(userId: string, env: Env): Promise<{
    success: boolean;
    generated: number;
    embeddings_by_type: Record<string, number>;
    totalCallsProcessed: number;
    error?: string;
}>;
