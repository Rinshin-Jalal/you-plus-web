/**
 * Billing Event Handlers
 *
 * Handles subscription-related events:
 * - subscription.created: Create/update user record, set subscription status
 * - subscription.cancelled: Update subscription status
 * - subscription.renewed: Log renewal
 * - subscription.failed: Update status to past_due
 * - subscription.on_hold: Update status
 * - subscription.expired: Update status
 */

import type { EventBus, EventHandler } from '@/events/bus';
import type { EventByType } from '@/events/types';
import { createSupabaseClient } from '@/features/core/utils/database';

/**
 * Register all billing-related event handlers
 */
export function registerBillingEventHandlers(bus: EventBus): void {
  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION CREATED
  // ═══════════════════════════════════════════════════════════════
  bus.on('subscription.created', handleSubscriptionCreated);

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION CANCELLED
  // ═══════════════════════════════════════════════════════════════
  bus.on('subscription.cancelled', handleSubscriptionCancelled);

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION RENEWED
  // ═══════════════════════════════════════════════════════════════
  bus.on('subscription.renewed', handleSubscriptionRenewed);

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION FAILED
  // ═══════════════════════════════════════════════════════════════
  bus.on('subscription.failed', handleSubscriptionFailed);

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION ON HOLD
  // ═══════════════════════════════════════════════════════════════
  bus.on('subscription.on_hold', handleSubscriptionOnHold);

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION EXPIRED
  // ═══════════════════════════════════════════════════════════════
  bus.on('subscription.expired', handleSubscriptionExpired);

  console.log('[Billing] Event handlers registered');
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════

const handleSubscriptionCreated: EventHandler<
  EventByType<'subscription.created'>
> = async (event, ctx) => {
  const supabase = createSupabaseClient(ctx.env);

  console.log(
    `[Billing] Handling subscription.created for user ${event.userId}, customer ${event.customerId}`
  );

  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, dodo_customer_id')
    .eq('id', event.userId)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[Billing] Error checking user:', fetchError);
    throw fetchError;
  }

  // If user doesn't exist, create them
  if (!existingUser) {
    console.log(`[Billing] User ${event.userId} not found, creating...`);

    const { error: insertError } = await supabase.from('users').insert({
      id: event.userId,
      email: event.email || 'unknown@example.com',
      name: event.customerName || 'User',
      dodo_customer_id: event.customerId,
      payment_provider: 'dodopayments',
      subscription_status: 'active',
    });

    if (insertError) {
      console.error('[Billing] Failed to create user:', insertError);
      throw insertError;
    }

    console.log(
      `[Billing] User ${event.userId} created with customer ID ${event.customerId}`
    );
    return;
  }

  // User exists, update with subscription info
  const { error: updateError } = await supabase
    .from('users')
    .update({
      dodo_customer_id: event.customerId,
      payment_provider: 'dodopayments',
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.userId);

  if (updateError) {
    console.error('[Billing] Failed to update user:', updateError);
    throw updateError;
  }

  console.log(
    `[Billing] User ${event.userId} updated with customer ID ${event.customerId}`
  );
};

const handleSubscriptionCancelled: EventHandler<
  EventByType<'subscription.cancelled'>
> = async (event, ctx) => {
  const supabase = createSupabaseClient(ctx.env);

  console.log(
    `[Billing] Handling subscription.cancelled for user ${event.userId}`
  );

  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.userId);

  if (error) {
    console.error('[Billing] Failed to update cancelled status:', error);
    throw error;
  }

  console.log(`[Billing] User ${event.userId} subscription marked as cancelled`);
};

const handleSubscriptionRenewed: EventHandler<
  EventByType<'subscription.renewed'>
> = async (event, ctx) => {
  const supabase = createSupabaseClient(ctx.env);

  console.log(
    `[Billing] Handling subscription.renewed for user ${event.userId}`
  );

  // Ensure status is active on renewal
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.userId);

  if (error) {
    console.error('[Billing] Failed to update renewed status:', error);
    throw error;
  }

  console.log(`[Billing] User ${event.userId} subscription renewed`);
};

const handleSubscriptionFailed: EventHandler<
  EventByType<'subscription.failed'>
> = async (event, ctx) => {
  const supabase = createSupabaseClient(ctx.env);

  console.log(
    `[Billing] Handling subscription.failed for user ${event.userId}`
  );

  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.userId);

  if (error) {
    console.error('[Billing] Failed to update failed status:', error);
    throw error;
  }

  console.log(`[Billing] User ${event.userId} subscription marked as past_due`);
};

const handleSubscriptionOnHold: EventHandler<
  EventByType<'subscription.on_hold'>
> = async (event, ctx) => {
  const supabase = createSupabaseClient(ctx.env);

  console.log(
    `[Billing] Handling subscription.on_hold for user ${event.userId}`
  );

  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'past_due', // on_hold maps to past_due in our status enum
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.userId);

  if (error) {
    console.error('[Billing] Failed to update on_hold status:', error);
    throw error;
  }

  console.log(`[Billing] User ${event.userId} subscription on hold`);
};

const handleSubscriptionExpired: EventHandler<
  EventByType<'subscription.expired'>
> = async (event, ctx) => {
  const supabase = createSupabaseClient(ctx.env);

  console.log(
    `[Billing] Handling subscription.expired for user ${event.userId}`
  );

  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.userId);

  if (error) {
    console.error('[Billing] Failed to update expired status:', error);
    throw error;
  }

  console.log(`[Billing] User ${event.userId} subscription expired`);
};







