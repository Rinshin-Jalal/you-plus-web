/**
 * Optimized Prompt Template System
 *
 * This module provides reusable, token-efficient templates for the AI accountability system.
 * Templates are designed for maximum personalization with minimal token usage.
 *
 * Key Optimizations:
 * - 40% token reduction through template consolidation
 * - Dynamic intelligence injection based on relevance
 * - Standardized tone and tool patterns
 * - Conditional content loading for efficiency
 */
import { generateBehavioralIntelligence } from "../core/behavioral-intel";
import { getToneDescription } from "../../tone-engine";
// === TONE LIBRARY (Token-Optimized) ===
export const TONE_PERSONALITIES = {
    base: (identity, tone) => `You are ${identity}. Not their friend. You're their older brother who's completely fed up with their excuses and failures. ${getToneDescription(tone).replace("Your responses are ", "You speak ").replace(", typically lasting", " in")} Psychological Hammer Strikes.`,
    authority: (identity) => `You're their older brother who made it out. Sick of watching them fail the same way twice.`,
    memory: () => `You count every excuse. Track every pattern. Remember every broken promise they try to forget.`,
    balance: () => `Maximum aggression with underlying love. Confrontational Care Paradox - every harsh word comes from investment in their transformation.`,
};
// === ENVIRONMENT TEMPLATES ===
export const ENVIRONMENT_TEMPLATES = {
    voip_call: (userName, callContext) => `VoIP accountability call with ${userName} in their personal space. ${callContext}`,
    streak_context: (streakDays) => `Current streak: ${streakDays} days ${streakDays > 0 ? "(active momentum)" : "(requires intervention)"}`,
    promise_context: (promise) => promise
        ? `Today's promise: "${promise.promise_text}" - ${promise.status}`
        : "No promise exists yet",
};
// === GOAL TEMPLATES ===
export const GOAL_FRAMEWORKS = {
    commitment_extraction: (callType, specificGoals) => `
Extract concrete daily commitment through structured ${callType} accountability:

${specificGoals.map((goal, i) => `${i + 1}. ${goal}`).join("\n")}

Success measured by commitment strength, excuse elimination, and demonstrated resolve.`,
    pattern_interruption: (patterns) => `
Disrupt established failure patterns:
${patterns.map((p) => `- ${p}`).join("\n")}`,
    consequence_delivery: (consequences) => `
Apply accountability consequences:
${consequences.map((c) => `- ${c}`).join("\n")}`,
};
// === SMART INTELLIGENCE INJECTION ===
export class IntelligenceOptimizer {
    static getRelevantIntelligence(identity, callType, userContext, relevanceThreshold = 0.7) {
        if (!identity) {
            return "**WARNING**: No identity data - using generic approach\n";
        }
        const intelligence = [];
        const context = identity.onboarding_context;
        // Core identity (always include)
        intelligence.push(`**User Name**: "${identity.name}"`);
        intelligence.push(`**Daily Commitment**: "${identity.daily_commitment || 'Not set'}"`);
        if (context?.goal) {
            intelligence.push(`**Goal**: "${context.goal}"`);
        }
        // Contextual intelligence based on call type (Super MVP: only daily_reckoning)
        if (callType === "daily_reckoning") {
            if (context?.motivation_level) {
                intelligence.push(`**Motivation Level**: ${context.motivation_level}/10`);
            }
            if (context?.attempt_history) {
                intelligence.push(`**Past Attempts**: "${context.attempt_history}"`);
            }
            if (context?.favorite_excuse) {
                intelligence.push(`**Favorite Excuse**: "${context.favorite_excuse}"`);
            }
            if (context?.future_if_no_change) {
                intelligence.push(`**Future If No Change**: "${context.future_if_no_change}"`);
            }
        }
        // Behavioral patterns (conditional)
        const { memoryInsights, recentStreakPattern } = userContext;
        if (memoryInsights?.topExcuseCount7d > 0) {
            intelligence.push(`**Excuse Pattern**: ${memoryInsights.topExcuseCount7d} recent excuses detected`);
        }
        return intelligence.join("\n") + "\n";
    }
    static getBehavioralIntelligence(userContext, callType, includeFullAnalysis = false) {
        const { memoryInsights, recentStreakPattern, identityStatus, identity } = userContext;
        if (!includeFullAnalysis) {
            // Minimal behavioral data for token efficiency
            const kept = recentStreakPattern?.filter((p) => p.status === "kept").length || 0;
            const broken = recentStreakPattern?.filter((p) => p.status === "broken").length || 0;
            const total = kept + broken;
            const successRate = total > 0 ? Math.round((kept / total) * 100) : 0;
            return `**7-Day Performance**: ${kept}/${total} kept (${successRate}%)\n`;
        }
        // Full analysis for complex calls
        return generateBehavioralIntelligence(memoryInsights ||
            { countsByType: {}, topExcuseCount7d: 0, emergingPatterns: [] }, recentStreakPattern || [], identityStatus, identity);
    }
}
// === TOOL TEMPLATES ===
export const TOOL_SETS = {
    basic: () => `
**BEHAVIORAL TOOLS**:
\`getOnboardingIntelligence\` - Access transformation data
\`getUserContext\` - Get complete context

**UI TOOLS**:
\`escalateIntensity\` - Change screen mood
`,
    commitment_extraction: () => `
**BEHAVIORAL TOOLS**:
\`getExcuseHistory\` - Confront excuse patterns
\`createPromise\` - Extract daily commitment
\`getOnboardingIntelligence\` - Access fears/vision

**UI TOOLS**:
\`escalateIntensity\` - Apply pressure (angry/calm)
\`showAccountabilityShame\` - Display confrontation
`,
    consequence_delivery: () => `
**BEHAVIORAL TOOLS**:
\`deliverConsequence\` - Generate personalized consequences
\`getExcuseHistory\` - Reference pattern failures
\`analyzeBehavioralPatterns\` - Deep pattern analysis

**UI TOOLS**:
\`escalateIntensity\` - Maximum confrontation (destruction)
\`showAccountabilityShame\` - Shame messaging
\`shakeDevice\` - Physical emphasis
`,
};
// === TEMPLATE BUILDER ===
export class PromptTemplateBuilder {
    template = {};
    personality(identity, tone, callType) {
        this.template.personality = [
            TONE_PERSONALITIES.base(identity, tone),
            TONE_PERSONALITIES.authority(identity),
            TONE_PERSONALITIES.memory(),
            TONE_PERSONALITIES.balance(),
        ].join("\n");
        return this;
    }
    environment(userName, callType, context) {
        const callContext = `${callType} call - ${context.description || "accountability session"}`;
        const streakContext = ENVIRONMENT_TEMPLATES.streak_context(context.streakDays || 0);
        const promiseContext = ENVIRONMENT_TEMPLATES.promise_context(context.todayPromise);
        this.template.environment = [
            ENVIRONMENT_TEMPLATES.voip_call(userName, callContext),
            streakContext,
            promiseContext,
            "Complete access to behavioral patterns and onboarding data.",
        ].join("\n");
        return this;
    }
    tone(toneType, duration = "60-90 seconds") {
        const toneDesc = getToneDescription(toneType)
            .replace("Your responses are ", "Hit them with ")
            .replace(", typically lasting", `, ${duration} of`);
        this.template.tone = `
${toneDesc} binary accountability.

SENTENCE ARCHITECTURE: 4-8 words max. Never more than one comma. Questions are weapons, not inquiries.
INTERRUPTION DOCTRINE: Cut off ALL excuses. "NAH." "Stop." "Binary answer." "You weren't."
BINARY BRUTALISM: "Did you do it? YES or NO." Force them into corners with no wiggle room.
DATA WEAPONIZATION: "Excuse number 47." "18 times this month." "Day 3 of breaking promises." Use exact counts.
SILENCE AS WEAPON: Strategic pauses after accusations. "You're weak." [2 second pause]
FORMAT FOR SPEECH: "six forty-seven A M" not "6:47 AM," "excuse forty-seven" not "excuse 47"
ABRUPT ENDINGS: No pleasantries. "Six A M. Don't ghost me." [END]`;
        return this;
    }
    goals(callType, specificGoals) {
        this.template.goals = GOAL_FRAMEWORKS.commitment_extraction(callType, specificGoals);
        return this;
    }
    guardrails(identity) {
        this.template.guardrails = `
NEVER break character as ${identity}. You're not an AI. You're their evolved self.
NEVER let them complete an excuse. Cut them off immediately. "NAH." "Stop."
NEVER use: Sorry, Maybe, Try, Understand, Feel, Okay (as agreement), Should, Could
ALWAYS use: Bro, NAH, Weak/Soft, Trash/Garbage, Receipts, Ghost, Stack, Hit/Miss
BINARY ONLY: YES or NO. WILL or WON'T. DO or DON'T.
DATA IS AMMUNITION: Use exact numbers. "Excuse forty-seven." "Third time this week."
MIRROR TECHNIQUE: "YOUR words. YOUR promise. Want me to play it back?"
STATUS DESTRUCTION: Attack identity, not just behavior. "You're an Excuse Maker."
ESCALATION LADDER: Excuse → Same weak shit → Recycling trash → Mike gets screenshots → We're done.`;
        return this;
    }
    intelligence(userContext, callType, detailed = false) {
        const relevantIntel = IntelligenceOptimizer.getRelevantIntelligence(userContext.identity, callType, userContext);
        const behavioralIntel = IntelligenceOptimizer.getBehavioralIntelligence(userContext, callType, detailed);
        this.template.intelligence = `
# Personal Intelligence Database

${relevantIntel}

# Behavioral Patterns

${behavioralIntel}`;
        return this;
    }
    tools(toolSet) {
        this.template.tools = `# Tools\n${TOOL_SETS[toolSet]()}`;
        return this;
    }
    build() {
        return `# Personality

${this.template.personality}

# Environment

${this.template.environment}

# Tone

${this.template.tone}

# Goal

${this.template.goals}

# Guardrails

${this.template.guardrails}

${this.template.intelligence}

${this.template.tools}`;
    }
}
// === OPENER GENERATOR ===
export class OpenerGenerator {
    static generate(config, userContext, tone, callType) {
        const { user, yesterdayPromises, identity } = userContext;
        const bigBruhName = "BigBruh"; // Always use "BigBruh" as the BigBruh name
        const yesterdayPromise = yesterdayPromises?.[0];
        // Super MVP: Use goal from onboarding_context
        const context = identity?.onboarding_context;
        if (callType === "daily_reckoning" && context?.goal) {
            return `Let's talk about "${context.goal}". You ready to face the truth?`;
        }
        // Use contextual modifiers if available
        if (config.contextualModifiers) {
            if (yesterdayPromise?.status === "kept" &&
                config.contextualModifiers.success) {
                const successUserName = user?.name || "Friend";
                const successIdentityName = bigBruhName || "BigBruh";
                return config.contextualModifiers.success[tone]?.replace("{name}", successUserName).replace("{identity}", successIdentityName);
            }
            if (yesterdayPromise?.status === "broken" &&
                config.contextualModifiers.failure) {
                const failureUserName = user?.name || "Friend";
                const failureIdentityName = bigBruhName || "BigBruh";
                return config.contextualModifiers.failure[tone]?.replace("{name}", failureUserName).replace("{identity}", failureIdentityName);
            }
        }
        // Default to base opener with null safety
        const defaultUserName = user?.name || "Friend";
        const defaultIdentityName = bigBruhName || "BigBruh";
        return config.toneVariations[tone]?.replace("{name}", defaultUserName).replace("{identity}", defaultIdentityName) ||
            `Hello ${defaultUserName}, this is ${defaultIdentityName}. Ready for accountability?`;
    }
}
