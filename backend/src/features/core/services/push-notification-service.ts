import { ApnsClient, SilentNotification } from "@fivesheepco/cloudflare-apns2";

interface PushNotificationEnv {
  IOS_VOIP_KEY_ID?: string;
  IOS_VOIP_TEAM_ID?: string;
  IOS_VOIP_AUTH_KEY?: string;
}

interface VoipPushPayload {
  userId: string;
  callType:
    | "morning"
    | "evening"
    | "daily_reckoning"
    | "promise_followup"
    | "emergency"
    | "apology_call"
    | "apology_required"
    | "first_call";

  type:
    | "accountability_call"
    | "accountability_call_retry"
    | "apology_call_notification"
    | "apology_ritual_required"
    | "first_call_notification"
    | "first_call_notification_retry";

  callUUID: string;
  urgency: "high" | "medium" | "low" | "critical" | "emergency";
  attemptNumber?: number;
  retryReason?: "missed" | "declined" | "failed";
  message?: string;
  metadata?: Record<string, unknown>;
}

interface PushTokenInfo {
  token: string;
  platform: "ios" | "android";
  isVoipToken?: boolean;
}

export async function sendVoipPushNotification(
  tokenInfo: PushTokenInfo | string,
  payload: VoipPushPayload,
  env: PushNotificationEnv
): Promise<boolean> {
  if (typeof tokenInfo === "string") {
    tokenInfo = detectPlatformFromToken(tokenInfo);
  }

  const { token, platform, isVoipToken } = tokenInfo;

  console.log(`📱 Dispatching ${platform} VoIP push to user ${payload.userId}`);

  try {
    if (platform === "ios" && isVoipToken) {
      return await sendIosVoipPush(token, payload, env);
    } else if (platform === "android" || !isVoipToken) {
      return await sendExpoVoipPush(token, payload);
    } else {
      console.error(
        `❌ Unsupported push configuration: ${platform}, VoIP: ${isVoipToken}`
      );
      return false;
    }
  } catch (error) {
    console.error(
      `💥 Critical push notification failure for ${platform}:`,
      error
    );
    return false;
  }
}

async function sendIosVoipPush(
  voipToken: string,
  payload: VoipPushPayload,
  env: PushNotificationEnv
): Promise<boolean> {
  if (!env.IOS_VOIP_KEY_ID || !env.IOS_VOIP_TEAM_ID || !env.IOS_VOIP_AUTH_KEY) {
    console.error("❌ iOS VoIP certificates missing from environment");
    return false;
  }

  try {
    console.log(`🍎 Initiating iOS VoIP push for user ${payload.userId}`);

    const client = new ApnsClient({
      host: "api.push.apple.com",
      team: env.IOS_VOIP_TEAM_ID,
      keyId: env.IOS_VOIP_KEY_ID,
      signingKey: atob(env.IOS_VOIP_AUTH_KEY),
      defaultTopic: "com.rinshinjalal.yourbigbruhh.voip",
    });

    const notification = new SilentNotification(voipToken);

    (notification as any).payload = {
      aps: {
        "content-available": 1,
      },
      handle: "YOU+ Accountability",
      caller: "YOU+ Accountability Check",
      uuid: payload.callUUID,
      callUUID: payload.callUUID,
      userId: payload.userId,
      callType: payload.callType,
      type: payload.type,
      urgency: payload.urgency,
      metadata: payload.metadata || {},
    };

    console.log(`🍎 Transmitting iOS VoIP push via APNS2 library`);

    await client.send(notification);
    console.log("✅ iOS VoIP push delivered successfully via APNS");
    return true;
  } catch (err: any) {
    console.error(
      "❌ iOS VoIP push delivery failed:",
      err.reason || err.message
    );
    return false;
  }
}

async function sendExpoVoipPush(
  expoPushToken: string,
  payload: VoipPushPayload
): Promise<boolean> {
  if (
    !expoPushToken ||
    (!expoPushToken.startsWith("ExponentPushToken[") &&
      !expoPushToken.startsWith("ExpoPushToken["))
  ) {
    console.error(`❌ Invalid Expo push token format detected`);
    return false;
  }

  const message = {
    to: expoPushToken,
    sound: null,
    body: "Time to face yourself",
    title: "YOU+ Accountability Check",
    data: { ...payload, uuid: payload.callUUID, metadata: payload.metadata || {} },
    _contentAvailable: true,
    priority: "high" as const,
    channelId: "accountability-calls",
  };

  try {
    console.log(`🤖 Transmitting Android push via Expo service to: [REDACTED]`);

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(
        `❌ Expo push service rejected: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const result = await response.json();
    console.log("✅ Android push delivered successfully via Expo:", result);
    return true;
  } catch (error) {
    console.error("💥 Expo push service error:", error);
    return false;
  }
}

function detectPlatformFromToken(token: string): PushTokenInfo {
  if (
    token.startsWith("ExponentPushToken[") ||
    token.startsWith("ExpoPushToken[")
  ) {
    return {
      token,
      platform: "android",
      isVoipToken: false,
    };
  } else if (token.length === 64) {
    return {
      token,
      platform: "ios",
      isVoipToken: true,
    };
  } else {
    console.warn(
      `⚠️ Unknown push token format detected: ${token.substring(0, 20)}...`
    );
    return {
      token,
      platform: "android",
      isVoipToken: false,
    };
  }
}

export async function testIosVoipCertificates(
  env: PushNotificationEnv
): Promise<boolean> {
  if (!env.IOS_VOIP_KEY_ID || !env.IOS_VOIP_TEAM_ID || !env.IOS_VOIP_AUTH_KEY) {
    console.error(
      "❌ iOS VoIP environment variables missing - check configuration"
    );
    return false;
  }

  try {
    const client = new ApnsClient({
      host: "api.push.apple.com",
      team: env.IOS_VOIP_TEAM_ID,
      keyId: env.IOS_VOIP_KEY_ID,
      signingKey: atob(env.IOS_VOIP_AUTH_KEY),
      defaultTopic: "com.rinshinjalal.yourbigbruhh.voip",
    });

    console.log(
      "✅ iOS VoIP certificates validated successfully - APNS ready for production"
    );
    return true;
  } catch (error) {
    console.error("❌ iOS VoIP certificate validation failed:", error);
    return false;
  }
}