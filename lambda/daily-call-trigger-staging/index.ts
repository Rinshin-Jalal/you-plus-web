/**
 * Daily Call Trigger Lambda
 * 
 * This Lambda is triggered by AWS EventBridge Scheduler at each user's
 * preferred call time. It:
 * 1. Validates the user is eligible for a call
 * 2. Checks they haven't been called today
 * 3. Triggers the Cartesia outbound call
 * 4. Logs the call initiation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
interface ScheduledEvent {
  userId: string;
  userName?: string;
  phoneNumber: string;
  timezone: string;
}

interface CartesiaCallResponse {
  success: boolean;
  callId?: string;
  error?: string;
}

// Environment variables (set in Lambda configuration)
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY!;
const CARTESIA_AGENT_ID = process.env.CARTESIA_AGENT_ID!;
const BACKEND_WEBHOOK_URL = process.env.BACKEND_WEBHOOK_URL!; // For call.started event

/**
 * Get start of day in user's timezone
 */
function getStartOfDayInTimezone(timezone: string): Date {
  const now = new Date();
  const localTimeString = now.toLocaleString('en-US', { timeZone: timezone });
  const userNow = new Date(localTimeString);
  userNow.setHours(0, 0, 0, 0);
  return userNow;
}

/**
 * Check if user was already called today (in their timezone)
 */
async function wasCalledToday(
  supabase: SupabaseClient,
  userId: string,
  timezone: string
): Promise<boolean> {
  const startOfDay = getStartOfDayInTimezone(timezone);

  const { data, error } = await supabase
    .from('call_analytics')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .limit(1);

  if (error) {
    console.error(`Error checking today's calls for ${userId}:`, error);
    return false; // Assume not called if error - better to call twice than not at all
  }

  return data && data.length > 0;
}

/**
 * Verify user is eligible for calls
 */
async function isUserEligible(
  supabase: SupabaseClient,
  userId: string
): Promise<{ eligible: boolean; reason?: string; phoneNumber?: string }> {
  const { data: user, error } = await supabase
    .from('users')
    .select('subscription_status, onboarding_completed, phone_number')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { eligible: false, reason: 'User not found' };
  }

  if (!user.onboarding_completed) {
    return { eligible: false, reason: 'Onboarding not completed' };
  }

  if (user.subscription_status !== 'active' && user.subscription_status !== 'trialing') {
    return { eligible: false, reason: `Subscription status: ${user.subscription_status}` };
  }

  if (!user.phone_number) {
    return { eligible: false, reason: 'No phone number on file' };
  }

  return { eligible: true, phoneNumber: user.phone_number };
}

/**
 * Trigger Cartesia outbound call
 */
async function triggerCartesiaCall(
  phoneNumber: string,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<CartesiaCallResponse> {
  try {
    const response = await fetch('https://agents-preview.cartesia.ai/twilio/call/outbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CARTESIA_API_KEY}`,
        'Cartesia-Version': '2025-04-16',
      },
      body: JSON.stringify({
        target_numbers: [phoneNumber],
        agent_id: CARTESIA_AGENT_ID,
        metadata: {
          user_id: userId,
          initiated_by: 'scheduled',
          ...metadata,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Cartesia API error: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log(`Cartesia call initiated:`, data);
    
    return { 
      success: true, 
      callId: data.call_id || data.id || 'unknown'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to trigger Cartesia call:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Notify backend of call initiation (optional - for analytics)
 */
async function notifyBackend(
  userId: string,
  callId: string,
  status: 'initiated' | 'failed',
  error?: string
): Promise<void> {
  try {
    if (!BACKEND_WEBHOOK_URL) {
      console.log('No backend webhook URL configured, skipping notification');
      return;
    }

    await fetch(`${BACKEND_WEBHOOK_URL}/webhook/call/scheduled`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        call_id: callId,
        status,
        error,
        triggered_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Non-critical, just log
    console.warn('Failed to notify backend:', error);
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (event: ScheduledEvent): Promise<{ statusCode: number; body: string }> => {
  console.log('Daily call trigger invoked:', JSON.stringify(event, null, 2));

  const { userId, phoneNumber: eventPhoneNumber, timezone } = event;

  if (!userId) {
    console.error('No userId provided in event');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing userId' }),
    };
  }

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Check user eligibility
    const eligibility = await isUserEligible(supabase, userId);
    if (!eligibility.eligible) {
      console.log(`User ${userId} not eligible: ${eligibility.reason}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          skipped: true, 
          reason: eligibility.reason 
        }),
      };
    }

    const phoneNumber = eligibility.phoneNumber || eventPhoneNumber;
    if (!phoneNumber) {
      console.error(`No phone number for user ${userId}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          skipped: true, 
          reason: 'No phone number' 
        }),
      };
    }

    // 2. Check if already called today
    const userTimezone = timezone || 'UTC';
    const alreadyCalled = await wasCalledToday(supabase, userId, userTimezone);
    if (alreadyCalled) {
      console.log(`User ${userId} already called today, skipping`);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          skipped: true, 
          reason: 'Already called today' 
        }),
      };
    }

    // 3. Trigger Cartesia call
    console.log(`Triggering call for user ${userId} at ${phoneNumber}`);
    const callResult = await triggerCartesiaCall(phoneNumber, userId);

    if (!callResult.success) {
      console.error(`Failed to trigger call for ${userId}:`, callResult.error);
      await notifyBackend(userId, 'failed', 'failed', callResult.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to trigger call', 
          details: callResult.error 
        }),
      };
    }

    // 4. Notify backend (optional)
    await notifyBackend(userId, callResult.callId!, 'initiated');

    console.log(`Successfully triggered call for user ${userId}, callId: ${callResult.callId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        userId,
        callId: callResult.callId,
      }),
    };

  } catch (error) {
    console.error('Unexpected error in daily call trigger:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown',
      }),
    };
  }
};
