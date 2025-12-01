import { Context } from "hono";
/**
 * Issue a new guest token for onboarding
 *
 * ENDPOINT: POST /auth/guest
 *
 * RESPONSE:
 * {
 *   "token": "uuid-v4-token",
 *   "expiresIn": 3600
 * }
 */
export declare const postGuestToken: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    success: true;
    token: `${string}-${string}-${string}-${string}-${string}`;
    expiresIn: number;
    type: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
