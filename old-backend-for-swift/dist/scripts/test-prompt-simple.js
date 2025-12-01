import { PromptService } from "../services/prompt-engine";
// Mock Data
const mockContext = {
    user: {
        id: "user-123",
        name: "Rinshin",
        email: "test@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarding_completed: true,
        call_window_start: "08:00:00",
        call_window_timezone: "UTC",
        subscription_status: "active",
        timezone: "UTC",
    },
    identity: {
        id: "identity-123",
        user_id: "user-123",
        name: "Rinshin",
        daily_commitment: "Code for 10 hours",
        chosen_path: "hopeful",
        call_time: "08:00:00",
        strike_limit: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarding_context: {
            goal: "Build a unicorn",
            motivation_level: 9,
            favorite_excuse: "I'm too tired",
            future_if_no_change: "Regret forever",
            permissions: { notifications: true, calls: true },
            completed_at: new Date().toISOString(),
            time_spent_minutes: 10,
        }
    },
    identityStatus: {
        id: "status-123",
        user_id: "user-123",
        current_streak_days: 5,
        total_calls_completed: 10,
        last_call_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    memoryInsights: {
        countsByType: { excuse: 2 },
        topExcuseCount7d: 2,
        emergingPatterns: [],
    },
    recentStreakPattern: [
        { status: "kept", promise_text: "Code 10 hours", created_at: "", id: "1", user_id: "1", promise_date: "", promise_order: 1, priority_level: "medium", category: "general", time_specific: false, created_during_call: false },
        { status: "kept", promise_text: "Code 10 hours", created_at: "", id: "2", user_id: "1", promise_date: "", promise_order: 1, priority_level: "medium", category: "general", time_specific: false, created_during_call: false },
        { status: "broken", promise_text: "Code 10 hours", created_at: "", id: "3", user_id: "1", promise_date: "", promise_order: 1, priority_level: "medium", category: "general", time_specific: false, created_during_call: false },
    ],
    todayPromises: [],
    yesterdayPromises: [],
    stats: {
        totalPromises: 10,
        keptPromises: 8,
        brokenPromises: 2,
        successRate: 80,
        currentStreak: 5
    }
};
async function runTest() {
    console.log("🧪 Testing Prompt Engine Simplification...\n");
    const tones = ["Encouraging", "Confrontational", "ColdMirror"];
    for (const tone of tones) {
        console.log(`\n--- Testing Tone: ${tone} ---`);
        const result = PromptService.generatePrompt(mockContext, tone);
        console.log(`[Opener]: ${result.firstMessage}`);
        if (result.systemPrompt.includes("Build a unicorn")) {
            console.log("✅ Intelligence Injected (Goal)");
        }
        else {
            console.error("❌ Missing Goal Intelligence");
        }
        if (result.systemPrompt.includes("I'm too tired")) {
            console.log("✅ Intelligence Injected (Excuse)");
        }
        else {
            console.error("❌ Missing Excuse Intelligence");
        }
        if (result.systemPrompt.includes("Future You")) {
            console.log("✅ Persona Correct");
        }
        else {
            console.error("❌ Missing Persona");
        }
    }
    console.log("\n✅ Verification Complete!");
}
runTest().catch(console.error);
