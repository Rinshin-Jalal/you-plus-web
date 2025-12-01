/**
 * Future You Call Mode Configurations
 *
 * Single daily reckoning call configuration using Future You voice.
 * All other call types removed.
 */
// === DAILY RECKONING CALL CONFIGURATION (ONLY CALL TYPE) ===
// Simplified to 3 core tones (bloat elimination)
export const DAILY_RECKONING_CONFIG = {
    toneVariations: {
        "Confrontational": `{name}. Future You calling. Binary question. Did you keep your promise?`,
        "ColdMirror": `{name}. Future You here. Truth time. Did you do it?`,
        "Encouraging": `Yo {name}. Future You here. Did you do it? YES or NO.`
    }
};
export const DAILY_RECKONING_GOALS = [
    "**Binary verification**: Did you do it? YES or NO. No escape routes.",
    "**Excuse destruction**: Cut off ALL excuses. Count them. Reference patterns.",
    "**Consequence delivery**: Broken promise = immediate consequences and confrontation",
    "**Tomorrow commitment**: Lock in exact promise with specific time and stakes"
];
// === MAIN CALL CONFIGURATION REGISTRY ===
export const CALL_CONFIGURATIONS = {
    daily_reckoning: {
        opener: DAILY_RECKONING_CONFIG,
        goals: DAILY_RECKONING_GOALS,
        toolSet: "consequence_delivery",
        duration: "60-90 seconds"
    }
};
// ALL OTHER CALL TYPES REMOVED - ONLY DAILY RECKONING EXISTS
