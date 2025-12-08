import { Context } from "hono";

export const postGuestToken = async (c: Context) => {
    const token = crypto.randomUUID();

    return c.json({
        success: true,
        token: token,
        expiresIn: 3600, // 1 hour
        type: "guest"
    });
};
