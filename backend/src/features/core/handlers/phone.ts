import type { Context } from "hono";
import type { Env } from "@/index";
import { createSupabaseClient } from "@/features/core/utils/database";

export const updatePhoneNumber = async (c: Context) => {
  const env = c.env as Env;
  const userId = c.get("userId") as string;

  try {
    const body = c.get("validatedJson") as { phone_number?: string } | undefined;
    const phone_number = body?.phone_number;
    if (!phone_number) return c.json({ success: false, error: "Phone number is required" }, 400);

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
