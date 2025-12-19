import type { Context } from "hono";
import type { Env } from "@/index";

/**
 * Generate a Cartesia access token for client-side WebSocket connections
 *
 * Flow:
 * 1. Verify user is authenticated (middleware handles this)
 * 2. Call Cartesia API with our master API key
 * 3. Request token with "agents" grant (WebSocket voice calls)
 * 4. Return token to client with expiration info
 */
export async function generateAccessToken(
  c: Context<{
    Bindings: Env;
    Variables: { userId: string; userEmail: string };
  }>
) {
  const userId = c.get("userId");
  const env = c.env;

  try {
    // Validate we have the Cartesia API key
    if (!env.CARTESIA_API_KEY) {
      console.error("CARTESIA_API_KEY not configured");
      return c.json(
        { error: "Service not configured" },
        503
      );
    }

    // Call Cartesia API to generate an access token
    // See: https://docs.cartesia.ai/get-started/authenticate-your-client-applications
    const cartesiaResponse = await fetch("https://api.cartesia.ai/access-token", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
        "Cartesia-Version": "2025-04-16",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grants: {
          // Grant access to agent voice calls (WebSocket)
          agent: true,
          // Also grant TTS and STT in case needed
          tts: true,
          stt: true,
        },
        // Token expires in 1 hour
        expires_in: 3600,
      }),
    });

    if (!cartesiaResponse.ok) {
      const errorData = await cartesiaResponse.json().catch(() => ({}));
      console.error("Cartesia API error:", {
        status: cartesiaResponse.status,
        statusText: cartesiaResponse.statusText,
        error: errorData,
      });

      return c.json(
        { error: "Failed to generate access token" },
        500
      );
    }

    const tokenData = await cartesiaResponse.json();

    // Log token generation for audit purposes
    console.log("Generated Cartesia access token", {
      userId,
      expiresIn: tokenData.expires_in,
      timestamp: new Date().toISOString(),
    });

    // Return token to client
    return c.json(
      {
        accessToken: tokenData.token,
        expiresIn: tokenData.expires_in || 3600,
        tokenType: "Bearer",
      },
      200
    );
  } catch (error) {
    console.error("Error generating Cartesia access token:", error);

    return c.json(
      { error: "Failed to generate access token" },
      500
    );
  }
}
