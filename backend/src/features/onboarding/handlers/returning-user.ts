import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface UserHistory {
  name: string;
  coreIdentity: string | null;
  primaryPillar: string | null;
  theWhy: string | null;
  pillars: Array<{
    pillar: string;
    identityStatement: string;
    nonNegotiable: string;
  }>;
  callTime: string | null;
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
    // Fetch user's previous data from new tables
    const { data: user } = await supabase
      .from("users")
      .select("name, email, call_time, created_at, updated_at")
      .eq("id", userId)
      .single();

    // Fetch future_self (replaces identity)
    const { data: futureSelf } = await supabase
      .from("future_self")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Fetch pillars
    const { data: pillars } = await supabase
      .from("future_self_pillars")
      .select("pillar, identity_statement, non_negotiable")
      .eq("user_id", userId);

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, cancelled_at, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get last call date as proxy for "last active"
    const { data: lastCall } = await supabase
      .from("call_analytics")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Build history object from new 5 Pillars system
    const history: UserHistory = {
      name: user?.name || "there",
      coreIdentity: futureSelf?.core_identity || null,
      primaryPillar: futureSelf?.primary_pillar || null,
      theWhy: futureSelf?.the_why || null,
      pillars: (pillars || []).map(p => ({
        pillar: p.pillar,
        identityStatement: p.identity_statement,
        nonNegotiable: p.non_negotiable,
      })),
      callTime: user?.call_time || null,
      lastActiveAt: lastCall?.created_at || user?.updated_at || null,
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
        coreIdentity: history.coreIdentity,
        primaryPillar: history.primaryPillar,
        pillarsCount: history.pillars.length,
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
  const pillarSummary = history.pillars.map(p => 
    `- ${p.pillar}: "${p.identityStatement}" (daily: ${p.nonNegotiable})`
  ).join('\n');

  return `You are helping a user return to an accountability app after they stopped using it.
This app uses a "Future Self" system with 5 life pillars: Body, Mission, Stack, Tribe, and Why.

USER HISTORY:
- Name: ${history.name}
- Core Identity: ${history.coreIdentity || "Not set"}
- Primary Pillar: ${history.primaryPillar || "Not set"}
- The Why: ${history.theWhy || "Not set"}
- Pillars:
${pillarSummary || "  No pillars defined"}
- Previous Call Time: ${history.callTime || "Not set"}
- Last Active: ${history.lastActiveAt || "Unknown"}

Generate a SHORT, PERSONAL welcome-back experience. Be warm but direct. Acknowledge they're trying again.
Reference their identity statements and primary pillar if available.

Respond in this exact JSON format:
{
  "welcomeMessage": "A short 1-2 sentence welcome back message that acknowledges their identity and that they're ready to reconnect with their future self",
  "summaryOfPast": "A brief 1 sentence summary of their identity/pillars from before",
  "questions": [
    {
      "id": "identity_check",
      "question": "A personalized question asking if their core identity is still accurate or if they want to update it",
      "type": "choice",
      "options": ["Yes, that's still me", "I want to update my identity"]
    },
    {
      "id": "primary_pillar",
      "question": "A question about which pillar they want to focus on first",
      "type": "choice",
      "options": ["💪 Body", "🎯 Mission", "💰 Stack", "👥 Tribe"]
    },
    {
      "id": "callTime",
      "question": "A question about when they want their accountability call",
      "type": "time",
      "default": "${history.callTime || "21:00"}"
    }
  ],
  "encouragement": "A short encouraging closing message about reconnecting with their future self"
}

Keep it SHORT. 3 questions max. Be human, not corporate.`;
}

function getDefaultQuestions(history: UserHistory) {
  return [
    {
      id: "identity_check",
      question: history.coreIdentity 
        ? `You defined yourself as: "${history.coreIdentity}". Is this still who you're becoming?`
        : "Let's define who your future self is. Who are you becoming?",
      type: history.coreIdentity ? "choice" : "text",
      options: history.coreIdentity ? ["Yes, that's still me", "I want to update my identity"] : undefined,
      placeholder: history.coreIdentity ? undefined : "I am a person who...",
    },
    {
      id: "primary_pillar",
      question: "Which pillar do you want to focus on first?",
      type: "choice",
      options: ["💪 Body", "🎯 Mission", "💰 Stack", "👥 Tribe"],
      default: history.primaryPillar,
    },
    {
      id: "callTime",
      question: "When should your future self call you?",
      type: "time",
      default: history.callTime || "21:00",
    },
  ];
}

function getDefaultContent(history: UserHistory) {
  const primaryPillarEmoji = {
    body: "💪",
    mission: "🎯", 
    stack: "💰",
    tribe: "👥",
  }[history.primaryPillar || "body"] || "🎯";

  return {
    welcomeMessage: `Welcome back${history.name !== "there" ? `, ${history.name}` : ""}! Your future self has been waiting.`,
    summaryOfPast: history.coreIdentity 
      ? `You were becoming: "${history.coreIdentity}"`
      : null,
    questions: getDefaultQuestions(history),
    encouragement: `${primaryPillarEmoji} Let's reconnect with who you're becoming. Your future self is ready.`,
  };
}
