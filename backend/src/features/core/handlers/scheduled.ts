import { createClient } from "@supabase/supabase-js";
import type { Env } from "@/types/environment";

interface UserToCall {
  id: string;
  name: string;
  call_time: string;
  timezone: string;
  phone_number?: string;
}

/**
 * Get users whose call_time falls within the current 5-minute window
 */
async function getUsersToCall(env: Env): Promise<UserToCall[]> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get current UTC time
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  
  // We check a 5-minute window
  // Since cron runs every 5 minutes, we need to find users whose call_time 
  // matches the current 5-minute slot
  const windowStart = `${String(currentHour).padStart(2, '0')}:${String(Math.floor(currentMinute / 5) * 5).padStart(2, '0')}:00`;
  const windowEndMinute = Math.floor(currentMinute / 5) * 5 + 4;
  const windowEndHour = windowEndMinute >= 60 ? (currentHour + 1) % 24 : currentHour;
  const windowEnd = `${String(windowEndHour).padStart(2, '0')}:${String(windowEndMinute % 60).padStart(2, '0')}:59`;
  
  console.log(`⏰ Checking for users with call_time between ${windowStart} and ${windowEnd} (UTC)`);
  
  // Query users with:
  // 1. Active subscription
  // 2. Onboarding completed
  // 3. call_time in the current window (adjusted for timezone)
  // 4. Not already called today
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      call_time,
      timezone,
      phone_number
    `)
    .eq('onboarding_completed', true)
    .eq('subscription_status', 'active')
    .not('call_time', 'is', null);
  
  if (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
  
  if (!users || users.length === 0) {
    console.log('📭 No users found with active subscriptions');
    return [];
  }
  
  // Filter users whose local call_time matches the current UTC time
  const usersToCall: UserToCall[] = [];
  
  for (const user of users) {
    if (!user.call_time || !user.timezone) continue;
    
    try {
      // Convert user's local call_time to UTC and check if it matches now
      const userLocalTime = getUserLocalTime(user.timezone);
      const userCallTimeParts = user.call_time.split(':');
      const userCallHour = parseInt(userCallTimeParts[0], 10);
      const userCallMinute = parseInt(userCallTimeParts[1], 10);
      
      // Check if user's local time matches their call_time (within 5-minute window)
      const localHour = userLocalTime.getHours();
      const localMinute = userLocalTime.getMinutes();
      
      // Check if we're in the same 5-minute window
      const callWindowStart = Math.floor(userCallMinute / 5) * 5;
      const localWindowStart = Math.floor(localMinute / 5) * 5;
      
      if (localHour === userCallHour && localWindowStart === callWindowStart) {
        console.log(`✅ User ${user.name} (${user.id}) is due for call at ${user.call_time} ${user.timezone}`);
        usersToCall.push(user);
      }
    } catch (e) {
      console.error(`⚠️ Error processing user ${user.id}:`, e);
    }
  }
  
  return usersToCall;
}

/**
 * Get the current time in a specific timezone
 */
function getUserLocalTime(timezone: string): Date {
  const now = new Date();
  // Get the time string in the user's timezone
  const localTimeString = now.toLocaleString('en-US', { timeZone: timezone });
  return new Date(localTimeString);
}

/**
 * Check if user was already called today
 */
async function wasCalledToday(env: Env, userId: string, timezone: string): Promise<boolean> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get start of day in user's timezone
  const userNow = getUserLocalTime(timezone);
  const startOfDay = new Date(userNow);
  startOfDay.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('call_analytics')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .limit(1);
  
  if (error) {
    console.error(`⚠️ Error checking today's calls for ${userId}:`, error);
    return false; // Assume not called if error
  }
  
  return data && data.length > 0;
}

/**
 * Trigger a call for a user via Cartesia
 */
async function triggerCall(env: Env, user: UserToCall): Promise<boolean> {
  // Check if already called today
  const alreadyCalled = await wasCalledToday(env, user.id, user.timezone);
  if (alreadyCalled) {
    console.log(`⏭️ Skipping ${user.name} - already called today`);
    return false;
  }
  
  if (!user.phone_number) {
    console.log(`⚠️ Skipping ${user.name} - no phone number`);
    return false;
  }
  
  console.log(`📞 Triggering call for ${user.name} (${user.id}) at ${user.phone_number}`);
  
  // TODO: Implement actual Cartesia call trigger
  // This would use the Cartesia API to initiate an outbound call
  // For now, we log it
  
  /*
  // Example Cartesia outbound call (implement when ready)
  const response = await fetch('https://api.cartesia.ai/v1/calls', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CARTESIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: env.CARTESIA_AGENT_ID,
      phone_number: user.phone_number,
      metadata: {
        user_id: user.id,
        initiated_by: 'scheduled',
      },
    }),
  });
  
  if (!response.ok) {
    console.error(`❌ Failed to trigger call for ${user.name}:`, await response.text());
    return false;
  }
  */
  
  console.log(`✅ Call triggered for ${user.name}`);
  return true;
}

/**
 * Main scheduled handler - called by Cloudflare Cron
 */
export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log('🕐 Scheduled call check starting...');
  console.log(`⏰ Cron trigger at: ${new Date(event.scheduledTime).toISOString()}`);
  
  try {
    // Get users who should be called now
    const usersToCall = await getUsersToCall(env);
    
    if (usersToCall.length === 0) {
      console.log('📭 No users to call at this time');
      return;
    }
    
    console.log(`📞 Found ${usersToCall.length} users to call`);
    
    // Trigger calls for each user
    const results = await Promise.allSettled(
      usersToCall.map(user => triggerCall(env, user))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value)).length;
    
    console.log(`✅ Scheduled check complete: ${successful} calls triggered, ${failed} skipped/failed`);
  } catch (error) {
    console.error('❌ Scheduled handler error:', error);
  }
}
