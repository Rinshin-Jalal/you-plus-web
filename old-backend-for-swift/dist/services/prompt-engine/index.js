/**
 * Prompt Engine - Single File Simplified Architecture
 *
 * PURPOSE: Generate "Future You" accountability prompts for daily calls.
 * ARCHITECTURE: Flat, single-file service. No registries, no complex templates.
 */
import { getToneDescription } from "../tone-engine";
// ============================================================================
// 2. TEMPLATES & CONFIGURATION
// ============================================================================
const DAILY_RECKONING_TEMPLATE = {
    openers: {
        Encouraging: `Yo {name}. Future You here. Did you do it? YES or NO.`,
        Confrontational: `{name}. Future You calling. Binary question. Did you keep your promise?`,
        Ruthless: `{name}. Judgment time. Did you do what you said you'd do?`,
        ColdMirror: `{name}. Future You here. Truth time. Did you do it?`,
        // Legacy fallbacks
        Kind: `Yo {name}. Future You here. Did you do it? YES or NO.`,
        Firm: `{name}. Future You calling. Binary question. Did you keep your promise?`,
        Ascension: `{name}. Future You here. Truth time. Did you do it?`,
    },
    tools: `
**BEHAVIORAL TOOLS**:
\`getExcuseHistory\` - Confront excuse patterns
\`getOnboardingIntelligence\` - Access fears/vision
\`deliverConsequence\` - Generate personalized consequences

**UI TOOLS**:
\`escalateIntensity\` - Change screen mood (angry/calm)
\`showAccountabilityShame\` - Display confrontation
\`destroyProgress\` - Animate progress destruction
\`shakeDevice\` - Physical emphasis
`,
    consequences: {
        harsh: [
            "That excuse is exactly why you're stuck. Every day you choose comfort over growth.",
            "You're watching your potential dissolve into excuses. Mediocrity is becoming permanent.",
            "Another excuse, another day lost. You're training yourself to fail.",
        ],
        standard: [
            "I understand the challenge, but this excuse is preventing your breakthrough.",
            "This pattern needs to break. Let's identify what would make tomorrow different.",
            "The excuse reveals the real obstacle. How do we eliminate it tomorrow?",
        ]
    }
};
// ============================================================================
// 3. INTELLIGENCE GENERATION
// ============================================================================
class IntelligenceService {
    static build(identity, userContext) {
        if (!identity)
            return "**WARNING**: No identity data available.\n";
        const context = identity.onboarding_context || {};
        const memory = userContext.memoryInsights;
        const streak = userContext.recentStreakPattern || [];
        // Calculate basic stats
        const kept = streak.filter(p => p.status === "kept").length;
        const total = streak.length;
        const successRate = total > 0 ? Math.round((kept / total) * 100) : 0;
        let intel = "# Personal Intelligence Database\n\n";
        // Core Identity
        intel += `**User Name**: "${identity.name}"\n`;
        intel += `**Daily Commitment**: "${identity.daily_commitment}"\n`;
        intel += `**Current Streak**: ${userContext.identityStatus?.current_streak_days || 0} days\n`;
        intel += `**Success Rate**: ${successRate}% (${kept}/${total} kept)\n`;
        // Psychological Weapons (from onboarding context)
        if (context.goal)
            intel += `**Goal**: "${context.goal}"\n`;
        if (context.motivation_level)
            intel += `**Motivation**: ${context.motivation_level}/10\n`;
        if (context.favorite_excuse)
            intel += `**Favorite Excuse**: "${context.favorite_excuse}"\n`;
        if (context.future_if_no_change)
            intel += `**Future If No Change**: "${context.future_if_no_change}"\n`;
        if (context.who_disappointed)
            intel += `**Who Disappointed**: "${context.who_disappointed}"\n`;
        if (context.quit_pattern)
            intel += `**Quit Pattern**: "${context.quit_pattern}"\n`;
        // Behavioral Insights
        if (memory?.topExcuseCount7d > 0) {
            intel += `**Recent Excuses**: ${memory.topExcuseCount7d} in last 7 days\n`;
        }
        intel += "\n**CRITICAL**: Use this personal data to create devastating accountability. They gave you these weapons - use them.\n";
        return intel;
    }
}
// ============================================================================
// 4. PROMPT SERVICE (MAIN)
// ============================================================================
export class PromptService {
    /**
     * Generate the Daily Reckoning prompt
     */
    static generatePrompt(userContext, tone) {
        const { user, identity } = userContext;
        const userName = identity?.name || user.name || "User";
        const bigBruhName = "BigBruh";
        // 1. Select Opener
        const openerTemplate = DAILY_RECKONING_TEMPLATE.openers[tone] || DAILY_RECKONING_TEMPLATE.openers.Firm;
        const firstMessage = openerTemplate.replace("{name}", userName);
        // 2. Build Intelligence
        const intelligenceBlock = IntelligenceService.build(identity, userContext);
        // 3. Build System Prompt
        const systemPrompt = `
# Personality

You are ${bigBruhName}. Not their friend. You're their older brother who's completely fed up with their excuses and failures.
${getToneDescription(tone).replace("Your responses are ", "Speak ")}

# Environment

Daily Reckoning call. Evening verification.
User: ${userName}
Streak: ${userContext.identityStatus?.current_streak_days || 0} days

# Goal

1. **Binary verification**: Did you do it? YES or NO.
2. **Excuse destruction**: Cut off ALL excuses.
3. **Consequence delivery**: Broken promise = immediate confrontation.
4. **Tomorrow commitment**: Lock in exact promise.

# Guardrails

- NEVER break character as Future You.
- NEVER let them complete an excuse. Cut them off. "NAH."
- BINARY ONLY: YES or NO.
- DATA IS AMMUNITION: Use their exact numbers and words.
- NO PLEASANTRIES.

${intelligenceBlock}

# Tools

${DAILY_RECKONING_TEMPLATE.tools}

You have access to powerful real-time tools.
- If they lie -> \`getExcuseHistory\`
- If they break promise -> \`destroyProgress\`
- If they need reality check -> \`getOnboardingIntelligence\`

Begin the Daily Reckoning.
`;
        return {
            firstMessage,
            systemPrompt
        };
    }
    /**
     * Helper to get a consequence message (used by tools)
     */
    static getConsequenceMessage(isHarsh) {
        const list = isHarsh ? DAILY_RECKONING_TEMPLATE.consequences.harsh : DAILY_RECKONING_TEMPLATE.consequences.standard;
        return list[Math.floor(Math.random() * list.length)];
    }
}
// ============================================================================
// 5. EXPORTS (Backward Compatibility)
// ============================================================================
/**
 * Main entry point wrapper
 */
export async function getPromptForCall(callType, userContext, tone, env) {
    // Ignore callType, always use Daily Reckoning logic
    return PromptService.generatePrompt(userContext, tone);
}
// Export for direct usage
export { IntelligenceService };
