/**
 * EventBridge Scheduler Service
 * 
 * Manages per-user call schedules using AWS EventBridge Scheduler.
 * Each user gets their own schedule that triggers a Lambda function
 * at their preferred call time.
 */

import {
  SchedulerClient,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  DeleteScheduleCommand,
  GetScheduleCommand,
  FlexibleTimeWindowMode,
  ActionAfterCompletion,
} from '@aws-sdk/client-scheduler';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ScheduleConfig {
  userId: string;
  callTime: string; // HH:MM format (24-hour)
  timezone: string; // IANA timezone (e.g., "America/New_York")
  phoneNumber: string;
  userName?: string;
}

export interface SchedulerEnv {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_LAMBDA_FUNCTION_ARN: string;
  AWS_SCHEDULER_ROLE_ARN: string;
  AWS_SCHEDULE_GROUP_NAME: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a sanitized schedule name from userId
 * EventBridge schedule names must be alphanumeric, hyphens, and underscores only
 */
function getScheduleName(userId: string): string {
  // UUIDs contain hyphens which are allowed
  return `daily-call-${userId}`;
}

/**
 * Convert HH:MM time and timezone to an EventBridge cron expression
 * EventBridge cron format: cron(minutes hours day-of-month month day-of-week year)
 * 
 * Note: EventBridge Scheduler supports timezones directly in the ScheduleExpressionTimezone field
 */
function timeToCronExpression(callTime: string): string {
  const [hours, minutes] = callTime.split(':').map(Number);
  // cron(minutes hours * * ? *)
  // The ? is required for day-of-week when day-of-month is specified as *
  return `cron(${minutes} ${hours} * * ? *)`;
}

/**
 * Create an EventBridge Scheduler client
 */
function createSchedulerClient(env: SchedulerEnv): SchedulerClient {
  return new SchedulerClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVICE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new call schedule for a user
 */
export async function createCallSchedule(
  config: ScheduleConfig,
  env: SchedulerEnv
): Promise<{ success: boolean; scheduleName?: string; error?: string }> {
  const client = createSchedulerClient(env);
  const scheduleName = getScheduleName(config.userId);
  const cronExpression = timeToCronExpression(config.callTime);

  console.log(`Creating schedule: ${scheduleName}`);
  console.log(`Cron: ${cronExpression}, Timezone: ${config.timezone}`);

  try {
    const command = new CreateScheduleCommand({
      Name: scheduleName,
      GroupName: env.AWS_SCHEDULE_GROUP_NAME,
      ScheduleExpression: cronExpression,
      ScheduleExpressionTimezone: config.timezone,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        Arn: env.AWS_LAMBDA_FUNCTION_ARN,
        RoleArn: env.AWS_SCHEDULER_ROLE_ARN,
        Input: JSON.stringify({
          userId: config.userId,
          phoneNumber: config.phoneNumber,
          userName: config.userName,
          timezone: config.timezone,
        }),
      },
      State: 'ENABLED',
      Description: `Daily accountability call for user ${config.userId}`,
      // Keep the schedule running indefinitely (daily calls)
      ActionAfterCompletion: ActionAfterCompletion.NONE,
    });

    await client.send(command);
    console.log(`✅ Schedule created: ${scheduleName}`);
    
    return { success: true, scheduleName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to create schedule ${scheduleName}:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update an existing call schedule (e.g., when user changes their call time)
 */
export async function updateCallSchedule(
  config: ScheduleConfig,
  env: SchedulerEnv
): Promise<{ success: boolean; error?: string }> {
  const client = createSchedulerClient(env);
  const scheduleName = getScheduleName(config.userId);
  const cronExpression = timeToCronExpression(config.callTime);

  console.log(`Updating schedule: ${scheduleName}`);
  console.log(`New cron: ${cronExpression}, Timezone: ${config.timezone}`);

  try {
    const command = new UpdateScheduleCommand({
      Name: scheduleName,
      GroupName: env.AWS_SCHEDULE_GROUP_NAME,
      ScheduleExpression: cronExpression,
      ScheduleExpressionTimezone: config.timezone,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        Arn: env.AWS_LAMBDA_FUNCTION_ARN,
        RoleArn: env.AWS_SCHEDULER_ROLE_ARN,
        Input: JSON.stringify({
          userId: config.userId,
          phoneNumber: config.phoneNumber,
          userName: config.userName,
          timezone: config.timezone,
        }),
      },
      State: 'ENABLED',
      Description: `Daily accountability call for user ${config.userId}`,
      ActionAfterCompletion: ActionAfterCompletion.NONE,
    });

    await client.send(command);
    console.log(`✅ Schedule updated: ${scheduleName}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to update schedule ${scheduleName}:`, error);
    
    // If schedule doesn't exist, try to create it instead
    if (errorMessage.includes('ResourceNotFoundException') || errorMessage.includes('not found')) {
      console.log(`Schedule not found, creating new one...`);
      return createCallSchedule(config, env);
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a user's call schedule
 */
export async function deleteCallSchedule(
  userId: string,
  env: SchedulerEnv
): Promise<{ success: boolean; error?: string }> {
  const client = createSchedulerClient(env);
  const scheduleName = getScheduleName(userId);

  console.log(`Deleting schedule: ${scheduleName}`);

  try {
    const command = new DeleteScheduleCommand({
      Name: scheduleName,
      GroupName: env.AWS_SCHEDULE_GROUP_NAME,
    });

    await client.send(command);
    console.log(`✅ Schedule deleted: ${scheduleName}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If already deleted, that's fine
    if (errorMessage.includes('ResourceNotFoundException') || errorMessage.includes('not found')) {
      console.log(`Schedule ${scheduleName} already deleted or doesn't exist`);
      return { success: true };
    }
    
    console.error(`❌ Failed to delete schedule ${scheduleName}:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Pause a user's call schedule (e.g., during vacation or subscription lapse)
 */
export async function pauseCallSchedule(
  userId: string,
  env: SchedulerEnv
): Promise<{ success: boolean; error?: string }> {
  const client = createSchedulerClient(env);
  const scheduleName = getScheduleName(userId);

  console.log(`Pausing schedule: ${scheduleName}`);

  try {
    // First, get the current schedule to preserve its settings
    const getCommand = new GetScheduleCommand({
      Name: scheduleName,
      GroupName: env.AWS_SCHEDULE_GROUP_NAME,
    });

    const schedule = await client.send(getCommand);

    // Update with State: DISABLED
    const updateCommand = new UpdateScheduleCommand({
      Name: scheduleName,
      GroupName: env.AWS_SCHEDULE_GROUP_NAME,
      ScheduleExpression: schedule.ScheduleExpression!,
      ScheduleExpressionTimezone: schedule.ScheduleExpressionTimezone,
      FlexibleTimeWindow: schedule.FlexibleTimeWindow,
      Target: schedule.Target,
      State: 'DISABLED',
      Description: schedule.Description,
      ActionAfterCompletion: ActionAfterCompletion.NONE,
    });

    await client.send(updateCommand);
    console.log(`✅ Schedule paused: ${scheduleName}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to pause schedule ${scheduleName}:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Resume a paused call schedule
 */
export async function resumeCallSchedule(
  userId: string,
  env: SchedulerEnv
): Promise<{ success: boolean; error?: string }> {
  const client = createSchedulerClient(env);
  const scheduleName = getScheduleName(userId);

  console.log(`Resuming schedule: ${scheduleName}`);

  try {
    // First, get the current schedule to preserve its settings
    const getCommand = new GetScheduleCommand({
      Name: scheduleName,
      GroupName: env.AWS_SCHEDULE_GROUP_NAME,
    });

    const schedule = await client.send(getCommand);

    // Update with State: ENABLED
    const updateCommand = new UpdateScheduleCommand({
      Name: scheduleName,
      GroupName: env.AWS_SCHEDULE_GROUP_NAME,
      ScheduleExpression: schedule.ScheduleExpression!,
      ScheduleExpressionTimezone: schedule.ScheduleExpressionTimezone,
      FlexibleTimeWindow: schedule.FlexibleTimeWindow,
      Target: schedule.Target,
      State: 'ENABLED',
      Description: schedule.Description,
      ActionAfterCompletion: ActionAfterCompletion.NONE,
    });

    await client.send(updateCommand);
    console.log(`✅ Schedule resumed: ${scheduleName}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to resume schedule ${scheduleName}:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get a user's current schedule (for debugging/admin)
 */
export async function getCallSchedule(
  userId: string,
  env: SchedulerEnv
): Promise<{ 
  success: boolean; 
  schedule?: {
    name: string;
    expression: string;
    timezone: string;
    state: string;
    nextInvocation?: Date;
  };
  error?: string;
}> {
  const client = createSchedulerClient(env);
  const scheduleName = getScheduleName(userId);

  try {
    const command = new GetScheduleCommand({
      Name: scheduleName,
      GroupName: env.AWS_SCHEDULE_GROUP_NAME,
    });

    const response = await client.send(command);
    
    return {
      success: true,
      schedule: {
        name: response.Name!,
        expression: response.ScheduleExpression!,
        timezone: response.ScheduleExpressionTimezone || 'UTC',
        state: response.State || 'UNKNOWN',
        // Note: EventBridge doesn't directly expose next invocation time in GetSchedule
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('ResourceNotFoundException') || errorMessage.includes('not found')) {
      return { success: false, error: 'Schedule not found' };
    }
    
    console.error(`❌ Failed to get schedule ${scheduleName}:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create or update a schedule (upsert)
 * This is the main function to call - it handles both cases
 */
export async function upsertCallSchedule(
  config: ScheduleConfig,
  env: SchedulerEnv
): Promise<{ success: boolean; scheduleName?: string; error?: string }> {
  // Try to update first, if it doesn't exist, create
  const updateResult = await updateCallSchedule(config, env);
  
  if (updateResult.success) {
    return { success: true, scheduleName: getScheduleName(config.userId) };
  }
  
  // updateCallSchedule already handles the "create if not exists" case
  return updateResult;
}
