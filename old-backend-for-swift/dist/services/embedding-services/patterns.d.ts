import { Env } from "@/index";
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
export declare function findExcusePatterns(userId: string, currentExcuse: string, env: Env): Promise<{
    similarExcuses: any;
    category: string;
    confrontationStrength: string;
}>;
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
export declare function findBreakthroughMoments(userId: string, currentChallenge: string, env: Env): Promise<{
    similarBreakthroughs: any;
    category: string;
    confidenceBooster: string;
}>;
