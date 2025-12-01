import { Context } from "hono";
import { Env } from "@/index";
import { createSupabaseClient } from "@/features/core/utils/database";

// Rate limiting cache to prevent duplicate webhook processing
export const processedEvents = new Map<string, number>();
export const RATE_LIMIT_WINDOW = 30000; // 30 seconds - prevent duplicate events within this window

/**
 * Handles incoming webhooks from RevenueCat.
 * See: https://www.revenuecat.com/docs/webhooks
 */
export const postRevenueCatWebhook = async (c: Context) => {
  const env = c.env as Env;
  const xSignature = c.req.header("X-Signature");
  const authSignature = c.req.header("Authorization");
  const requestBody = await c.req.text();

  if (!authSignature) {
    console.error("RevenueCat webhook missing authorization signature");
    return c.json({ success: false, error: "Signature missing" }, 400);
  }

  // You must configure this in your environment variables
  const secret = env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("REVENUECAT_WEBHOOK_SECRET is not set in environment");
    return c.json({ success: false, error: "Server configuration error" }, 500);
  }

  // Validate webhook signature for security
  if (authSignature !== `Bearer ${secret}`) {
    console.error("Invalid webhook signature");
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const payload = JSON.parse(requestBody);
    const { event } = payload;
    const { app_user_id, type, entitlements, customer_info } = event;

    if (!app_user_id) {
      console.error("Webhook missing app_user_id");
      return c.json({ success: false, error: "User ID missing" }, 400);
    }

    // Generate unique event key for rate limiting
    const eventId = event.id || `${app_user_id}-${type}-${Date.now()}`;
    const eventKey = `${eventId}-${type}`;

    // Check if this event was recently processed
    const now = Date.now();
    const lastProcessed = processedEvents.get(eventKey);

    if (lastProcessed && now - lastProcessed < RATE_LIMIT_WINDOW) {
      console.log(`🚫 🚨 DUPLICATE WEBHOOK BLOCKED 🚨`);
      console.log(`   Event: ${type} for user ${app_user_id}`);
      console.log(
        `   Processed: ${Math.round((now - lastProcessed) / 1000)}s ago`
      );
      console.log(`   Rate limit: ${RATE_LIMIT_WINDOW / 1000}s window`);
      console.log(`   Cache size: ${processedEvents.size} events`);
      console.log(
        `🚫 Event blocked - preventing duplicate subscription update`
      );

      return c.json({
        success: true,
        message: "Event already processed recently",
        blocked: true,
        timeSinceLast: Math.round((now - lastProcessed) / 1000),
        rateLimited: true,
      });
    }

    // Mark this event as processed
    processedEvents.set(eventKey, now);

    // Clean up old entries (keep only recent ones)
    for (const [key, timestamp] of processedEvents.entries()) {
      if (now - timestamp > RATE_LIMIT_WINDOW * 2) {
        processedEvents.delete(key);
      }
    }

    console.log(
      `Processing RevenueCat webhook: ${type} for user ${app_user_id} (${processedEvents.size} events in cache)`
    );

    const supabase = createSupabaseClient(env);
    const activeEntitlement = Object.keys(entitlements || {})[0];
    let subscription_status: "active" | "trialing" | "cancelled" | "past_due" =
      "trialing";

    // Log detailed event information for debugging rapid renewals
    console.log(`📋 Webhook Event Details:`);
    console.log(`  - Event ID: ${event.id || "N/A"}`);
    console.log(`  - Type: ${type}`);
    console.log(`  - Transaction ID: ${event.transaction_id || "N/A"}`);
    console.log(`  - Product: ${event.product_id || "N/A"}`);
    console.log(
      `  - Price: ${event.price_in_purchased_currency || "N/A"} ${
        event.currency || ""
      }`
    );
    console.log(`  - Timestamp: ${event.event_timestamp || "N/A"}`);
    console.log(`  - Active Entitlements: ${activeEntitlement || "None"}`);

    switch (type) {
      case "INITIAL_PURCHASE":
        console.log(`🛒 INITIAL PURCHASE - Setting subscription to ACTIVE`);
        subscription_status = "active";
        break;
      case "RENEWAL":
        console.log(`🔄 SUBSCRIPTION RENEWAL - Setting subscription to ACTIVE`);
        subscription_status = "active";
        break;
      case "UNCANCELLATION":
        console.log(
          `♻️ SUBSCRIPTION UNCANCELLED - Setting subscription to ACTIVE`
        );
        subscription_status = "active";
        break;
      case "CANCELLATION":
        console.log(
          `❌ SUBSCRIPTION CANCELLED - Setting subscription to CANCELLED`
        );
        subscription_status = "cancelled";
        break;
      case "BILLING_ISSUE":
        console.log(`💸 BILLING ISSUE - Setting subscription to PAST_DUE`);
        subscription_status = "past_due";
        break;
      default:
        console.log(`❓ Unhandled RevenueCat event type: ${type}`);
        return c.json({ success: true, message: "Event type not handled" });
    }

    const { error: dbError } = await supabase
      .from("users")
      .update({
        subscription_status,
        active_entitlement: activeEntitlement || null,
        revenuecat_customer_id: customer_info.original_app_user_id,
      })
      .eq("id", app_user_id);

    if (dbError) {
      console.error(`Supabase update failed for user ${app_user_id}:`, dbError);
      return c.json({ success: false, error: "Database update failed" }, 500);
    }

    console.log(`✅ Successfully updated subscription for user ${app_user_id}`);
    return c.json({ success: true, message: "Subscription updated" });
  } catch (error: any) {
    console.error("RevenueCat webhook processing error:", error.message);
    return c.json({ success: false, error: "Webhook processing failed" }, 500);
  }
};