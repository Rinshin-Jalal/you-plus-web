/**
 * Gamification Feature Module
 *
 * Provides XP awards, achievements, and progression tracking.
 * The core logic is in event handlers that react to domain events.
 */

export { default as gamificationRouter } from './router';
export { registerGamificationEventHandlers } from './handlers/events';





