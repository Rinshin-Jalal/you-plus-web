import {  Hono } from "hono";
import { WebhookReceiver } from "livekit-server-sdk";
import { createSupabaseClient } from "@/features/core/utils/database";
import type { Env } from "@/index";

const app = new Hono<{ Bindings: Env }>();

app.post("/", async (c) => {
  const webhookSecret = c.env.LIVEKIT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("LIVEKIT_WEBHOOK_SECRET not configured");
    return c.json({ error: "Webhook not configured" }, 500);
  }

  const body = await c.req.text();
  const authHeader = c.req.header("Authorization");

  const receiver = new WebhookReceiver(
    c.env.LIVEKIT_API_KEY,
    webhookSecret as string
  );

  try {
    const event = await receiver.receive(body, authHeader || "");

    console.log("LiveKit webhook event:", event.event);

    switch (event.event) {
      case "room_started":
        await handleRoomStarted(c.env, event);
        break;
      case "room_finished":
        await handleRoomFinished(c.env, event);
        break;
      case "participant_joined":
        await handleParticipantJoined(c.env, event);
        break;
      case "participant_left":
        await handleParticipantLeft(c.env, event);
        break;
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return c.json({ error: "Invalid webhook" }, 401);
  }
});

async function handleRoomStarted(env: Env, event: any) {
  const roomName = event.room?.name;
  console.log(`Room started: ${roomName}`);
  const supabase = createSupabaseClient(env);

  // Update call_analytics with start time
  // Note: call_successful remains null until call finishes
  await supabase
    .from("call_analytics")
    .update({ start_time: new Date().toISOString() })
    .eq("room_name", roomName);
}

async function handleRoomFinished(env: Env, event: any) {
  const roomName = event.room?.name;
  console.log(`Room finished: ${roomName}`);

  // Update call_analytics with end time and success status
  await createSupabaseClient(env)
    .from("call_analytics")
    .update({ call_successful: "success", end_time: new Date().toISOString() })
    .eq("room_name", roomName);
}

async function handleParticipantJoined(env: Env, event: any) {
  const { identity, name } = event.participant || {};
  console.log(`Participant joined: ${identity} (${name})`);
  const supabase = createSupabaseClient(env);
  
  // Update call_analytics if conversation_id is available in the event
  // Note: LiveKit events may not have conversation_id directly - may need to extract from room name or metadata
  const conversationId = event.conversation_id || event.room?.name;
  if (conversationId) {
    await supabase
      .from("call_analytics")
      .update({ start_time: new Date().toISOString() })
      .eq("conversation_id", conversationId);
  }
}

async function handleParticipantLeft(env: Env, event: any) {
  const { identity } = event.participant || {};
  console.log(`Participant left: ${identity}`);
  const supabase = createSupabaseClient(env);
  
  // Update call_analytics if conversation_id is available in the event
  // Note: LiveKit events may not have conversation_id directly - may need to extract from room name or metadata
  const conversationId = event.conversation_id || event.room?.name;
  if (conversationId) {
    await supabase
      .from("call_analytics")
      .update({ end_time: new Date().toISOString() })
      .eq("conversation_id", conversationId);
  }
}

export default app;