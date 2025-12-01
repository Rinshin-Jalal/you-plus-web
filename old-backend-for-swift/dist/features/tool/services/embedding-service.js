/* ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 BIG BRUH PSYCHOLOGICAL MEMORY & PATTERN RECOGNITION SYSTEM
 *
 * Advanced AI-powered embedding service that transforms psychological data into
 * searchable vector memories for personalized accountability and pattern detection.
 * Uses OpenAI embeddings to create a semantic memory bank of user behaviors,
 * excuses, breakthroughs, and psychological patterns.
 *
 * Core Philosophy: "Your past patterns become the mirror for your present choices"
 *
 * 🔍 CONTENT TYPES SUPPORTED:
 * ├── Original Types (6):
 * │   ├── excuse - User excuses and rationalizations
 * │   ├── craving - Behavioral cravings and triggers
 * │   ├── demon - Internal resistance patterns
 * │   ├── echo - Recurring thoughts/patterns
 * │   ├── pattern - Behavioral patterns
 * │   └── breakthrough - Success moments and insights
 * │
 * └── Identity-Enhanced Types (12):
 *     ├── self_deception - Hidden truths they avoid
 *     ├── nightmare_fear - Feared version of themselves
 *     ├── broken_promise - Past failure patterns
 *     ├── trigger_moment - Specific vulnerability windows
 *     ├── derail_pattern - What pulls them off track
 *     ├── vision - Desired transformation outcome
 *     ├── commitment - Non-negotiable daily actions
 *     ├── regret_fear - Regret they want to avoid
 *     ├── betrayal_cost - Cost of breaking their contract
 *     ├── shame_source - External judgment they fear
 *     ├── sacred_oath - Their identity commitment
 *     └── binding_commitment - Final accountability pledge
 *
 * 🎯 USE CASES:
 * • Pattern Recognition: "You said this same excuse 3 weeks ago..."
 * • Breakthrough Recall: "Remember when you overcame this before?"
 * • Trigger Detection: Identify recurring behavioral triggers
 * • Progress Tracking: Semantic similarity between past and present states
 * • Personalized Responses: AI references specific user history
 * • Accountability Leverage: Uses past commitments to enforce present actions
 * ═══════════════════════════════════════════════════════════════════════════════ */
// Export all functions from modular embedding services (global)
// Core embedding functions
export { generateEmbedding, generateBatchEmbeddings, cosineSimilarity, findSimilarMemories, } from "@/services/embedding-services/core";
// Memory operations
export { getMemoryEmbeddings, createMemoryEmbedding, searchMemoryEmbeddings, searchPsychologicalPatterns, } from "@/services/embedding-services/memory";
// Identity memory functions
export { generateIdentityMemoryEmbeddings, updateIdentityMemoryEmbeddings, } from "@/services/embedding-services/identity";
// Call analysis functions
export { extractCallPsychologicalContent, generateCallMemoryEmbeddings, } from "@/services/embedding-services/calls";
// Pattern analysis functions
export { findExcusePatterns, findBreakthroughMoments, } from "@/services/embedding-services/patterns";
// Behavioral analysis functions
export { detectBehavioralPatterns, analyzeCallSuccess, trackUserPromisePatterns, correlateIdentityWithCalls, } from "@/services/embedding-services/behavioral";
// Legacy compatibility - saveMemoryEmbedding function used by other services
import { createMemoryEmbedding } from "@/services/embedding-services/memory";
export const saveMemoryEmbedding = createMemoryEmbedding;
