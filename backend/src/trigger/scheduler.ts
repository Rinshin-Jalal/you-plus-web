/**
 * AWS EventBridge Scheduler for daily call scheduling
 */

import { logger } from "@trigger.dev/sdk/v3";
import {
  SchedulerClient,
  CreateScheduleCommand,
  FlexibleTimeWindowMode,
  ActionAfterCompletion,
} from "@aws-sdk/client-scheduler";
import { getEnvVar } from "./utils";
import type { ScheduleConfig } from "./types";

function timeToCronExpression(callTime: string): string {
  const [hours, minutes] = callTime.split(':').map(Number);
  return `cron(${minutes} ${hours} * * ? *)`;
}

export async function createDailyCallSchedule(config: ScheduleConfig): Promise<{ success: boolean; error?: string }> {
  logger.info(`📅 Creating EventBridge schedule for user ${config.userId}`);
  
  const awsRegion = process.env.AWS_REGION || "us-east-1";
  const lambdaArn = process.env.AWS_LAMBDA_FUNCTION_ARN;
  const schedulerRoleArn = process.env.AWS_SCHEDULER_ROLE_ARN;
  const scheduleGroupName = process.env.AWS_SCHEDULE_GROUP_NAME || "youplus-daily-calls";
  
  if (!lambdaArn || !schedulerRoleArn) {
    logger.warn("⚠️ AWS schedule env vars not configured, skipping schedule creation");
    return { success: false, error: "AWS scheduler not configured" };
  }
  
  const client = new SchedulerClient({
    region: awsRegion,
    credentials: {
      accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY"),
    },
  });
  
  const scheduleName = `daily-call-${config.userId}`;
  const cronExpression = timeToCronExpression(config.callTime);
  
  try {
    const command = new CreateScheduleCommand({
      Name: scheduleName,
      GroupName: scheduleGroupName,
      ScheduleExpression: cronExpression,
      ScheduleExpressionTimezone: config.timezone,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        Arn: lambdaArn,
        RoleArn: schedulerRoleArn,
        Input: JSON.stringify({
          userId: config.userId,
          phoneNumber: config.phoneNumber,
          userName: config.userName,
          timezone: config.timezone,
        }),
      },
      State: "ENABLED",
      Description: `Daily accountability call for user ${config.userId}`,
      ActionAfterCompletion: ActionAfterCompletion.NONE,
    });
    
    await client.send(command);
    logger.info(`✅ EventBridge schedule created: ${scheduleName}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`❌ Failed to create schedule:`, { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
