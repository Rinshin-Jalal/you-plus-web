import { Hono } from "hono";
import { AccessToken } from "livekit-server-sdk";
import { createSupabaseClient } from "@/features/core/utils/database";
import { requireAuth } from "@/middleware/auth";
import { requireApiKey } from "@/middleware/security";
import type { Env } from "@/index";

const app = new Hono<{
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
  };
}>();

/**
 * POST /api/livekit/token
 * Generate LiveKit access token for authenticated user
 */
app.post("/token", requireAuth, async (c) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const supabase = createSupabaseClient(c.env);

  // Fetch user and future_self separately
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, phone_number")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Fetch future_self to get voice_id
  const { data: futureSelf } = await supabase
    .from("future_self")
    .select("cartesia_voice_id")
    .eq("user_id", userId)
    .maybeSingle();

  const voiceId: string | null = futureSelf?.cartesia_voice_id || null;
  const roomName = `call-${userId}-${Date.now()}`;

  // Create LiveKit token
  const apiKey = c.env.LIVEKIT_API_KEY as string;
  const apiSecret = c.env.LIVEKIT_API_SECRET as string;
  
  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: user.phone_number || userId,
    metadata: JSON.stringify({
      user_id: userId,
      voice_id: voiceId,
      call_type: "daily_accountability",
    }),
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  return c.json({
    token,
    url: c.env.LIVEKIT_URL,
    roomName,
  });
});

/**
 * POST /api/livekit/schedule-call
 * Create a LiveKit room for scheduled call (called by Lambda)
 * Requires X-API-Key header for service-to-service authentication
 */
app.post("/schedule-call", requireApiKey(), async (c) => {
  const body = await c.req.json<{ user_id: string }>();
  const { user_id } = body;

  if (!user_id) {
    return c.json({ error: "user_id required" }, 400);
  }

  const supabase = createSupabaseClient(c.env);

  // Fetch user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, phone_number")
    .eq("id", user_id)
    .single();

  if (userError || !user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Fetch future_self to get voice_id
  const { data: futureSelf } = await supabase
    .from("future_self")
    .select("cartesia_voice_id")
    .eq("user_id", user_id)
    .maybeSingle();

  const roomName = `call-${user_id}-${Date.now()}`;
  const voiceId = futureSelf?.cartesia_voice_id;

  // Save call record
  const { data: callRecord, error: callError } = await supabase
    .from("call_analytics")
    .insert({
      user_id,
      call_type: "daily_accountability",
      status: "scheduled",
      room_name: roomName,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (callError) {
    console.error("Failed to create call record:", callError);
    // Continue anyway - room creation is more important
  }

  // TODO: Send push notification to iOS app
  // This will be implemented in Phase 3

  return c.json({
    success: true,
    room_name: roomName,
    call_id: callRecord?.id,
  });
});

export default app;