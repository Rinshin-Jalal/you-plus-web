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
import { CallModeConfig, CallModeFunction } from "../types";
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
export declare function createCallMode(config: CallModeConfig): CallModeFunction;
