import { uploadAudioToR2, generateAudioFileName } from "@/features/voice/services/r2-upload";
/**
 * Test R2 upload with a small dummy audio file
 * GET /test-r2-upload
 */
export async function testR2Upload(c) {
    const env = c.env;
    try {
        console.log("🧪 Testing R2 upload...");
        // Create a small dummy audio buffer (1KB of zeros)
        const dummyAudioBuffer = new ArrayBuffer(1024);
        const dummyArray = new Uint8Array(dummyAudioBuffer);
        dummyArray.fill(65); // Fill with 'A' characters for testing
        // Generate test filename
        const testUserId = "test-user-123";
        const testRecordingId = "test-recording";
        const fileName = generateAudioFileName(testUserId, testRecordingId, "m4a");
        console.log(`📝 Generated filename: ${fileName}`);
        // Attempt upload
        const uploadResult = await uploadAudioToR2(env, dummyAudioBuffer, fileName, "audio/m4a");
        if (uploadResult.success) {
            return c.json({
                success: true,
                message: "R2 upload test successful!",
                cloudUrl: uploadResult.cloudUrl,
                fileName: fileName,
            });
        }
        else {
            return c.json({
                success: false,
                error: uploadResult.error,
                message: "R2 upload test failed",
            }, 500);
        }
    }
    catch (error) {
        console.error("💥 R2 test failed:", error);
        return c.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, 500);
    }
}
/**
 * Test R2 bucket connection
 * GET /test-r2-connection
 */
export async function testR2Connection(c) {
    const env = c.env;
    try {
        console.log("🧪 Testing R2 bucket connection...");
        // Check if bucket binding exists
        if (!env.AUDIO_BUCKET) {
            return c.json({
                success: false,
                error: "AUDIO_BUCKET binding not found in environment",
                availableBindings: Object.keys(env).filter((k) => k.includes("BUCKET")),
            }, 500);
        }
        // Try to list objects (will fail if bucket doesn't exist or no permissions)
        const listResult = await env.AUDIO_BUCKET.list({ limit: 10 });
        const isDevMode = env.ENVIRONMENT === "development" || !env.ENVIRONMENT;
        return c.json({
            success: true,
            message: "R2 bucket connection successful!",
            environment: env.ENVIRONMENT || "not set (probably development)",
            isLocalDevMode: isDevMode,
            criticalWarning: isDevMode
                ? "🚨 YOU ARE IN DEV MODE! wrangler dev uses a LOCAL/TEMPORARY R2 bucket. Files are NOT uploaded to real Cloudflare R2. Deploy to production to see files in dashboard!"
                : null,
            bucketInfo: {
                objectCount: listResult.objects.length,
                truncated: listResult.truncated,
                totalObjects: listResult.objects.length,
                objects: listResult.objects.map((obj) => ({
                    key: obj.key,
                    size: obj.size,
                    uploaded: obj.uploaded,
                    expectedUrl: `https://audio.yourbigbruhh.app/${obj.key}`,
                })),
            },
            warning: listResult.objects.some((obj) => obj.key.includes("audio/audio/"))
                ? "⚠️ Files found with double 'audio/audio/' prefix - you need to deploy the fixed code!"
                : null,
        });
    }
    catch (error) {
        console.error("💥 R2 connection test failed:", error);
        return c.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, 500);
    }
}
