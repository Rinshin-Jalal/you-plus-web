import { Env } from "@/index";
import { Identity } from "@/types/database";
export declare class IntelligentIdentityExtractor {
    private env;
    private supabase;
    constructor(env: Env);
    /**
     * 🧠 AI-POWERED INTELLIGENT EXTRACTION
     *
     * Revolutionary approach that uses OpenAI to analyze raw onboarding responses
     * and extract intelligent psychological insights. Transforms 45+ raw responses
     * into 13 actionable identity fields that the AI system can actually use.
     */
    extractIdentityData(userId: string): Promise<Partial<Identity>>;
    /**
     * 🔧 Extract Operational Fields Directly (Fallback)
     *
     * Extracts basic operational fields without AI analysis as a fallback
     * when AI analysis fails completely.
     */
    private extractOperationalFieldsDirectly;
    /**
     * 🔍 Find Response by Database Field Name
     */
    private findResponseByDbField;
    /**
     * 💾 Extract and Save Intelligent Identity to Database
     *
     * Uses AI-powered analysis to extract and save intelligent identity insights
     * to the identity table. Much cleaner and more actionable than raw data storage.
     */
    extractAndSaveIdentity(userId: string): Promise<{
        success: boolean;
        identity?: Partial<Identity>;
        fieldsExtracted?: number;
        aiAnalyzed?: boolean;
        error?: string;
    }>;
    /**
     * 📝 Generate Intelligent Identity Summary from Psychological Weapons
     *
     * V3: Creates concise summary from most impactful psychological weapons
     * Focus on actionable weapons that define the user's profile
     */
    private generateIntelligentSummary;
}
/**
 * 🏭 Factory function to create intelligent identity extractor instance
 */
export declare function createIntelligentIdentityExtractor(env: Env): IntelligentIdentityExtractor;
/**
 * 🚀 Quick function to extract and save identity data using intelligent AI approach
 */
export declare function extractAndSaveIdentityIntelligent(userId: string, env: Env): Promise<{
    success: boolean;
    identity?: Partial<Identity>;
    fieldsExtracted?: number;
    aiAnalyzed?: boolean;
    error?: string;
}>;
export declare const createUnifiedIdentityExtractor: typeof createIntelligentIdentityExtractor;
export declare const extractAndSaveIdentityUnified: typeof extractAndSaveIdentityIntelligent;
export declare const UnifiedIdentityExtractor: typeof IntelligentIdentityExtractor;
