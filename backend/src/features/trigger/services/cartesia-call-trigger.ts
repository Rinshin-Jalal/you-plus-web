/**
 * Cartesia Line Call Trigger Service
 *
 * Triggers outbound phone calls using Cartesia Line's agent API.
 * This replaces the VoIP push flow with direct telephony calls.
 *
 * Flow:
 * 1. Validate user has phone number
 * 2. Check if call already exists today
 * 3. POST to Cartesia agents API to trigger outbound dial
 * 4. Cartesia Line agent handles the call with user's cloned voice
 */

import { CallType, User } from "@/types/database";
import { createSupabaseClient, checkCallExists, saveCallAnalytics } from "@/features/core/utils/database";
import { format } from "date-fns";
import type { Env } from "@/index";

// Cartesia Line agents preview API endpoint
const CARTESIA_AGENTS_API = "https://agents-preview.cartesia.ai";

/**
 * Result of a Cartesia Line call trigger attempt
 */
interface CartesiaCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

/**
 * Configuration for the outbound call
 */
interface CartesiaCallConfig {
  targetNumber: string;
  userId: string;
  agentId: string;
  metadata?: Record<string, any>;
}

/**
 * Triggers an outbound call using Cartesia Line's agent API.
 *
 * @param config Call configuration including target phone number and user context
 * @param env Environment variables with CARTESIA_API_KEY
 */
export async function triggerCartesiaCall(
  config: CartesiaCallConfig,
  env: Env
): Promise<CartesiaCallResult> {
  try {
    if (!env.CARTESIA_API_KEY) {
      throw new Error("CARTESIA_API_KEY not configured");
    }

    console.log(`📞 Triggering Cartesia Line call to ${config.targetNumber}`);

    // Call Cartesia's outbound dial API
    const response = await fetch(`${CARTESIA_AGENTS_API}/twilio/call/outbound`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_numbers: [config.targetNumber],
        agent_id: config.agentId,
        metadata: {
          user_id: config.userId,
          ...config.metadata,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cartesia API error: ${response.status} - ${errorText}`);
      throw new Error(`Cartesia call failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Cartesia call initiated: ${JSON.stringify(result)}`);

    return {
      success: true,
      callId: result.call_id || result.id,
    };
  } catch (error) {
    console.error("💥 Cartesia call trigger error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process a user for Cartesia Line call.
 * Validates conditions and triggers the outbound call.
 *
 * @param user User object with phone number
 * @param callType Type of accountability call
 * @param env Environment variables
 */
export async function processCartesiaCall(
  user: User & { phone_number?: string },
  callType: CallType,
  env: Env
): Promise<CartesiaCallResult> {
  try {
    const { id: userId, phone_number } = user;

    // Validate phone number exists
    if (!phone_number) {
      return {
        success: false,
        error: `User ${userId} does not have a phone number configured`,
      };
    }

    // Check if call already exists today (prevent spam)
    const today = format(new Date(), "yyyy-MM-dd");
    const callExists = await checkCallExists(env, userId, today);
    
    if (callExists) {
      return {
        success: false,
        error: `Call already exists for user ${userId} today`,
      };
    }

    // Get the deployed agent ID (should be stored in env after cartesia deploy)
    const agentId = env.CARTESIA_AGENT_ID;
    
    if (!agentId) {
      return {
        success: false,
        error: "CARTESIA_AGENT_ID not configured. Run 'cartesia deploy' first.",
      };
    }

    // Trigger the outbound call
    const result = await triggerCartesiaCall(
      {
        targetNumber: phone_number,
        userId,
        agentId,
        metadata: {
          callType,
          scheduledAt: new Date().toISOString(),
        },
      },
      env
    );

    if (result.success) {
      // Record the call in call_analytics table
      await saveCallAnalytics(env, userId, {
        call_type: callType,
        conversation_id: result.callId || "",
        mood: "unknown",
        call_duration_seconds: 0,
        call_quality_score: 0,
        commitment_is_specific: false,
        sentiment_trajectory: [],
        excuses_detected: [],
        quotes_captured: [],
        is_retry: false,
        retry_attempt_number: 0,
        acknowledged: false,
        call_successful: "unknown",
        source: "cartesia",
      });

      console.log(`✅ Cartesia call recorded for user ${userId}`);
    }

    return result;
  } catch (error) {
    console.error("💥 processCartesiaCall failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handler for manual call trigger endpoint.
 * Allows triggering a call for a specific user via API.
 */
export async function handleManualCallTrigger(
  userId: string,
  env: Env
): Promise<CartesiaCallResult> {
  const supabase = createSupabaseClient(env);

  // Fetch user with phone number
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, phone_number")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return {
      success: false,
      error: `User ${userId} not found`,
    };
  }

  return processCartesiaCall(user, "daily_reckoning", env);
}
