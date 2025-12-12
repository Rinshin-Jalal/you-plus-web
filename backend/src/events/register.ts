/**
 * Event Handler Registration
 *
 * This file is responsible for registering all event handlers at application startup.
 * It imports handler registration functions from each feature module and calls them.
 *
 * To add new handlers:
 * 1. Create a handler file in your feature (e.g., features/myfeature/handlers/events.ts)
 * 2. Export a registration function that takes EventBus as parameter
 * 3. Import and call it here
 */

import { eventBus } from './bus';

// Feature handler registrations
import { registerBillingEventHandlers } from '@/features/billing/handlers/events';
import { registerOnboardingEventHandlers } from '@/features/onboarding/handlers/events';
import { registerCallEventHandlers } from '@/features/core/handlers/call-events';
import { registerGamificationEventHandlers } from '@/features/gamification/handlers/events';

/**
 * Register all event handlers.
 * Call this once at application startup (in index.ts).
 */
export function registerAllEventHandlers(): void {
  console.log('[Events] Registering all event handlers...');

  // Billing: subscription status updates
  registerBillingEventHandlers(eventBus);

  // Onboarding: post-onboarding reactions
  registerOnboardingEventHandlers(eventBus);

  // Core: call completion processing
  registerCallEventHandlers(eventBus);

  // Gamification: XP awards and achievements
  registerGamificationEventHandlers(eventBus);

  console.log('[Events] All handlers registered');
  console.log('[Events] Registered event types:', eventBus.getRegisteredTypes().join(', '));
}





