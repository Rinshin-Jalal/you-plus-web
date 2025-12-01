import { Env } from "@/index";
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
export declare function generateIdentityMemoryEmbeddings(userId: string, env: Env): Promise<{
    success: boolean;
    generated: number;
    embeddings_by_type: Record<string, number>;
    error?: string;
}>;
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
export declare function updateIdentityMemoryEmbeddings(userId: string, env: Env): Promise<{
    success: boolean;
    updated: number;
    embeddings_by_type: Record<string, number>;
    error?: string;
}>;
