import { Context } from "hono";
import { Env } from "@/index";
import { extractAndSaveV3Identity } from "@/features/identity/services/v3-identity-mapper";
import { createSupabaseClient } from "@/features/core/utils/database";

/**
 * 🧪 Test Identity Extraction with Mock Data
 * 
 * POST /debug/identity-test
 * Body: { userId: string, mockLevel?: "basic" | "full" }
 */
export async function postTestIdentityExtraction(c: Context) {
  const env = c.env as Env;
  const { userId, mockLevel = "basic" } = await c.req.json();

  if (!userId) {
    return c.json({ error: "userId required" }, 400);
  }

  try {
    console.log(`🧪 Testing identity extraction for user ${userId} with mock level: ${mockLevel}`);

    // 📊 Create mock onboarding responses
    const mockResponses = createMockOnboardingResponses(mockLevel);

    // 💾 Save mock responses to onboarding table
    const supabase = createSupabaseClient(env);
    const { error: upsertError } = await supabase
      .from("onboarding")
      .upsert({
        user_id: userId,
        responses: mockResponses,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      throw upsertError;
    }

    console.log(`✅ Mock onboarding data saved for user ${userId}`);

    // 💾 Test V3 identity extraction and saving
    console.log(`💾 Testing V3 identity extraction and saving...`);
    const extractionResult = await extractAndSaveV3Identity(
      userId,
      "TestUser",
      mockResponses,
      env
    );

    return c.json({
      success: true,
      mockLevel,
      extractionResult,
      mockResponsesCount: Object.keys(mockResponses).length
    });

  } catch (error) {
    console.error("🚨 Identity extraction test failed:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}

/**
 * 🎭 Create Mock Onboarding Responses
 * 
 * Creates realistic onboarding data for testing without going through UI.
 */
function createMockOnboardingResponses(level: "basic" | "full"): Record<string, any> {
  const mockResponses: Record<string, any> = {};

  // 📝 Basic operational fields (always included)
  mockResponses["step_3"] = {
    type: "text",
    db_field: "identity_name",
    value: "TestUser",
    timestamp: new Date().toISOString()
  };

  mockResponses["step_19"] = {
    type: "choice",
    db_field: "daily_non_negotiable",
    value: "Exercise for 30 minutes",
    timestamp: new Date().toISOString()
  };

  mockResponses["step_37"] = {
    type: "time_window_picker", 
    db_field: "evening_call_time",
    value: "19:00:00",
    timestamp: new Date().toISOString()
  };

  mockResponses["step_30"] = {
    type: "text",
    db_field: "transformation_date",
    value: "2024-12-31",
    timestamp: new Date().toISOString()
  };

  if (level === "full") {
    // 🎤 Voice responses (psychological content)
    const voiceResponses = [
      {
        step: "step_2",
        db_field: "voice_commitment",
        content: "I'm here because I'm tired of being weak and making excuses. I want to become someone who actually follows through on their promises."
      },
      {
        step: "step_5", 
        db_field: "biggest_lie",
        content: "I tell myself I'll start tomorrow, or that I don't have enough time, but really I'm just scared of failing again."
      },
      {
        step: "step_7",
        db_field: "last_failure", 
        content: "Last month I promised myself I'd wake up at 6 AM every day and lasted exactly 3 days before giving up."
      },
      {
        step: "step_10",
        db_field: "procrastination_now",
        content: "Right now I'm avoiding calling my therapist back and starting that work project that's been sitting on my desk for two weeks."
      },
      {
        step: "step_14",
        db_field: "fear_version",
        content: "I'm terrified of becoming someone who talks big but never delivers, who disappoints everyone including myself, just a lazy person who gave up on their dreams."
      },
      {
        step: "step_27",
        db_field: "identity_goal",
        content: "I want to become someone who is reliable, who keeps their word, who other people can count on and who I can be proud of when I look in mirror."
      },
      {
        step: "step_35",
        db_field: "war_cry",
        content: "I am stronger than my excuses and I will not let temporary discomfort defeat my permanent goals!"
      }
    ];

    voiceResponses.forEach(({ step, db_field, content }) => {
      mockResponses[step] = {
        type: "voice",
        db_field,
        value: content, // Pre-transcribed text instead of URL
        timestamp: new Date().toISOString()
      };
    });

    // 📊 Choice responses
    const choiceResponses = [
      { step: "step_6", db_field: "favorite_excuse", value: "I don't have time" },
      { step: "step_12", db_field: "time_waster", value: "Social media scrolling" },
      { step: "step_15", db_field: "disappointment_check", value: "Myself" },
      { step: "step_24", db_field: "accountability_style", value: "Direct confrontation" }
    ];

    choiceResponses.forEach(({ step, db_field, value }) => {
      mockResponses[step] = {
        type: "choice", 
        db_field,
        value,
        timestamp: new Date().toISOString()
      };
    });
  }

  return mockResponses;
}

/**
 * 🗑️ Clear Test Data
 * 
 * DELETE /debug/identity-test/:userId
 */
export async function deleteTestIdentityData(c: Context) {
  const env = c.env as Env;
  const userId = c.req.param("userId");

  if (!userId) {
    return c.json({ error: "userId required" }, 400);
  }

  try {
    const supabase = createSupabaseClient(env);

    // Delete from both tables
    await Promise.all([
      supabase.from("onboarding").delete().eq("user_id", userId),
      supabase.from("identity").delete().eq("user_id", userId)
    ]);

    return c.json({
      success: true,
      message: `Test data cleared for user ${userId}`
    });

  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}