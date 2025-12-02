import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface UserHistory {
  name: string;
  previousGoal: string | null;
  previousDeadline: string | null;
  dailyCommitment: number | null;
  strikeLimit: number | null;
  callTime: string | null;
  onboardingContext: Record<string, unknown> | null;
  lastActiveAt: string | null;
  subscriptionEndedAt: string | null;
}

/**
 * GET /api/onboarding/returning
 * Fetches user history and generates personalized onboarding for returning users
 */
export const getReturningUserOnboarding = async (c: Context) => {
  console.log("🔄 === RETURNING USER ONBOARDING ===");

  const userId = getAuthenticatedUserId(c);
  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // Fetch user's previous data
    const { data: user } = await supabase
      .from("users")
      .select("name, email, created_at, last_login_at")
      .eq("id", userId)
      .single();

    const { data: identity } = await supabase
      .from("identity")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, cancelled_at, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Build history object
    const history: UserHistory = {
      name: user?.name || identity?.name || "there",
      previousGoal: identity?.onboarding_context?.goal as string || null,
      previousDeadline: identity?.onboarding_context?.goal_deadline as string || null,
      dailyCommitment: identity?.daily_commitment || null,
      strikeLimit: identity?.strike_limit || null,
      callTime: identity?.call_time || null,
      onboardingContext: identity?.onboarding_context || null,
      lastActiveAt: user?.last_login_at || null,
      subscriptionEndedAt: subscription?.cancelled_at || subscription?.current_period_end || null,
    };

    console.log("📊 User history:", JSON.stringify(history, null, 2));

    // Generate personalized message using Gemini
    let personalizedContent = null;
    
    if (env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = buildPrompt(history);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse the JSON response
        try {
          personalizedContent = JSON.parse(text);
        } catch {
          // If not valid JSON, use the text as welcome message
          personalizedContent = {
            welcomeMessage: text,
            questions: getDefaultQuestions(history),
          };
        }
        
        console.log("✅ Gemini generated content");
      } catch (error) {
        console.error("⚠️ Gemini error:", error);
        personalizedContent = getDefaultContent(history);
      }
    } else {
      console.log("⚠️ No GEMINI_API_KEY, using defaults");
      personalizedContent = getDefaultContent(history);
    }

    return c.json({
      success: true,
      isReturningUser: true,
      history: {
        name: history.name,
        previousGoal: history.previousGoal,
        daysSinceActive: history.lastActiveAt 
          ? Math.floor((Date.now() - new Date(history.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      },
      personalized: personalizedContent,
    });
  } catch (error) {
    console.error("❌ Error fetching returning user data:", error);
    return c.json({
      success: false,
      error: "Failed to fetch user history",
    }, 500);
  }
};

function buildPrompt(history: UserHistory): string {
  return `You are helping a user return to an accountability app after they stopped using it.

USER HISTORY:
- Name: ${history.name}
- Previous Goal: ${history.previousGoal || "Not set"}
- Previous Daily Commitment: ${history.dailyCommitment ? `${history.dailyCommitment} minutes` : "Not set"}
- Previous Call Time: ${history.callTime || "Not set"}
- Last Active: ${history.lastActiveAt || "Unknown"}
${history.onboardingContext ? `- Additional Context: ${JSON.stringify(history.onboardingContext)}` : ""}

Generate a SHORT, PERSONAL welcome-back experience. Be warm but direct. Acknowledge they're trying again.

Respond in this exact JSON format:
{
  "welcomeMessage": "A short 1-2 sentence welcome back message that acknowledges their previous goal and that they're ready to try again",
  "summaryOfPast": "A brief 1 sentence summary of what they were working on before",
  "questions": [
    {
      "id": "goal",
      "question": "A personalized question about their goal for this time (reference their previous goal if available)",
      "type": "text",
      "placeholder": "suggested placeholder text"
    },
    {
      "id": "commitment",
      "question": "A question about their daily commitment",
      "type": "slider",
      "min": 15,
      "max": 120,
      "default": ${history.dailyCommitment || 30}
    },
    {
      "id": "callTime",
      "question": "A question about when they want their accountability call",
      "type": "time",
      "default": "${history.callTime || "21:00"}"
    }
  ],
  "encouragement": "A short encouraging closing message"
}

Keep it SHORT. 3 questions max. Be human, not corporate.`;
}

function getDefaultQuestions(history: UserHistory) {
  return [
    {
      id: "goal",
      question: history.previousGoal 
        ? `Last time you were working on "${history.previousGoal}". What's your focus this time?`
        : "What do you want to accomplish this time?",
      type: "text",
      placeholder: "e.g., Get fit, finish my project, build a habit",
    },
    {
      id: "commitment",
      question: "How many minutes per day can you commit?",
      type: "slider",
      min: 15,
      max: 120,
      default: history.dailyCommitment || 30,
    },
    {
      id: "callTime",
      question: "When should we call you for your daily check-in?",
      type: "time",
      default: history.callTime || "21:00",
    },
  ];
}

function getDefaultContent(history: UserHistory) {
  return {
    welcomeMessage: `Welcome back${history.name !== "there" ? `, ${history.name}` : ""}! Ready to get back on track?`,
    summaryOfPast: history.previousGoal 
      ? `You were working on: ${history.previousGoal}`
      : null,
    questions: getDefaultQuestions(history),
    encouragement: "Every restart is a new opportunity. Let's make this one count.",
  };
}
