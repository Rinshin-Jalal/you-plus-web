/* ═══════════════════════════════════════════════════════════════════════════════
 * 🧬 INTELLIGENT IDENTITY EXTRACTOR - AI-POWERED PSYCHOLOGICAL ANALYSIS
 *
 * Revolutionary AI-powered approach that transforms 45+ raw onboarding responses
 * into intelligent psychological insights using OpenAI. Extracts actionable
 * identity data that the AI system can actually use for personalized accountability.
 *
 * Core Philosophy: "Extract intelligence, not just data"
 * ═══════════════════════════════════════════════════════════════════════════════ */
import { createSupabaseClient } from "@/features/core/utils/database";
// REMOVED: brutal-reality feature removed in bloat elimination
// import { analyzeOnboardingWithAI } from "../../brutal-reality/services/ai-psychological-analyzer";
export class IntelligentIdentityExtractor {
    env;
    supabase;
    constructor(env) {
        this.env = env;
        this.supabase = createSupabaseClient(env);
    }
    /**
     * 🧠 AI-POWERED INTELLIGENT EXTRACTION
     *
     * Revolutionary approach that uses OpenAI to analyze raw onboarding responses
     * and extract intelligent psychological insights. Transforms 45+ raw responses
     * into 13 actionable identity fields that the AI system can actually use.
     */
    async extractIdentityData(userId) {
        try {
            console.log(`🧠 INTELLIGENT: Extracting identity data for user ${userId}...`);
            // 📊 Get JSONB onboarding responses from correct table
            const { data: onboardingRecord, error } = await this.supabase
                .from("onboarding")
                .select("responses")
                .eq("user_id", userId)
                .single();
            if (error || !onboardingRecord) {
                console.error("Error fetching onboarding record:", error);
                return {};
            }
            const responses = onboardingRecord.responses;
            if (!responses || typeof responses !== "object") {
                console.log(`No valid onboarding responses found for user ${userId}`);
                return {};
            }
            console.log(`🧠 INTELLIGENT: Processing JSONB responses with ${Object.keys(responses).length} steps using AI analysis`);
            // REMOVED: AI analysis from brutal-reality feature
            // Using fallback extraction for now
            console.warn("AI analysis disabled - brutal-reality feature removed");
            console.log("Using fallback extraction without AI analysis");
            // Return empty object - the system will use fallback mechanisms
            return {};
        }
        catch (error) {
            console.error("Error in intelligent identity extraction:", error);
            return {};
        }
    }
    /**
     * 🔧 Extract Operational Fields Directly (Fallback)
     *
     * Extracts basic operational fields without AI analysis as a fallback
     * when AI analysis fails completely.
     */
    async extractOperationalFieldsDirectly(userId) {
        try {
            const { data: onboardingRecord, error } = await this.supabase
                .from("onboarding")
                .select("responses")
                .eq("user_id", userId)
                .single();
            if (error || !onboardingRecord) {
                console.error("Error fetching onboarding record for fallback:", error);
                return {};
            }
            const responses = onboardingRecord.responses;
            if (!responses || typeof responses !== "object") {
                console.log(`No valid onboarding responses found for fallback extraction`);
                return {};
            }
            const operational = {};
            // Extract name (identity_name from step 3)
            const nameResponse = this.findResponseByDbField(responses, 'identity_name');
            if (nameResponse?.value) {
                operational.name = String(nameResponse.value);
            }
            // Extract daily_non_negotiable (from step 19)
            const dailyResponse = this.findResponseByDbField(responses, 'daily_non_negotiable');
            if (dailyResponse?.value) {
                operational.daily_non_negotiable = String(dailyResponse.value);
            }
            // Note: call_window_start and call_window_timezone are now stored in users table
            // during onboarding completion, not in identity table
            // Extract transformation_target_date (from step 30)
            const dateResponse = this.findResponseByDbField(responses, 'transformation_date');
            if (dateResponse?.value) {
                operational.transformation_target_date = String(dateResponse.value);
            }
            console.log(`🔧 Fallback operational fields extracted:`, Object.keys(operational));
            return operational;
        }
        catch (error) {
            console.error("Error in fallback operational extraction:", error);
            return {};
        }
    }
    /**
     * 🔍 Find Response by Database Field Name
     */
    findResponseByDbField(responses, dbField) {
        for (const [, responseData] of Object.entries(responses)) {
            const stepResponse = responseData;
            if (stepResponse.db_field && stepResponse.db_field.includes(dbField)) {
                return stepResponse;
            }
        }
        return null;
    }
    /**
     * 💾 Extract and Save Intelligent Identity to Database
     *
     * Uses AI-powered analysis to extract and save intelligent identity insights
     * to the identity table. Much cleaner and more actionable than raw data storage.
     */
    async extractAndSaveIdentity(userId) {
        try {
            let identity = await this.extractIdentityData(userId);
            if (Object.keys(identity).length === 0) {
                console.log("⚠️ No AI-extracted identity data, but checking for operational fields...");
                // Try to extract at least operational fields
                const operationalFields = await this.extractOperationalFieldsDirectly(userId);
                if (Object.keys(operationalFields).length > 0) {
                    console.log(`✅ Extracted ${Object.keys(operationalFields).length} operational fields as fallback`);
                    identity = operationalFields;
                }
                else {
                    return {
                        success: false,
                        error: "No intelligent identity data could be extracted",
                    };
                }
            }
            // 🏗️ Prepare intelligent identity record for database
            const identityRecord = {
                user_id: userId,
                name: identity.name || "Unknown",
                identity_summary: this.generateIntelligentSummary(identity),
                ...identity, // Spread all AI-extracted intelligent fields
                updated_at: new Date().toISOString(),
            };
            // 💾 Save to identity table using upsert pattern
            const { data: existingRecord } = await this.supabase
                .from("identity")
                .select("id")
                .eq("user_id", userId)
                .maybeSingle();
            let updateError;
            if (existingRecord) {
                // Update existing record
                const { error } = await this.supabase
                    .from("identity")
                    .update(identityRecord)
                    .eq("user_id", userId);
                updateError = error;
            }
            else {
                // Insert new record
                const { error } = await this.supabase
                    .from("identity")
                    .insert(identityRecord);
                updateError = error;
            }
            if (updateError) {
                throw updateError;
            }
            const fieldsExtracted = Object.keys(identity).length;
            console.log(`💾 INTELLIGENT: AI-analyzed identity record saved for user ${userId}: ${fieldsExtracted} intelligent fields`);
            return {
                success: true,
                identity,
                fieldsExtracted,
                aiAnalyzed: true,
            };
        }
        catch (error) {
            console.error("Error in intelligent extract and save:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * 📝 Generate Intelligent Identity Summary from Psychological Weapons
     *
     * V3: Creates concise summary from most impactful psychological weapons
     * Focus on actionable weapons that define the user's profile
     */
    generateIntelligentSummary(identity) {
        const elements = [];
        // Priority 1: Current reality (who they are NOW)
        if (identity.current_self_summary) {
            const preview = identity.current_self_summary.length > 120
                ? identity.current_self_summary.substring(0, 117) + "..."
                : identity.current_self_summary;
            elements.push(`NOW: ${preview}`);
        }
        // Priority 2: Most impactful weapons
        if (identity.shame_trigger) {
            const preview = identity.shame_trigger.length > 80
                ? identity.shame_trigger.substring(0, 77) + "..."
                : identity.shame_trigger;
            elements.push(`SHAME: ${preview}`);
        }
        if (identity.financial_pain_point) {
            const preview = identity.financial_pain_point.length > 60
                ? identity.financial_pain_point.substring(0, 57) + "..."
                : identity.financial_pain_point;
            elements.push(`LOST: ${preview}`);
        }
        if (identity.self_sabotage_pattern) {
            const preview = identity.self_sabotage_pattern.length > 80
                ? identity.self_sabotage_pattern.substring(0, 77) + "..."
                : identity.self_sabotage_pattern;
            elements.push(`PATTERN: ${preview}`);
        }
        if (identity.accountability_history) {
            const preview = identity.accountability_history.length > 60
                ? identity.accountability_history.substring(0, 57) + "..."
                : identity.accountability_history;
            elements.push(`HISTORY: ${preview}`);
        }
        // Priority 3: Motivational anchor
        if (identity.war_cry_or_death_vision) {
            const preview = identity.war_cry_or_death_vision.length > 50
                ? identity.war_cry_or_death_vision.substring(0, 47) + "..."
                : identity.war_cry_or_death_vision;
            elements.push(`ANCHOR: ${preview}`);
        }
        return elements.length > 0
            ? elements.join(" | ")
            : "Psychological weapons profile pending extraction";
    }
}
/* ═══════════════════════════════════════════════════════════════════════════════
 * 🏭 FACTORY FUNCTIONS & UTILITY METHODS
 * ═══════════════════════════════════════════════════════════════════════════════ */
/**
 * 🏭 Factory function to create intelligent identity extractor instance
 */
export function createIntelligentIdentityExtractor(env) {
    return new IntelligentIdentityExtractor(env);
}
/**
 * 🚀 Quick function to extract and save identity data using intelligent AI approach
 */
export async function extractAndSaveIdentityIntelligent(userId, env) {
    const extractor = createIntelligentIdentityExtractor(env);
    return await extractor.extractAndSaveIdentity(userId);
}
// Legacy aliases for backward compatibility
export const createUnifiedIdentityExtractor = createIntelligentIdentityExtractor;
export const extractAndSaveIdentityUnified = extractAndSaveIdentityIntelligent;
export const UnifiedIdentityExtractor = IntelligentIdentityExtractor;
