/**
 * Consequence Engine - Accountability and Behavioral Change System
 *
 * This module generates consequences for user failures and excuses during
 * accountability calls. It provides different levels of intensity based on
 * user performance patterns and creates psychological pressure to drive
 * behavioral change.
 *
 * Consequence Types:
 * 1. Harsh Consequences: For users with poor performance (<40% success rate)
 * 2. Standard Consequences: For moderate performance issues (learning-focused)
 *
 * Psychological Principles:
 * - Harsh consequences create urgency and break through denial
 * - Standard consequences focus on learning and system improvement
 * - Consequences are designed to trigger emotional responses
 * - Random selection prevents predictability and maintains impact
 *
 * Usage Guidelines:
 * - Use harsh consequences sparingly to maintain impact
 * - Standard consequences should be the default approach
 * - Consequences should be followed by actionable solutions
 * - Always maintain the relationship while applying pressure
 */
/**
 * Generates harsh consequences for users with poor performance patterns
 *
 * These consequences are designed to break through denial and create
 * urgency for change. They use direct, confrontational language to
 * highlight the cost of continued failure patterns.
 *
 * Target Users:
 * - Success rate below 40%
 * - Repeated excuse patterns
 * - Serious intervention needed
 * - Users stuck in comfort zones
 *
 * Psychological Impact:
 * - Creates emotional discomfort
 * - Highlights opportunity cost
 * - Breaks through rationalization
 * - Forces self-confrontation
 *
 * @returns A randomly selected harsh consequence message
 */
export function generateHarshConsequence() {
    const consequences = [
        "That excuse is exactly why you're stuck in the same loop. Every day you choose comfort over growth.",
        "You're watching your potential dissolve into excuses. This is how mediocrity becomes permanent.",
        "Another excuse, another day lost. You're training yourself to fail and getting better at it.",
        "That excuse has appeared 3 times this month. You're not adapting, you're just repeating the same pattern.",
        "While you're making excuses, everyone else is making progress. The gap is widening.",
    ];
    const index = Math.floor(Math.random() * consequences.length);
    return consequences[index];
}
/**
 * Generates standard consequences for moderate performance issues
 *
 * These consequences focus on learning and system improvement rather
 * than harsh confrontation. They help users identify patterns and
 * create solutions for ongoing success.
 *
 * Target Users:
 * - Moderate performance issues
 * - Learning-focused accountability
 * - Users who respond to constructive feedback
 * - Situations requiring gentle but firm guidance
 *
 * Psychological Impact:
 * - Maintains relationship quality
 * - Encourages self-reflection
 * - Focuses on solutions
 * - Builds problem-solving skills
 *
 * @returns A randomly selected standard consequence message
 */
export function generateStandardConsequence() {
    const consequences = [
        "I understand the challenge, but this excuse is preventing your breakthrough.",
        "This pattern needs to break. Let's identify what would make tomorrow different.",
        "Every excuse is valuable data. What system can we put in place to prevent this?",
        "The excuse reveals the real obstacle. How do we eliminate it tomorrow?",
        "This setback is temporary if we learn from it. What's the lesson here?",
    ];
    const index = Math.floor(Math.random() * consequences.length);
    return consequences[index];
}
/**
 * Generates personalized consequence based on user performance and tone
 *
 * This is the main entry point for the consequence delivery system.
 * It analyzes user performance patterns and selects the appropriate
 * consequence intensity level.
 *
 * Decision Logic:
 * - Success rate < 40%: Harsh consequences
 * - Success rate >= 40%: Standard consequences
 *
 * The system can be extended to include:
 * - User-specific consequence preferences
 * - Historical response patterns
 * - Current emotional state
 * - Specific failure types
 *
 * @param successRate User's recent success rate (0-100)
 * @returns Appropriate consequence message based on performance
 */
export function generateConsequence(successRate) {
    if (successRate < 40) {
        return generateHarshConsequence();
    }
    else {
        return generateStandardConsequence();
    }
}
