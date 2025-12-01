/* ═══════════════════════════════════════════════════════════════════════════════
 * 🎙️ CALL-BASED EMBEDDING ANALYSIS SYSTEM
 *
 * Functions for analyzing real conversation transcripts and extracting psychological
 * patterns from accountability call data.
 * ═══════════════════════════════════════════════════════════════════════════════ */
import { createSupabaseClient } from "@/utils/database";
import { generateBatchEmbeddings } from "./core";
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
export async function extractCallPsychologicalContent(userId, env) {
    const supabase = createSupabaseClient(env);
    try {
        console.log(`🎙️ Extracting REAL psychological content from calls for user ${userId}`);
        // 📊 Get all calls with transcript data for the user
        const { data: calls, error: callsError } = await supabase
            .from("calls")
            .select("id, transcript_json, transcript_summary, created_at, call_successful, call_type, tone_used")
            .eq("user_id", userId)
            .not("transcript_json", "is", null)
            .order("created_at", { ascending: false });
        if (callsError) {
            console.error("💥 Failed to fetch call transcripts:", callsError);
            throw callsError;
        }
        if (!calls || calls.length === 0) {
            console.log("ℹ️ No call transcripts found for psychological extraction");
            return {
                success: true,
                extractedContent: [],
                totalCalls: 0,
            };
        }
        console.log(`📞 Processing ${calls.length} calls for psychological content extraction`);
        const extractedContent = [];
        // 🔄 Process each call transcript for psychological content
        for (const call of calls) {
            const transcript = call.transcript_json;
            if (!transcript || !Array.isArray(transcript))
                continue;
            // 💬 Combine all conversation turns into analyzable text
            const conversationText = transcript
                .map((turn) => `${turn.role}: ${turn.message}`)
                .join("\n");
            // 🎯 Extract different types of psychological content using AI analysis
            const psychologicalPatterns = await analyzeConversationPsychology(conversationText, call.transcript_summary, env);
            // 📦 Package extracted content with call metadata
            psychologicalPatterns.forEach((pattern) => {
                extractedContent.push({
                    callId: call.id,
                    contentType: pattern.type,
                    textContent: pattern.content,
                    callDate: call.created_at,
                    callSuccess: call.call_successful || "unknown",
                    confidence: pattern.confidence,
                    // propagate call metadata for enrichment downstream
                    // @ts-ignore
                    callType: call.call_type,
                    // @ts-ignore
                    toneUsed: call.tone_used,
                });
            });
        }
        console.log(`✅ Extracted ${extractedContent.length} psychological patterns from ${calls.length} calls`);
        return {
            success: true,
            extractedContent,
            totalCalls: calls.length,
        };
    }
    catch (error) {
        console.error("💥 Call psychological extraction failed:", error);
        return {
            success: false,
            extractedContent: [],
            totalCalls: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
/**
 * 🧠 AI-Powered Conversation Psychology Analysis
 *
 * Uses OpenAI to analyze conversation transcripts and extract psychological
 * patterns, identifying excuses, breakthroughs, commitments, and emotional states
 * from real accountability call conversations.
 */
async function analyzeConversationPsychology(conversationText, summary, env) {
    try {
        const analysisPrompt = `
Analyze this accountability call conversation and extract psychological patterns:

CONVERSATION:
${conversationText}

SUMMARY: ${summary}

Extract and categorize the following psychological content:

1. EXCUSES - Any rationalizations, justifications, or excuses the user made
2. BREAKTHROUGHS - Moments of insight, realizations, or commitment 
3. COMMITMENTS - Specific promises or commitments the user made
4. TRIGGERS - Discussed trigger moments or vulnerability windows
5. PATTERNS - Recurring behavioral patterns mentioned
6. EMOTIONS - Emotional states expressed (fear, regret, determination, etc.)

Return ONLY a JSON array with this format:
[{"type": "excuse", "content": "exact text", "confidence": 0.8}]

Focus on extracting the user's actual words and psychological insights, not the AI assistant's responses.
`;
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o", // Use latest model for accurate psychological analysis
                messages: [{ role: "user", content: analysisPrompt }],
                temperature: 0.1, // Low temperature for consistent extraction
                max_tokens: 2000,
            }),
        });
        if (!response.ok) {
            throw new Error(`OpenAI analysis failed: ${response.status}`);
        }
        const result = await response.json();
        const analysisText = result.choices[0]?.message?.content || "[]";
        // 🔍 Parse AI response as JSON
        try {
            const patterns = JSON.parse(analysisText);
            return Array.isArray(patterns) ? patterns : [];
        }
        catch (parseError) {
            console.error("Failed to parse psychology analysis:", parseError);
            return [];
        }
    }
    catch (error) {
        console.error("AI conversation analysis failed:", error);
        return [];
    }
}
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
export async function generateCallMemoryEmbeddings(userId, env) {
    try {
        console.log(`🚀 Generating call-based memory embeddings for user ${userId}`);
        // 🎙️ Extract psychological content from real conversations
        const extractionResult = await extractCallPsychologicalContent(userId, env);
        if (!extractionResult.success ||
            extractionResult.extractedContent.length === 0) {
            return {
                success: true,
                generated: 0,
                embeddings_by_type: {},
                totalCallsProcessed: extractionResult.totalCalls,
                error: "No psychological content extracted from calls",
            };
        }
        const supabase = createSupabaseClient(env);
        // 📦 Prepare call-based memory records
        const texts = extractionResult.extractedContent.map((content) => content.textContent);
        const embeddings = await generateBatchEmbeddings(texts, env);
        const callMemoryRecords = extractionResult.extractedContent.map((content, index) => ({
            user_id: userId,
            source_id: content.callId, // Link to specific call
            // Map categories to allowed types is handled earlier; keep as pattern fallback if needed
            content_type: "pattern",
            text_content: content.textContent,
            embedding: embeddings[index],
            metadata: {
                source: "call_transcript",
                call_date: content.callDate,
                call_success: content.callSuccess,
                confidence: content.confidence,
                // @ts-ignore
                call_type: content.callType,
                // @ts-ignore
                tone_used: content.toneUsed,
                generated_at: new Date().toISOString(),
            },
        }));
        // 💾 Batch insert call-based memories
        const { data: insertedEmbeddings, error: insertError } = await supabase
            .from("memory_embeddings")
            .insert(callMemoryRecords)
            .select("content_type");
        if (insertError) {
            console.error("💥 Failed to insert call memory embeddings:", insertError);
            throw insertError;
        }
        // 📊 Count embeddings by type
        const embeddingsByType = {};
        insertedEmbeddings.forEach((embedding) => {
            embeddingsByType[embedding.content_type] =
                (embeddingsByType[embedding.content_type] || 0) + 1;
        });
        console.log(`✅ Generated call-based memory bank:`);
        Object.entries(embeddingsByType).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count} memories`);
        });
        return {
            success: true,
            generated: insertedEmbeddings.length,
            embeddings_by_type: embeddingsByType,
            totalCallsProcessed: extractionResult.totalCalls,
        };
    }
    catch (error) {
        console.error("💥 Call memory embedding generation failed:", error);
        return {
            success: false,
            generated: 0,
            embeddings_by_type: {},
            totalCallsProcessed: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
