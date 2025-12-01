interface PushNotificationEnv {
    IOS_VOIP_KEY_ID?: string;
    IOS_VOIP_TEAM_ID?: string;
    IOS_VOIP_AUTH_KEY?: string;
}
interface VoipPushPayload {
    userId: string;
    callType: "morning" | "evening" | "daily_reckoning" | "promise_followup" | "emergency" | "apology_call" | "apology_required" | "first_call";
    type: "accountability_call" | "accountability_call_retry" | "apology_call_notification" | "apology_ritual_required" | "first_call_notification" | "first_call_notification_retry";
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
export declare function sendVoipPushNotification(tokenInfo: PushTokenInfo | string, // 🔄 Support legacy string format for backward compatibility
payload: VoipPushPayload, env: PushNotificationEnv): Promise<boolean>;
export declare function testIosVoipCertificates(env: PushNotificationEnv): Promise<boolean>;
export {};
