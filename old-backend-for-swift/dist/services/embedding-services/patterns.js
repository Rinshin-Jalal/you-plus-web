/* ═══════════════════════════════════════════════════════════════════════════════
 * 📊 PATTERN ANALYSIS FUNCTIONS
 *
 * Specialized functions for detecting excuse patterns and breakthrough moments
 * for accountability leverage.
 * ═══════════════════════════════════════════════════════════════════════════════ */
import { searchPsychologicalPatterns } from "./memory";
/**
 * 🚨 Find Recurring Excuse Patterns
 *
 * Detects when users are repeating similar excuses over time. Perfect for
 * accountability calls to point out recurring rationalization patterns.
 *
 * @param userId - User to analyze for excuse patterns
 * @param currentExcuse - Current excuse they're making
 * @param env - Environment configuration
 * @returns Array of similar past excuses with similarity scores and timestamps
 */
export async function findExcusePatterns(userId, currentExcuse, env) {
    console.log(`🚨 Analyzing excuse patterns for: "${currentExcuse.substring(0, 50)}..."`);
    const patterns = await searchPsychologicalPatterns(userId, currentExcuse, ["excuse", "excuse_pattern", "self_deception"], 0.6, // Lower threshold to catch subtle variations
    10, // More results for pattern analysis
    env);
    return {
        similarExcuses: patterns.map((pattern) => ({
            ...pattern,
            pattern_strength: pattern.similarity > 0.8
                ? "strong"
                : pattern.similarity > 0.7
                    ? "moderate"
                    : "weak",
            accountability_message: pattern.similarity > 0.8
                ? "You've said almost exactly this before"
                : pattern.similarity > 0.7
                    ? "This sounds very familiar to a past excuse"
                    : "This reminds me of a similar pattern you've used",
        })),
        category: "excuse",
        confrontationStrength: patterns.length > 3 ? "high" : patterns.length > 1 ? "moderate" : "low",
    };
}
/**
 * 💪 Find Past Breakthrough Moments
 *
 * Searches for times when the user successfully overcame similar challenges.
 * Used to remind them of their capability and past success strategies.
 *
 * @param userId - User to find breakthroughs for
 * @param currentChallenge - Current challenge they're facing
 * @param env - Environment configuration
 * @returns Array of relevant breakthrough memories for motivation
 */
export async function findBreakthroughMoments(userId, currentChallenge, env) {
    console.log(`💪 Finding breakthrough moments for challenge: "${currentChallenge.substring(0, 50)}..."`);
    const breakthroughs = await searchPsychologicalPatterns(userId, currentChallenge, ["breakthrough", "vision", "commitment", "sacred_oath"], 0.5, // Cast wider net for breakthrough patterns
    8, env);
    return {
        similarBreakthroughs: breakthroughs.map((breakthrough) => ({
            ...breakthrough,
            motivation_level: breakthrough.similarity > 0.7 ? "high" : "moderate",
            reminder_message: breakthrough.similarity > 0.7
                ? "Remember when you successfully handled something very similar?"
                : "This reminds me of a past victory you had",
        })),
        category: breakthroughs.some((b) => b.similarity > 0.7) ? "momentum" : "resistance",
        confidenceBooster: breakthroughs.length > 0
            ? "You have relevant past success experience"
            : "This is new territory for growth",
    };
}
