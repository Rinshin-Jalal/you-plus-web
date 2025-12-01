/* ═══════════════════════════════════════════════════════════════════════════════
 * 📱 YOU+ PUSH NOTIFICATION SERVICE - VOIP CALL DELIVERY SYSTEM
 *
 * The critical communication bridge that wakes up user devices to receive
 * accountability calls. Handles cross-platform VoIP push notifications with
 * platform-specific optimizations for maximum delivery reliability.
 *
 * Core Philosophy: "The call must reach them - accountability depends on connection"
 * ═══════════════════════════════════════════════════════════════════════════════ */
// 📚 Using @fivesheepco/cloudflare-apns2 for Cloudflare Workers compatibility
import { ApnsClient, SilentNotification } from "@fivesheepco/cloudflare-apns2";
// 🔐 JWT generation is now handled by APNS2 library - no manual implementation needed
/* ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 MAIN VOIP PUSH NOTIFICATION DISPATCHER
 *
 * The master function that routes VoIP push notifications to correct
 * platform-specific delivery system. Handles complexity of iOS vs Android
 * delivery mechanisms while maintaining a unified interface.
 *
 * Platform Strategy:
 * 🍎 iOS: Direct APNs VoIP push (requires certificates, instant wake-up)
 * 🤖 Android: Expo Push Service (high-priority FCM, reliable delivery)
 * ═══════════════════════════════════════════════════════════════════════════════ */
export async function sendVoipPushNotification(tokenInfo, // 🔄 Support legacy string format for backward compatibility
payload, env) {
    // 🔄 Handle legacy string token format - auto-detect platform
    if (typeof tokenInfo === "string") {
        tokenInfo = detectPlatformFromToken(tokenInfo);
    }
    const { token, platform, isVoipToken } = tokenInfo;
    console.log(`📱 Dispatching ${platform} VoIP push to user ${payload.userId}`);
    try {
        // 🍎 Route to iOS APNs for VoIP tokens
        if (platform === "ios" && isVoipToken) {
            return await sendIosVoipPush(token, payload, env);
        }
        // 🤖 Route to Expo Push Service for Android or non-VoIP iOS tokens
        else if (platform === "android" || !isVoipToken) {
            return await sendExpoVoipPush(token, payload);
        }
        // ❌ Unsupported configuration
        else {
            console.error(`❌ Unsupported push configuration: ${platform}, VoIP: ${isVoipToken}`);
            return false;
        }
    }
    catch (error) {
        console.error(`💥 Critical push notification failure for ${platform}:`, error);
        return false; // 🛟 Always return boolean for consistent error handling
    }
}
/* ═══════════════════════════════════════════════════════════════════════════════
 * 🍎 IOS VOIP PUSH SERVICE - APPLE PUSH NOTIFICATION SERVICE
 *
 * Handles iOS VoIP push notifications via Apple's Push Notification Service.
 * Uses APNS2 library for Cloudflare Workers compatibility. VoIP pushes
 * instantly wake device and trigger app's VoIP handler.
 *
 * Critical: VoIP pushes bypass Do Not Disturb and have special privileges
 * for waking devices - essential for accountability call delivery.
 * ═══════════════════════════════════════════════════════════════════════════════ */
async function sendIosVoipPush(voipToken, payload, env) {
    // 🔍 Validate iOS VoIP configuration - all certificates required
    if (!env.IOS_VOIP_KEY_ID || !env.IOS_VOIP_TEAM_ID || !env.IOS_VOIP_AUTH_KEY) {
        console.error("❌ iOS VoIP certificates missing from environment");
        return false;
    }
    try {
        console.log(`🍎 Initiating iOS VoIP push for user ${payload.userId}`);
        // 📡 Create APNS client with VoIP-specific configuration
        const client = new ApnsClient({
            host: "api.push.apple.com", // 🌐 Production APNS server
            team: env.IOS_VOIP_TEAM_ID, // 👥 Apple Developer Team ID
            keyId: env.IOS_VOIP_KEY_ID, // 🔑 APNs Auth Key ID
            signingKey: atob(env.IOS_VOIP_AUTH_KEY), // 📄 Decode base64 .p8 certificate
            defaultTopic: "com.rinshinjalal.yourbigbruhh.voip", // 📞 VoIP-specific topic
        });
        // 📦 Create silent notification for VoIP delivery (bypasses user notification UI)
        const notification = new SilentNotification(voipToken);
        // 🎯 Build VoIP-specific payload for device wake-up and call handling
        notification.payload = {
            aps: {
                "content-available": 1, // 🔕 Silent push - triggers background processing
            },
            // 📞 Custom VoIP payload - required by our native VoIP plugin
            handle: "YOU+ Accountability", // 📋 Display name for incoming call UI
            caller: "YOU+ Accountability Check", // 👤 Caller ID shown to user
            uuid: payload.callUUID, // 🆔 Unique call identifier (primary)
            callUUID: payload.callUUID, // 🆔 Duplicate for compatibility
            userId: payload.userId, // 👤 Target user identifier
            callType: payload.callType, // 🎯 Type of accountability intervention
            type: payload.type, // 📱 Frontend notification category
            urgency: payload.urgency, // 🚨 Priority level for user interface
            metadata: payload.metadata || {},
        };
        console.log(`🍎 Transmitting iOS VoIP push via APNS2 library`);
        // 🚀 Send VoIP push notification - will instantly wake device
        await client.send(notification);
        console.log("✅ iOS VoIP push delivered successfully via APNS");
        return true;
    }
    catch (err) {
        console.error("❌ iOS VoIP push delivery failed:", err.reason || err.message);
        return false; // 🛟 Safe failure response
    }
}
/* ═══════════════════════════════════════════════════════════════════════════════
 * 🤖 ANDROID VOIP PUSH SERVICE - EXPO PUSH NOTIFICATION SERVICE
 *
 * Handles Android VoIP push notifications via Expo's Push Notification Service,
 * which routes through Firebase Cloud Messaging (FCM) with high priority.
 * Android doesn't have true VoIP pushes like iOS, but high-priority FCM
 * achieves similar wake-up reliability.
 * ═══════════════════════════════════════════════════════════════════════════════ */
async function sendExpoVoipPush(expoPushToken, payload) {
    // 🔍 Validate Expo push token format (must start with proper prefix)
    if (!expoPushToken ||
        (!expoPushToken.startsWith("ExponentPushToken[") &&
            !expoPushToken.startsWith("ExpoPushToken["))) {
        console.error(`❌ Invalid Expo push token format detected`);
        return false;
    }
    // 📦 Build high-priority push notification message
    const message = {
        to: expoPushToken, // 🎯 Target device token
        sound: null, // 🔕 Silent - app handles ringing
        body: "Time to face yourself", // 💭 Notification body text
        title: "YOU+ Accountability Check", // 📋 Notification title
        data: { ...payload, uuid: payload.callUUID, metadata: payload.metadata || {} }, // 📊 Custom data payload
        // 🍎 iOS-specific configuration (for non-VoIP iOS tokens)
        _contentAvailable: true, // 📱 Enable background processing
        // 🤖 Android-specific configuration
        priority: "high", // 🚨 High priority for instant delivery
        channelId: "accountability-calls", // 📢 Notification channel for categorization
    };
    try {
        console.log(`🤖 Transmitting Android push via Expo service to: [REDACTED]`);
        // 🚀 Send high-priority push via Expo Push Service API
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                Accept: "application/json", // 📋 Expect JSON response
                "Accept-encoding": "gzip, deflate", // 🗜️ Compression support
                "Content-Type": "application/json", // 📦 JSON payload
            },
            body: JSON.stringify(message), // 📊 Serialized notification data
        });
        // 🔍 Check Expo service response status
        if (!response.ok) {
            console.error(`❌ Expo push service rejected: ${response.status} ${response.statusText}`);
            return false;
        }
        const result = await response.json();
        console.log("✅ Android push delivered successfully via Expo:", result);
        return true;
    }
    catch (error) {
        console.error("💥 Expo push service error:", error);
        return false; // 🛟 Safe failure response
    }
}
/* ═══════════════════════════════════════════════════════════════════════════════
 * 🔍 PLATFORM DETECTION SYSTEM - LEGACY TOKEN SUPPORT
 *
 * Auto-detects platform and token type from token format for backward
 * compatibility. Analyzes token patterns to determine routing strategy.
 * ═══════════════════════════════════════════════════════════════════════════════ */
function detectPlatformFromToken(token) {
    // 🤖 Detect Expo push tokens (Android via FCM)
    if (token.startsWith("ExponentPushToken[") ||
        token.startsWith("ExpoPushToken[")) {
        return {
            token,
            platform: "android", // 🤖 Route to Expo Push Service
            isVoipToken: false, // 📱 Standard push notification
        };
    }
    // 🍎 Detect iOS VoIP tokens (64-character hex strings)
    else if (token.length === 64) {
        return {
            token,
            platform: "ios", // 🍎 Route to Apple Push Notification Service
            isVoipToken: true, // 📞 VoIP-specific token
        };
    }
    // ❓ Unknown token format - fallback strategy
    else {
        console.warn(`⚠️ Unknown push token format detected: ${token.substring(0, 20)}...`);
        return {
            token,
            platform: "android", // 🤖 Default to Android/Expo for safety
            isVoipToken: false, // 📱 Standard push notification
        };
    }
}
/* ═══════════════════════════════════════════════════════════════════════════════
 * 🧪 IOS VOIP CERTIFICATE VALIDATION SYSTEM
 *
 * Tests iOS VoIP certificate configuration without sending actual push
 * notifications. Validates that all required certificates and keys are
 * properly configured for production APNS communication.
 * ═════════════════════════════════════════════════════════════════════════════ */
export async function testIosVoipCertificates(env) {
    // 🔍 Check that all required VoIP environment variables are present
    if (!env.IOS_VOIP_KEY_ID || !env.IOS_VOIP_TEAM_ID || !env.IOS_VOIP_AUTH_KEY) {
        console.error("❌ iOS VoIP environment variables missing - check configuration");
        return false;
    }
    try {
        // 🧪 Attempt to create APNS client to validate certificate configuration
        const client = new ApnsClient({
            host: "api.push.apple.com", // 🌐 Production APNS server
            team: env.IOS_VOIP_TEAM_ID, // 👥 Apple Developer Team ID
            keyId: env.IOS_VOIP_KEY_ID, // 🔑 APNs Auth Key ID
            signingKey: atob(env.IOS_VOIP_AUTH_KEY), // 📄 Decode base64 .p8 certificate
            defaultTopic: "com.rinshinjalal.yourbigbruhh.voip", // 📞 VoIP-specific topic
        });
        console.log("✅ iOS VoIP certificates validated successfully - APNS ready for production");
        return true;
    }
    catch (error) {
        console.error("❌ iOS VoIP certificate validation failed:", error);
        return false; // 🛟 Certificate configuration is invalid
    }
}
