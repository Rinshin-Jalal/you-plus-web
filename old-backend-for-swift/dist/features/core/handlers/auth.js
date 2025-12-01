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
export const postGuestToken = async (c) => {
    // Simple UUID generation for guest token
    const token = crypto.randomUUID();
    return c.json({
        success: true,
        token: token,
        expiresIn: 3600, // 1 hour
        type: "guest"
    });
};
