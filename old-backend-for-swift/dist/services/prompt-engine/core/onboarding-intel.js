/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🔥 PSYCHOLOGICAL INTELLIGENCE BUILDER - SUPER MVP
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * Transforms Super MVP identity data into actionable intelligence for AI accountability calls.
 * Uses simplified core fields and onboarding_context JSONB for psychological data.
 *
 * SUPER MVP PHILOSOPHY:
 * - Simple, focused accountability
 * - Core fields + JSONB context
 * - Clear, direct prompts
 * - No bloated psychological weapons
 *
 * ════════════════════════════════════════════════════════════════════════════════
 */
/**
 * Builds intelligence profile from Super MVP identity data
 *
 * @param identity - Super MVP identity (12 columns with onboarding_context JSONB)
 * @param memoryInsights - Behavioral patterns from call/interaction history (optional)
 * @returns Formatted intelligence string for prompt injection in AI calls
 */
export function buildOnboardingIntelligence(identity, memoryInsights) {
    if (!identity) {
        return "**INSUFFICIENT DATA**: No identity profile available - user needs onboarding completion.\n\n---\n\n";
    }
    let intelligence = "# 🎯 ACCOUNTABILITY PROFILE (Super MVP)\n\n";
    // ═══════════════════════════════════════════════════════════════════════════════
    // CORE IDENTITY (Super MVP Fields)
    // ═══════════════════════════════════════════════════════════════════════════════
    intelligence += `**Name**: ${identity.name}\n`;
    intelligence += `**Daily Commitment**: "${identity.daily_commitment}"\n`;
    intelligence += `**Call Time**: ${identity.call_time}\n`;
    intelligence += `**Strike Limit**: ${identity.strike_limit} strikes before consequences\n`;
    intelligence += `**Path**: ${identity.chosen_path === 'hopeful' ? '🌟 Hopeful Journey' : '⚡ Doubtful - Needs Extra Push'}\n\n`;
    // ═══════════════════════════════════════════════════════════════════════════════
    // VOICE RECORDINGS (R2 URLs)
    // ═══════════════════════════════════════════════════════════════════════════════
    intelligence += `## 🎙️ VOICE RECORDINGS\n`;
    intelligence += `- **Why it matters**: ${identity.why_it_matters_audio_url ? '✅ Available' : '❌ Missing'}\n`;
    intelligence += `- **Cost of quitting**: ${identity.cost_of_quitting_audio_url ? '✅ Available' : '❌ Missing'}\n`;
    intelligence += `- **Commitment**: ${identity.commitment_audio_url ? '✅ Available' : '❌ Missing'}\n\n`;
    // ═══════════════════════════════════════════════════════════════════════════════
    // ONBOARDING CONTEXT (JSONB - Psychological Data)
    // ═══════════════════════════════════════════════════════════════════════════════
    if (identity.onboarding_context && typeof identity.onboarding_context === 'object') {
        const ctx = identity.onboarding_context;
        intelligence += `## 📋 ONBOARDING CONTEXT\n`;
        if (ctx.goal) {
            intelligence += `**Goal**: "${ctx.goal}"\n`;
        }
        if (ctx.motivation_level) {
            intelligence += `**Motivation Level**: ${ctx.motivation_level}/10\n`;
        }
        if (ctx.attempt_history) {
            intelligence += `\n### 🔄 ATTEMPT HISTORY\n`;
            intelligence += `"${ctx.attempt_history}"\n`;
            intelligence += `*Use this: Remind them of past failures when they make excuses*\n`;
        }
        if (ctx.favorite_excuse) {
            intelligence += `\n### 🚩 FAVORITE EXCUSE\n`;
            intelligence += `"${ctx.favorite_excuse}"\n`;
            intelligence += `*Deploy when: They're making excuses - call it out directly*\n`;
        }
        if (ctx.quit_pattern) {
            intelligence += `\n### ⚠️ QUIT PATTERN\n`;
            intelligence += `"${ctx.quit_pattern}"\n`;
            intelligence += `*Deploy when: You see the pattern starting (Day 3-5 typically)*\n`;
        }
        if (ctx.future_if_no_change) {
            intelligence += `\n### 💀 FUTURE IF NO CHANGE\n`;
            intelligence += `"${ctx.future_if_no_change}"\n`;
            intelligence += `*Deploy when: They need reality check about consequences*\n`;
        }
        if (ctx.who_disappointed) {
            intelligence += `\n### 😞 WHO DISAPPOINTED\n`;
            intelligence += `"${ctx.who_disappointed}"\n`;
            intelligence += `*Deploy when: They think only they're affected by failure*\n`;
        }
        if (ctx.witness) {
            intelligence += `\n### 👁️ WITNESS\n`;
            intelligence += `"${ctx.witness}"\n`;
            intelligence += `*Someone who knows about their commitment - accountability anchor*\n`;
        }
        intelligence += `\n`;
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // BEHAVIORAL MEMORY INSIGHTS (If available)
    // ═══════════════════════════════════════════════════════════════════════════════
    if (memoryInsights && memoryInsights.emergingPatterns && memoryInsights.emergingPatterns.length > 0) {
        intelligence += `## 🔍 EMERGING PATTERNS (Recent Behavior)\n`;
        memoryInsights.emergingPatterns.slice(0, 3).forEach((pattern, index) => {
            intelligence += `${index + 1}. "${pattern.sampleText}" - ${pattern.recentCount} occurrences\n`;
        });
        intelligence += `*Use these: Call out repeated excuses and patterns*\n\n`;
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // CALL STRATEGY
    // ═══════════════════════════════════════════════════════════════════════════════
    intelligence += `## 🎯 CALL STRATEGY\n`;
    intelligence += `1. **Check-in**: "Did you do [daily_commitment]? Yes or no. No stories."\n`;
    intelligence += `2. **If yes**: Congratulate, ask what made it work, reinforce\n`;
    intelligence += `3. **If no**: Deploy excuse detection - call out [favorite_excuse] if used\n`;
    intelligence += `4. **Pattern watch**: Look for [quit_pattern] behavior starting\n`;
    intelligence += `5. **Reality check**: Remind of [future_if_no_change] if needed\n`;
    intelligence += `6. **Voice playback**: Use recordings for emotional impact\n`;
    intelligence += `7. **Approach**: ${identity.chosen_path === 'doubtful' ? 'Tough love - they need extra push' : 'Supportive encouragement'}\n`;
    intelligence += `8. **Strike tracking**: ${identity.strike_limit} strikes allowed - track failures\n\n`;
    intelligence += `---\n\n`;
    return intelligence;
}
// Alias for backward compatibility
export const generateOnboardingIntelligence = buildOnboardingIntelligence;
