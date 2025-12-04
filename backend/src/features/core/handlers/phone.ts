import type { Context } from "hono";
import type { Env } from "@/index";
import { createSupabaseClient } from "@/features/core/utils/database";

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export const updatePhoneNumber = async (c: Context) => {
  const env = c.env as Env;
  const userId = c.get("userId") as string;

  try {
    const body = await c.req.json();
    const { phone_number } = body;

    // Validate phone number is provided
    if (!phone_number) {
      return c.json(
        { success: false, error: "Phone number is required" },
        400
      );
    }

    // Validate E.164 format
    if (!E164_REGEX.test(phone_number)) {
      return c.json(
        {
          success: false,
          error: "Invalid phone number format. Must be E.164 format (e.g., +14155551234)",
        },
        400
      );
    }

    const supabase = createSupabaseClient(env);

    // Update user's phone number
    const { error: updateError } = await supabase
      .from("users")
      .update({
        phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating phone number:", updateError);
      return c.json(
        { success: false, error: "Failed to update phone number" },
        500
      );
    }

    console.log(`✅ Phone number updated for user ${userId}: ${phone_number}`);

    return c.json({
      success: true,
      message: "Phone number updated successfully",
    });
  } catch (error) {
    console.error("💥 Error in updatePhoneNumber:", error);
    return c.json(
      { success: false, error: "Internal server error" },
      500
    );
  }
};

export const getPhoneNumber = async (c: Context) => {
  const env = c.env as Env;
  const userId = c.get("userId") as string;

  try {
    const supabase = createSupabaseClient(env);

    const { data, error } = await supabase
      .from("users")
      .select("phone_number")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching phone number:", error);
      return c.json(
        { success: false, error: "Failed to fetch phone number" },
        500
      );
    }

    return c.json({
      success: true,
      phone_number: data?.phone_number || null,
    });
  } catch (error) {
    console.error("💥 Error in getPhoneNumber:", error);
    return c.json(
      { success: false, error: "Internal server error" },
      500
    );
  }
};
