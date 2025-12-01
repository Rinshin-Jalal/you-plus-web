import { processUserCall } from "../../trigger/services/call-trigger";
// Note: triggerBatchCallGeneration was not found in original consequence-engine.ts
// TODO: Implement triggerBatchCallGeneration if needed
import { sendVoipPushNotification } from "@/features/core/services/push-notification-service";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { createSupabaseClient } from "@/features/core/utils/database";
// Manual trigger endpoint for testing
export const triggerMorningCallsAdmin = async (c) => {
    const env = c.env;
    // TODO: Implement triggerBatchCallGeneration
    const result = {
        success: true,
        message: "Batch call generation not yet implemented",
    };
    return c.json(result);
};
export const triggerEveningCallsAdmin = async (c) => {
    const env = c.env;
    // TODO: Implement triggerBatchCallGeneration
    const result = {
        success: true,
        message: "Batch call generation not yet implemented",
    };
    return c.json(result);
};
/**
 * Trigger a VoIP call for a specific user immediately
 * POST /trigger/user/:userId/:callType
 */
export const triggerUserCallAdmin = async (c) => {
    const { userId, callType } = c.req.param();
    const env = c.env;
    if (!userId ||
        !callType ||
        ![
            "morning",
            "evening",
            "consequence",
            "intervention",
            "celebration",
            "apology_call",
            "onboarding_call",
            "first_call",
        ].includes(callType)) {
        return c.json({
            error: "Invalid userId or callType. Valid types: morning, evening, consequence, intervention, celebration, apology_call, onboarding_call, first_call",
        }, 400);
    }
    try {
        // Get user from database
        const supabase = createSupabaseClient(env);
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();
        if (error || !user) {
            return c.json({ error: "User not found" }, 404);
        }
        if (!user.push_token) {
            return c.json({ error: "User has no push token configured" }, 400);
        }
        // Use existing consequence engine to trigger call
        const result = await processUserCall(user, callType, env);
        if (result.success) {
            return c.json({
                success: true,
                message: `VoIP call triggered successfully for user ${userId}`,
                callType: callType,
                userId: userId,
            });
        }
        else {
            return c.json({
                success: false,
                error: result.error || "Failed to trigger call",
            }, 500);
        }
    }
    catch (error) {
        console.error("Error triggering user call:", error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
/**
 * Send immediate VoIP push with custom payload
 * POST /trigger/voip
 * Body: { userId: string, callType: string, message?: string, urgency?: "high" | "medium" | "low" }
 */
export const triggerVoipPushAdmin = async (c) => {
    const body = await c.req.json();
    const { userId, callType, message, urgency = "high" } = body;
    const env = c.env;
    if (!userId || !callType) {
        return c.json({
            error: "Missing required fields: userId, callType",
        }, 400);
    }
    try {
        // Get user's push token
        const supabase = createSupabaseClient(env);
        const { data: user, error } = await supabase
            .from("users")
            .select("push_token")
            .eq("id", userId)
            .single();
        if (error || !user || !user.push_token) {
            return c.json({ error: "User not found or no push token" }, 404);
        }
        // Generate call UUID
        const callUUID = generateCallUUID(callType);
        // Send VoIP push
        const success = await sendVoipPushNotification(user.push_token, {
            userId: userId,
            callType: callType,
            type: "accountability_call",
            callUUID: callUUID,
            urgency: urgency,
        }, {
            IOS_VOIP_KEY_ID: env.IOS_VOIP_KEY_ID,
            IOS_VOIP_TEAM_ID: env.IOS_VOIP_TEAM_ID,
            IOS_VOIP_AUTH_KEY: env.IOS_VOIP_AUTH_KEY,
        });
        return c.json({
            success,
            message: success
                ? `VoIP push sent successfully to user ${userId}`
                : `Failed to send VoIP push to user ${userId}`,
            callUUID,
            callType,
            userId,
        });
    }
    catch (error) {
        console.error("Error sending VoIP push:", error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
