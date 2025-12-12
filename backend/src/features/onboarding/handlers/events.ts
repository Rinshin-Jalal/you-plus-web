/**
 * Onboarding Event Handlers
 *
 * Handles onboarding-related events:
 * - onboarding.completed: Post-onboarding processing, welcome actions
 */

import type { EventBus, EventHandler } from '@/events/bus';
import type { EventByType } from '@/events/types';

/**
 * Register all onboarding-related event handlers
 */
export function registerOnboardingEventHandlers(bus: EventBus): void {
  bus.on('onboarding.completed', handleOnboardingCompleted);

  console.log('[Onboarding] Event handlers registered');
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════

const handleOnboardingCompleted: EventHandler<
  EventByType<'onboarding.completed'>
> = async (event, ctx) => {
  console.log(
    `[Onboarding] User ${event.userId} completed onboarding with ${event.pillars.length} pillars`
  );
  console.log(`[Onboarding] Primary pillar: ${event.primaryPillar}`);
  console.log(`[Onboarding] Voice cloned: ${event.voiceCloned}`);

  // Future handlers can be added here:
  // - Send welcome notification
  // - Trigger welcome call scheduling
  // - Initialize user preferences
  // - Track analytics event

  // Note: XP awards for onboarding are handled by the gamification handlers
};





