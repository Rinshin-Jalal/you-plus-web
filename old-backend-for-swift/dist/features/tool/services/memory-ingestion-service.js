/* ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 AUTOMATIC MEMORY INGESTION SERVICE
 *
 * Automatically creates memory embeddings when key events occur in the system.
 * Triggered by calls completing, promises being broken, etc.
 * ═══════════════════════════════════════════════════════════════════════════════ */
import { createMemoryEmbedding } from "@/services/embedding-services/memory";
import { createSupabaseClient } from "@/features/core/utils/database";
/**
 * 🎙️ Ingest Call Memories Automatically
 *
 * Called when a call record is inserted/updated with transcript data.
 * Extracts psychological content and creates memory embeddings.
 */
export async function ingestCallMemories(callId, userId, env) {
    try {
        console.log(`🧠 Ingesting memories from call ${callId} for user ${userId}`);
        const supabase = createSupabaseClient(env);
        // Get the call data
        const { data: call, error } = await supabase
            .from("calls")
            .select("*")
            .eq("id", callId)
            .eq("user_id", userId)
            .single();
        if (error || !call) {
            console.error("Failed to fetch call for memory ingestion:", error);
            return;
        }
        // Skip if no transcript available
        if (!call.transcript_summary && !call.transcript_json) {
            console.log(`📝 No transcript available for call ${callId}, skipping memory ingestion`);
            return;
        }
        const sourceId = call.id;
        const callMetadata = {
            source: "call",
            call_type: call.call_type,
            call_date: call.created_at,
            tone_used: call.confidence_scores?.tone || "unknown",
            call_successful: call.call_successful,
            duration_sec: call.duration_sec,
        };
        // Ingest transcript summary if available
        if (call.transcript_summary) {
            await createMemoryEmbedding(userId, sourceId, "transcript_summary", call.transcript_summary, env, {
                ...callMetadata,
                content_type: "transcript_summary",
            });
        }
        // Extract and ingest specific psychological patterns from transcript
        if (call.transcript_json) {
            await extractAndIngestCallPatterns(userId, sourceId, call.transcript_json, callMetadata, env);
        }
        console.log(`✅ Successfully ingested memories from call ${callId}`);
    }
    catch (error) {
        console.error(`💥 Failed to ingest call memories for ${callId}:`, error);
    }
}
/**
 * 💔 Ingest Promise Memories Automatically
 *
 * Called when a promise is broken or excuse is added.
 * Creates memory embeddings for excuse patterns and broken commitments.
 */
export async function ingestPromiseMemories(promiseId, userId, env) {
    try {
        console.log(`🧠 Ingesting memories from promise ${promiseId} for user ${userId}`);
        const supabase = createSupabaseClient(env);
        // Get the promise data
        const { data: promise, error } = await supabase
            .from("promises")
            .select("*")
            .eq("id", promiseId)
            .eq("user_id", userId)
            .single();
        if (error || !promise) {
            console.error("Failed to fetch promise for memory ingestion:", error);
            return;
        }
        const sourceId = promise.id;
        const promiseMetadata = {
            source: "promise",
            promise_status: promise.status,
            priority_level: promise.priority_level,
            category: promise.category,
            created_at: promise.created_at,
            due_date: promise.due_date,
        };
        // Ingest the original promise text
        if (promise.promise_text) {
            const contentType = promise.status === "broken" ? "broken_commitment" : "commitment";
            await createMemoryEmbedding(userId, sourceId, contentType, promise.promise_text, env, {
                ...promiseMetadata,
                content_type: contentType,
            });
        }
        // Ingest excuse text if promise is broken
        if (promise.status === "broken" && promise.excuse_text) {
            await createMemoryEmbedding(userId, sourceId, "excuse", promise.excuse_text, env, {
                ...promiseMetadata,
                content_type: "excuse",
                critical_pattern: true, // Mark excuses as critical patterns
            });
        }
        console.log(`✅ Successfully ingested memories from promise ${promiseId}`);
    }
    catch (error) {
        console.error(`💥 Failed to ingest promise memories for ${promiseId}:`, error);
    }
}
/**
 * 🎯 Extract Psychological Patterns from Call Transcript
 *
 * Analyzes transcript JSON to identify and extract specific psychological
 * content types like excuses, breakthroughs, triggers, etc.
 */
async function extractAndIngestCallPatterns(userId, sourceId, transcriptJson, baseMetadata, env) {
    try {
        // Simple pattern matching - would use AI analysis in production
        const transcript = JSON.stringify(transcriptJson).toLowerCase();
        // Look for excuse patterns
        const excusePatterns = [
            "i don't have time", "too busy", "forgot", "will do it tomorrow",
            "something came up", "too tired", "not feeling well", "family emergency"
        ];
        const breakthroughPatterns = [
            "i realize", "breakthrough", "understand now", "got it", "makes sense",
            "i see", "clarity", "revelation", "aha moment"
        ];
        const commitmentPatterns = [
            "i commit", "i promise", "i will", "going to", "plan to", "dedicated"
        ];
        // Extract excuse patterns
        for (const pattern of excusePatterns) {
            if (transcript.includes(pattern)) {
                const context = extractContextAroundPattern(transcriptJson, pattern);
                if (context) {
                    await createMemoryEmbedding(userId, sourceId, "excuse", context, env, {
                        ...baseMetadata,
                        content_type: "excuse",
                        pattern_detected: pattern,
                        critical_pattern: true,
                    });
                }
            }
        }
        // Extract breakthrough patterns
        for (const pattern of breakthroughPatterns) {
            if (transcript.includes(pattern)) {
                const context = extractContextAroundPattern(transcriptJson, pattern);
                if (context) {
                    await createMemoryEmbedding(userId, sourceId, "breakthrough", context, env, {
                        ...baseMetadata,
                        content_type: "breakthrough",
                        pattern_detected: pattern,
                        growth_indicator: true,
                    });
                }
            }
        }
        // Extract commitment patterns
        for (const pattern of commitmentPatterns) {
            if (transcript.includes(pattern)) {
                const context = extractContextAroundPattern(transcriptJson, pattern);
                if (context) {
                    await createMemoryEmbedding(userId, sourceId, "commitment", context, env, {
                        ...baseMetadata,
                        content_type: "commitment",
                        pattern_detected: pattern,
                    });
                }
            }
        }
    }
    catch (error) {
        console.error("Failed to extract call patterns:", error);
    }
}
/**
 * 📝 Extract Context Around Pattern
 *
 * Finds the context (surrounding sentences) around a detected pattern
 * in the transcript JSON.
 */
function extractContextAroundPattern(transcriptJson, pattern) {
    try {
        // Simple implementation - would use more sophisticated NLP in production
        const fullText = JSON.stringify(transcriptJson);
        const patternIndex = fullText.toLowerCase().indexOf(pattern);
        if (patternIndex === -1)
            return null;
        // Extract ~100 characters before and after the pattern
        const start = Math.max(0, patternIndex - 100);
        const end = Math.min(fullText.length, patternIndex + pattern.length + 100);
        return fullText.substring(start, end).trim();
    }
    catch (error) {
        console.error("Failed to extract pattern context:", error);
        return null;
    }
}
