import { Hono } from "hono";
import { requireAuth } from "@/middleware/auth";
import { generateAccessToken } from "./handlers/access-token";
import type { Env } from "@/index";

const router = new Hono<{
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
  };
}>();

/**
 * Generate Cartesia access token for client-side WebSocket connections
 *
 * This endpoint generates a temporary, limited-scope access token
 * that allows the client to establish WebSocket connections to
 * Cartesia's agent streaming API.
 *
 * The token is generated with a 1-hour TTL and only grants access
 * to the agents API (not TTS or STT).
 */
router.post("/api/cartesia/access-token", requireAuth, generateAccessToken);

export default router;
