import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";

export const postConversionOnboardingComplete = async (c: Context) => {
  console.log("🎯 === CONVERSION ONBOARDING: Complete Request Received ===");

  const userId = getAuthenticatedUserId(c);
  console.log("👤 Authenticated User ID:", userId);

  const body = await c.req.json();
  console.log("📦 Request body keys:", Object.keys(body));

  const {
    // Core identity
    goal,
    goalDeadline,
    motivationLevel,
    // Pattern recognition
    attemptCount,
    lastAttemptOutcome,
    previousAttemptOutcome,
    favoriteExcuse,
    whoDisappointed,
    biggestObstacle,
    quitTime,
    // Demographics
    age,
    gender,
    location,
    // Stakes
    successVision,
    futureIfNoChange,
    whatSpent,
    biggestFear,
    // Belief
    beliefLevel,
    // Commitment setup
    dailyCommitment,
    callTime,
    callsGranted,
    voiceGranted,
    // Legacy fields
    witness,
    willDoThis,
    notificationsGranted,
    completedAt,
    totalTimeSpent,
    deviceMetadata,
  } = body;

  // Core required fields
  if (!goal || !dailyCommitment || !callTime) {
    return c.json({ error: "Missing required fields: goal, dailyCommitment, callTime" }, 400);
  }

  console.log(`\n📊 === CONVERSION ONBOARDING DATA ===`);
  console.log(`Goal: ${goal}`);
  console.log(`Motivation Level: ${motivationLevel}/10`);
  console.log(`Attempt Count: ${attemptCount}`);
  console.log(`Daily Commitment: ${dailyCommitment}`);

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // Get user's name from auth first
    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    const userName = userData?.name || "User";

    console.log(`\n📦 === BUILDING ONBOARDING CONTEXT ===`);

    const callTimeDate = new Date(callTime);
    const callTimeString = `${String(callTimeDate.getHours()).padStart(2, "0")}:${String(
      callTimeDate.getMinutes()
    ).padStart(2, "0")}:${String(callTimeDate.getSeconds()).padStart(2, "0")}`;

    const onboardingContext = {
      // Core goal info
      goal: goal,
      goal_deadline: goalDeadline || null,
      motivation_level: motivationLevel || 5,
      
      // Pattern recognition
      attempt_count: attemptCount || 0,
      attempt_history: attemptCount 
        ? `Failed ${attemptCount} times. Last: ${lastAttemptOutcome || 'unknown'}. Previous: ${previousAttemptOutcome || 'unknown'}.`
        : null,
      how_did_quit: lastAttemptOutcome || null,
      favorite_excuse: favoriteExcuse || null,
      quit_time: quitTime || null,
      quit_pattern: quitTime || null,
      biggest_obstacle: biggestObstacle || null,
      who_disappointed: whoDisappointed || null,
      
      // Demographics
      age: age || null,
      gender: gender || null,
      location: location || null,
      
      // Stakes
      success_vision: successVision || null,
      future_if_no_change: futureIfNoChange || null,
      what_spent: whatSpent || null,
      biggest_fear: biggestFear || null,
      
      // Belief tracking
      belief_level: beliefLevel || 5,
      
      // Witness/accountability
      witness: witness || null,
      will_do_this: willDoThis ?? true,
      
      // Permissions
      permissions: {
        notifications: notificationsGranted || false,
        calls: callsGranted || false,
        voice: voiceGranted || false,
      },
      
      // Metadata
      completed_at: completedAt || new Date().toISOString(),
      time_spent_minutes: totalTimeSpent ? Math.round(totalTimeSpent / 60) : null,
    };

    console.log(`✅ Onboarding context built with ${Object.keys(onboardingContext).length} fields`);

    console.log(`\n💾 === SAVING TO IDENTITY TABLE ===`);

    const { error: insertError } = await supabase
      .from("identity")
      .insert({
        user_id: userId,
        name: userName,
        daily_commitment: dailyCommitment,
        call_time: callTimeString,
        supermemory_container_id: userId,
        onboarding_context: onboardingContext,
      });

    if (insertError) {
      console.error("❌ Identity insert failed:", insertError);
      throw insertError;
    }

    console.log(`✅ Identity created (trigger auto-creates status)`);

    console.log(`\n👤 === UPDATING USER RECORD ===`);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        timezone: deviceMetadata?.timezone || "UTC",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ User update failed:", updateError);
      throw updateError;
    }

    console.log(`✅ User marked as onboarding complete`);

    console.log(`\n🎉 === CONVERSION ONBOARDING COMPLETE ===`);
    console.log(`✅ Identity created with core fields`);
    console.log(`✅ Status auto-created by trigger`);

    return c.json({
      success: true,
      message: "Conversion onboarding completed successfully",
      completedAt: new Date().toISOString(),
      identity: {
        created: true,
        core_fields: ["name", "daily_commitment", "call_time", "supermemory_container_id"],
        context_fields: Object.keys(onboardingContext).length,
      },
      statusCreated: true,
    });
  } catch (error) {
    console.error("💥 Conversion onboarding failed:", error);
    return c.json(
      {
        success: false,
        error: "Failed to complete conversion onboarding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
