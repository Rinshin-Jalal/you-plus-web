/**
 * Enhance system prompt with Identity data
 * This adds weaponized personal data for devastating accountability
 */
export function enhancePromptWithOnboardingData(basePrompt, identity) {
    let enhanced = basePrompt;
    // Add V3 onboarding intelligence section
    enhanced +=
        "\n\n## V3 ONBOARDING INTELLIGENCE - WEAPONIZED PERSONAL DATA (10 PSYCHOLOGICAL WEAPONS)\n\n";
    // Core Identity
    if (identity.name) {
        enhanced += `**USER NAME**: "${identity.name}" - This is who you're calling out\n`;
    }
    // Super MVP: All fields now in onboarding_context
    const context = identity.onboarding_context;
    // WEAPON 1: FAVORITE EXCUSE (replaces shame_trigger)
    if (context?.favorite_excuse) {
        enhanced += `**FAVORITE EXCUSE**: "${context.favorite_excuse}" - Their go-to excuse\n`;
    }
    // WEAPON 2: GOAL AND MOTIVATION
    if (context?.goal) {
        enhanced += `**GOAL**: "${context.goal}" - What they're trying to achieve\n`;
    }
    if (context?.motivation_level) {
        enhanced += `**MOTIVATION LEVEL**: ${context.motivation_level}/10 - Self-reported commitment\n`;
    }
    // WEAPON 3: WHO DISAPPOINTED
    if (context?.who_disappointed) {
        enhanced += `**WHO DISAPPOINTED**: "${context.who_disappointed}" - Person they let down\n`;
    }
    // WEAPON 4: FUTURE IF NO CHANGE (replaces breaking_point_event)
    if (context?.future_if_no_change) {
        enhanced += `**FUTURE IF NO CHANGE**: "${context.future_if_no_change}" - What happens if they keep failing\n`;
    }
    // WEAPON 5: ATTEMPT HISTORY (replaces self_sabotage_pattern)
    if (context?.attempt_history) {
        enhanced += `**ATTEMPT HISTORY**: "${context.attempt_history}" - Past failures and patterns\n`;
    }
    // WEAPON 6: QUIT PATTERN
    if (context?.quit_pattern) {
        enhanced += `**QUIT PATTERN**: "${context.quit_pattern}" - How they typically give up\n`;
    }
    // ANCHOR 1: DAILY COMMITMENT (core field, not in context)
    if (identity.daily_commitment) {
        enhanced += `**DAILY COMMITMENT**: "${identity.daily_commitment}" - Their ONE daily action\n`;
    }
    // ANCHOR 2: CHOSEN PATH
    if (identity.chosen_path) {
        enhanced += `**CHOSEN PATH**: "${identity.chosen_path}" - Hopeful or doubtful mindset\n`;
    }
    // ANCHOR 3: WITNESS
    if (context?.witness) {
        enhanced += `**WITNESS**: "${context.witness}" - Person holding them accountable\n`;
    }
    enhanced += `\n**PERSONALIZED IDENTITY DATA**: Complete psychological profile loaded\n`;
    enhanced +=
        "**CRITICAL**: Use this personal data to create devastating accountability. They gave you these weapons - use them.\n\n";
    return enhanced;
}
/**
 * Enhance first message with Identity data
 */
export function enhanceFirstMessageWithOnboardingData(baseMessage, identity, callType) {
    // Super MVP: Use goal and motivation from onboarding_context
    const context = identity.onboarding_context;
    if (callType === "daily_reckoning" && context?.goal) {
        return `Remember your goal: "${context.goal}". Let's see if you're actually working toward it or just lying to yourself.`;
    }
    return baseMessage;
}
