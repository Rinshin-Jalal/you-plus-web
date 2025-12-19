/**
 * Daily Call Trigger Lambda
 * 
 * This Lambda is triggered by AWS EventBridge Scheduler at each user's
 * preferred call time. It:
 * 1. Validates the user is eligible for a call
 * 2. Checks they haven't been called today
 * 3. Creates a LiveKit room via backend API
 * 4. Logs the call initiation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
interface ScheduledEvent {
  userId: string;
  userName?: string;
  phoneNumber?: string;
  timezone?: string;
  detail?: {
    userId: string;
    userName?: string;
    phoneNumber?: string;
    timezone?: string;
  };
}

interface LiveKitScheduleResponse {
  success: boolean;
  room_name?: string;
  call_id?: string;
  error?: string;
}

// Environment variables (set in Lambda configuration)
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BACKEND_URL = process.env.BACKEND_URL!;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY!;

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
 * Create LiveKit room via backend API
 */
async function createLiveKitRoom(
  userId: string
): Promise<LiveKitScheduleResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/livekit/schedule-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BACKEND_API_KEY,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      let errorData: { error: string };
      try {
        const jsonData = await response.json() as unknown;
        errorData = typeof jsonData === 'object' && jsonData !== null && 'error' in jsonData
          ? jsonData as { error: string }
          : { error: JSON.stringify(jsonData) };
      } catch {
        const errorText = await response.text();
        errorData = { error: errorText };
      }
      console.error(`Backend API error: ${response.status} -`, errorData);
      return { success: false, error: JSON.stringify(errorData) };
    }

    const data = await response.json() as { room_name?: string; call_id?: string };
    console.log(`LiveKit room created:`, data);
    
    return { 
      success: true, 
      room_name: data.room_name,
      call_id: data.call_id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to create LiveKit room:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (event: ScheduledEvent | { detail: ScheduledEvent }): Promise<{ statusCode: number; body: string }> => {
  console.log('Daily call trigger invoked:', JSON.stringify(event, null, 2));

  // Handle EventBridge event structure (event.detail.userId) or direct event (event.userId)
  const eventData = 'detail' in event ? event.detail : event;
  if (!eventData) {
    console.error('No event data provided');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing event data' }),
    };
  }
  const userId = eventData.userId;

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

    // 2. Check if already called today
    const userTimezone = eventData?.timezone || 'UTC';
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

    // 3. Create LiveKit room via backend
    console.log(`Creating LiveKit room for user ${userId}`);
    const roomResult = await createLiveKitRoom(userId);

    if (!roomResult.success) {
      console.error(`Failed to create LiveKit room for ${userId}:`, roomResult.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to create LiveKit room', 
          details: roomResult.error 
        }),
      };
    }

    console.log(`Successfully created LiveKit room for user ${userId}, room: ${roomResult.room_name}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        userId,
        roomName: roomResult.room_name,
        callId: roomResult.call_id,
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
