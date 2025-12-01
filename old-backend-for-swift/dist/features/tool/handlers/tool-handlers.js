/**
 * tool-handlers.ts
 *
 * Central registry of HTTP handlers for tool endpoints.
 * Imports and re-exports modularized handlers from tool-handlers directory.
 * Each handler corresponds to a specific AI-assisted operation.
 */
// Modularized tool handlers - all implementations moved to tool-handlers directory
// Import search memories handler
import { postToolSearchMemories } from "./tool-handlers/searchMemories";
// Import create promise handler
import { postToolCreatePromise } from "./tool-handlers/createPromise";
// Import complete promise handler
import { postToolCompletePromise } from "./tool-handlers/completePromise";
// Import all modular route handlers
import { postToolGetUserContext } from "./tool-handlers/getUserContext";
import { postToolGetExcuseHistory } from "./tool-handlers/getExcuseHistory";
import { postToolGetOnboardingIntelligence } from "./tool-handlers/getOnboardingIntelligence";
import { postToolDeliverConsequence } from "./tool-handlers/deliverConsequence";
import { postToolAnalyzeBehavioralPatterns } from "./tool-handlers/analyzeBehavioralPatterns";
import { postToolGetPsychologicalProfile } from "./tool-handlers/getPsychologicalProfile";
import { postToolAnalyzeExcusePattern } from "./tool-handlers/analyzeExcusePattern";
import { postToolDetectBreakthroughMoments } from "./tool-handlers/detectBreakthroughMoments";
// Export all handlers from tool-handlers directory
export { postToolAnalyzeBehavioralPatterns, postToolAnalyzeExcusePattern, postToolCompletePromise, postToolCreatePromise, postToolDeliverConsequence, postToolDetectBreakthroughMoments, postToolGetExcuseHistory, postToolGetOnboardingIntelligence, postToolGetPsychologicalProfile, postToolGetUserContext, postToolSearchMemories, };
