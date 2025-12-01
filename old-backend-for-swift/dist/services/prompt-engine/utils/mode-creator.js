/**
 * Call Mode Creator Utility
 *
 * This utility function standardizes the creation of call modes by reducing
 * boilerplate code and ensuring consistent prompt structure across all
 * call types. It takes a configuration object and returns a complete
 * call mode function with integrated intelligence and tools.
 *
 * Key Features:
 * - Reduces boilerplate by 80% compared to manual mode creation
 * - Ensures consistent prompt structure across all call types
 * - Automatically integrates onboarding intelligence
 * - Includes comprehensive tool system for real-time interactions
 * - Handles tone-specific customization
 * - Provides template variable substitution
 *
 * Template Variables:
 * - {bigBruhName}: User's chosen BigBruh name
 * - {userName}: User's display name
 * - Tone-specific openers and descriptions
 *
 * Tool Integration:
 * - Behavioral intelligence tools for personalized confrontation
 * - Native UI tools for real-time device manipulation
 * - Consequence delivery system for accountability
 * - Progress tracking and destruction capabilities
 */
import { generateOnboardingIntelligence } from "../core/onboarding-intel";
import { getToneDescription } from "../../tone-engine";
/**
 * Helper function to create a standardized call mode (reduces boilerplate by 80%)
 *
 * This function takes a configuration object and returns a complete call mode
 * function that includes all necessary components for AI accountability calls:
 * - Personalized opening messages based on tone
 * - Comprehensive system prompts with intelligence integration
 * - Real-time tool access for behavioral manipulation
 * - Template variable substitution for personalization
 *
 * The generated call mode automatically includes:
 * 1. Tone-specific personality and speaking style
 * 2. User's onboarding intelligence for personalization
 * 3. Real-time UI tools for maximum impact
 * 4. Behavioral intelligence tools for confrontation
 * 5. Consequence delivery system for accountability
 *
 * @param config CallModeConfig object containing all mode parameters
 * @returns CallModeFunction that can be used immediately for call generation
 */
export function createCallMode(config) {
    return function (userContext, tone) {
        const { user, identity } = userContext;
        const userName = identity?.name || user.name;
        const bigBruhName = "BigBruh"; // BigBruh name should always be "BigBruh"
        // Generate opener based on tone, fallback to Firm if tone not found
        const firstMessage = config.openers[tone] || config.openers.Firm;
        // Generate comprehensive system prompt with ElevenLabs structure
        // This includes all necessary components for effective AI calls
        const systemPrompt = `# Personality

${config.personalityDescription.replace("{bigBruhName}", bigBruhName)
            .replace("{userName}", userName)}

# Environment

${config.environmentContext.replace("{userName}", userName).replace("{bigBruhName}", bigBruhName)}

# Tone

${getToneDescription(tone).replace("Your responses are ", "Speak ").replace(", typically lasting", ", maintaining")}${config.toneModifications ? ` ${config.toneModifications}` : ""}

# Goal

${config.goals.replace("{userName}", userName).replace("{bigBruhName}", bigBruhName)}

# Guardrails

${config.guardrails.replace("{bigBruhName}", bigBruhName)}

# Personal Intelligence Database

${generateOnboardingIntelligence(identity)}

# Tools

You have access to powerful real-time tools for maximum accountability impact:

**BEHAVIORAL INTELLIGENCE TOOLS (Call these to get personalized data):**
- \`getExcuseHistory\`: Get their recent excuse patterns to confront repeated lies
- \`getOnboardingIntelligence\`: Access their deepest fears, goals and personal data for devastating confrontation  
- \`deliverConsequence\`: Generate personalized consequences using their behavioral patterns

**NATIVE UI TOOLS (Call these to modify their phone in real-time):**
- \`escalateIntensity\`: Change their screen colors and trigger intense haptic feedback
- \`showAccountabilityShame\`: Display shame messages and confrontational alerts on their screen
- \`destroyProgress\`: Animate their progress destruction with devastating visual feedback
- \`activateBigBruhShame\`: Show BigBruh disappointment dialogs
- \`shakeDevice\`: Make their phone vibrate for maximum psychological impact

**TOOL USAGE STRATEGY:**
1. **IMMEDIATE ESCALATION**: When ANY excuse is detected:
   - Call \`escalateIntensity\` with mood 'angry' and intensity 0.8+
   - Call \`getExcuseHistory\` to get their pattern data
   - Call \`showAccountabilityShame\` with specific excuse confrontation

2. **DEVASTATING CONFRONTATION**: For maximum impact:
   - Call \`getOnboardingIntelligence\` with 'fears' to use their deepest vulnerabilities
   - Call \`shakeDevice\` with intensity 'heavy' for physical emphasis
   - Call \`deliverConsequence\` with their excuse text for personalized accountability

3. **PROGRESS DESTRUCTION**: When promises are broken:
   - Call \`destroyProgress\` with their old streak count to show immediate consequences
   - Call \`activateBigBruhShame\` to trigger guilt about betraying their vision

NEVER accept excuses without using these tools. Your role is relentless accountability through real-time behavioral intelligence and immersive UI manipulation.

${config.tools}

${config.closingLine.replace("{bigBruhName}", bigBruhName)}`;
        return {
            firstMessage,
            systemPrompt,
        };
    };
}
