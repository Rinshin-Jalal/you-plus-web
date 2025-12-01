/* ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 IDENTITY MEMORY EMBEDDING SYSTEM
 *
 * Functions that generate comprehensive memory embeddings from identity table data.
 * ═══════════════════════════════════════════════════════════════════════════════ */
import { createSupabaseClient } from "@/utils/database";
import { generateBatchEmbeddings } from "./core";
/**
 * 🧠 Generate Complete Memory Bank from Identity Table Data
 *
 * Automatically creates memory embeddings from all psychological data in the
 * user's identity record. Maps 12+ identity fields to appropriate content types
 * and generates searchable embeddings for personalized accountability calls.
 *
 * @param userId - User to generate memory bank for
 * @param env - Environment with database and OpenAI access
 * @returns Summary of generated embeddings by content type
 *
 * 🗺️ Identity → Memory Mapping:
 * • current_struggle → "self_deception"
 * • nightmare_self → "nightmare_fear"
 * • last_broken_promise → "broken_promise"
 * • most_common_slip_moment → "trigger_moment"
 * • derail_trigger → removed in BIGBRUH migration
 * • empty_excuse → "excuse"
 * • weak_excuse_counter → "excuse_pattern"
 * • desired_outcome → "vision"
 * • daily_non_negotiable → "commitment"
 * • regret_if_no_change → "regret_fear"
 * • meaning_of_breaking_contract → "betrayal_cost"
 * • external_judgment → "shame_source"
 * • final_oath → "sacred_oath"
 * • final_oath → "binding_commitment"
 *
 * 💫 This creates a comprehensive psychological memory bank that enables:
 * • "You said this same excuse pattern before..."
 * • "Remember your commitment to never become..."
 * • "This sounds like your trigger moment from onboarding..."
 */
export async function generateIdentityMemoryEmbeddings(userId, env) {
    const supabase = createSupabaseClient(env);
    try {
        console.log(`🧠 Generating complete memory bank from identity data for user ${userId}`);
        // 📊 Fetch complete identity record
        const { data: identity, error: identityError } = await supabase
            .from("identity")
            .select("*")
            .eq("user_id", userId)
            .single();
        if (identityError || !identity) {
            console.error("💥 No identity record found:", identityError);
            return {
                success: false,
                generated: 0,
                embeddings_by_type: {},
                error: "No identity record found for user",
            };
        }
        // 🗺️ Map identity fields to memory content types
        const memoryMappings = [
            { field: "current_struggle", contentType: "self_deception" },
            { field: "nightmare_self", contentType: "nightmare_fear" },
            { field: "last_broken_promise", contentType: "broken_promise" },
            { field: "most_common_slip_moment", contentType: "trigger_moment" },
            // derail_trigger field removed in BIGBRUH schema migration
            { field: "empty_excuse", contentType: "excuse" },
            { field: "weak_excuse_counter", contentType: "excuse_pattern" },
            { field: "desired_outcome", contentType: "vision" },
            { field: "daily_non_negotiable", contentType: "commitment" },
            { field: "regret_if_no_change", contentType: "regret_fear" },
            { field: "meaning_of_breaking_contract", contentType: "betrayal_cost" },
            { field: "external_judgment", contentType: "shame_source" },
            { field: "final_oath", contentType: "sacred_oath" },
            { field: "final_oath", contentType: "binding_commitment" },
        ];
        // 📦 Collect valid psychological content for batch processing
        const validMemories = [];
        memoryMappings.forEach((mapping) => {
            const textContent = identity[mapping.field];
            if (textContent && textContent.trim().length > 0) {
                validMemories.push({
                    contentType: mapping.contentType,
                    textContent: textContent.trim(),
                });
            }
        });
        if (validMemories.length === 0) {
            console.log("⚠️ No valid psychological content found in identity record");
            return {
                success: true,
                generated: 0,
                embeddings_by_type: {},
                error: "No psychological content to embed",
            };
        }
        console.log(`📦 Found ${validMemories.length} psychological fields to embed`);
        // ⚡ Generate embeddings in batch for efficiency
        const texts = validMemories.map((m) => m.textContent);
        const embeddings = await generateBatchEmbeddings(texts, env);
        // 💾 Store all embeddings with proper metadata
        const embeddingRecords = validMemories.map((memory, index) => ({
            user_id: userId,
            source_id: identity.id, // Link back to identity record
            content_type: memory.contentType,
            text_content: memory.textContent,
            embedding: embeddings[index],
            metadata: {
                source: "identity_table",
                generated_at: new Date().toISOString(),
                identity_field: memoryMappings.find((m) => m.contentType === memory.contentType)?.field,
            },
        }));
        // 🗂️ Batch insert all memory embeddings
        const { data: insertedEmbeddings, error: insertError } = await supabase
            .from("memory_embeddings")
            .insert(embeddingRecords)
            .select("content_type");
        if (insertError) {
            console.error("💥 Failed to insert memory embeddings:", insertError);
            throw insertError;
        }
        // 📊 Count embeddings by type for summary
        const embeddingsByType = {};
        insertedEmbeddings.forEach((embedding) => {
            embeddingsByType[embedding.content_type] =
                (embeddingsByType[embedding.content_type] || 0) + 1;
        });
        console.log(`✅ Generated complete psychological memory bank:`);
        Object.entries(embeddingsByType).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count} memories`);
        });
        return {
            success: true,
            generated: insertedEmbeddings.length,
            embeddings_by_type: embeddingsByType,
        };
    }
    catch (error) {
        console.error("💥 Identity memory generation failed:", error);
        return {
            success: false,
            generated: 0,
            embeddings_by_type: {},
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
/**
 * 🔄 Update Memory Embeddings When Identity Changes
 *
 * Efficiently updates only changed psychological fields when identity record
 * is modified. Compares current identity data with previously embedded content
 * and generates new embeddings only for changed fields.
 *
 * @param userId - User whose identity was updated
 * @param env - Environment with database and OpenAI access
 * @returns Summary of updated embeddings
 */
export async function updateIdentityMemoryEmbeddings(userId, env) {
    try {
        console.log(`🔄 Checking for identity changes and updating memory embeddings for user ${userId}`);
        // For now, we'll do a simple regeneration approach
        // In the future, we could add logic to compare existing embeddings
        // and only update changed fields
        // 🗑️ Remove existing identity-sourced embeddings
        const supabase = createSupabaseClient(env);
        await supabase
            .from("memory_embeddings")
            .delete()
            .eq("user_id", userId)
            .contains("metadata", { source: "identity_table" });
        // 🧠 Generate fresh embeddings from current identity
        const result = await generateIdentityMemoryEmbeddings(userId, env);
        console.log(`✅ Updated identity memory embeddings: ${result.generated} new embeddings`);
        return {
            success: result.success,
            updated: result.generated,
            embeddings_by_type: result.embeddings_by_type,
            ...(result.error && { error: result.error }),
        };
    }
    catch (error) {
        console.error("💥 Identity memory update failed:", error);
        return {
            success: false,
            updated: 0,
            embeddings_by_type: {},
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
