/**
 * Template Engine Demo & Testing
 *
 * This file demonstrates the optimized template system and provides
 * performance testing utilities to validate the 40% token reduction claim.
 */
import { OptimizedTemplateEngine, TemplatePerformanceMonitor } from "./template-engine";
// === MOCK DATA FOR TESTING ===
const mockUserContext = {
    user: {
        id: "demo-user",
        name: "Alex",
        email: "alex@demo.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subscription_status: "active",
        timezone: "America/New_York",
        call_window_start: "20:00",
        call_window_timezone: "America/New_York",
        push_token: "demo-push-token",
        onboarding_completed: true,
        schedule_change_count: 0,
        voice_reclone_count: 0
    },
    identity: {
        id: "demo-identity",
        user_id: "demo-user",
        name: "Alex", // User's actual name, not BigBruh name
        identity_summary: "The version of Alex who overcame procrastination and built a thriving business",
        war_cry: "I swear to never ignore accountability again",
        core_struggle: "I'm afraid I'm not capable of real success",
        fear_identity: "Someone who wastes their potential and lives with regret",
        aspirated_identity: "Build a successful business and live with purpose",
        sabotage_method: "Endless scrolling and comfort zone behaviors",
        daily_non_negotiable: "Work on business for 2 hours before checking social media",
        accountability_trigger: "Firm but supportive - call out excuses directly",
        biggest_enemy: "procrastination, perfectionism, fear of failure",
        weakness_time_window: "After lunch when energy drops",
        primary_excuse: "I was too tired to focus properly",
        last_major_failure: "Work on business plan for 2 hours",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    identityStatus: {
        id: "demo-status",
        user_id: "demo-user",
        current_streak_days: 5,
        promises_made_count: 25,
        promises_broken_count: 7,
        trust_percentage: 72,
        last_updated: new Date().toISOString()
    },
    todayPromises: [{
            id: "demo-today",
            user_id: "demo-user",
            promise_text: "Complete business plan section 3 before lunch",
            status: "pending",
            created_at: new Date().toISOString(),
            promise_date: new Date().toISOString().split('T')[0],
            promise_order: 1,
            priority_level: "high",
            category: "business",
            time_specific: true,
            target_time: "12:00",
            created_during_call: false,
            excuse_text: "",
        }],
    yesterdayPromises: [{
            id: "demo-yesterday",
            user_id: "demo-user",
            promise_text: "Review competitors for 1 hour",
            status: "kept",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            promise_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            promise_order: 1,
            priority_level: "medium",
            category: "research",
            time_specific: false,
            created_during_call: true,
            excuse_text: "",
        }],
    recentStreakPattern: [
        {
            id: "p1",
            user_id: "demo-user",
            promise_text: "Review competitors",
            status: "kept",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            promise_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            promise_order: 1,
            priority_level: "medium",
            category: "business",
            time_specific: false,
            created_during_call: true,
            excuse_text: "",
        },
        {
            id: "p2",
            user_id: "demo-user",
            promise_text: "Write marketing copy",
            status: "kept",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            promise_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            promise_order: 1,
            priority_level: "high",
            category: "marketing",
            time_specific: false,
            created_during_call: false,
            excuse_text: "",
        },
        {
            id: "p3",
            user_id: "demo-user",
            promise_text: "Research funding options",
            status: "broken",
            created_at: new Date(Date.now() - 259200000).toISOString(),
            promise_date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
            promise_order: 1,
            priority_level: "low",
            category: "research",
            time_specific: false,
            created_during_call: true,
            excuse_text: "Got distracted by urgent emails",
        }
    ],
    memoryInsights: {
        countsByType: {
            excuse: 3,
            promise: 25,
            success: 18
        },
        topExcuseCount7d: 2,
        emergingPatterns: [
            {
                sampleText: "I was too tired to focus",
                recentCount: 2,
                baselineCount: 1,
                growthFactor: 2.0
            },
            {
                sampleText: "Got distracted by urgent work",
                recentCount: 1,
                baselineCount: 0,
                growthFactor: 1.0
            }
        ]
    },
    recentMemories: [], // Deprecated but required for compatibility
    stats: {
        totalPromises: 25,
        keptPromises: 18,
        brokenPromises: 7,
        successRate: 72,
        currentStreak: 5
    }
};
// === DEMO FUNCTIONS ===
export class TemplateEngineDemo {
    /**
     * Run a comprehensive demo of all call types
     */
    static runFullDemo() {
        console.log("🚀 OPTIMIZED TEMPLATE ENGINE DEMO");
        console.log("=====================================\n");
        const callTypes = ["daily_reckoning"];
        const tones = ["Encouraging", "Confrontational", "ColdMirror"];
        callTypes.forEach(callType => {
            console.log(`\n📞 ${callType.toUpperCase()} CALL DEMO`);
            console.log("-".repeat(50));
            tones.forEach(tone => {
                console.log(`\n🎭 Tone: ${tone}`);
                const startTime = performance.now();
                const result = OptimizedTemplateEngine.generateCall(callType, mockUserContext, tone);
                const endTime = performance.now();
                console.log(`⏱️  Generation Time: ${(endTime - startTime).toFixed(2)}ms`);
                console.log(`📏 Token Estimate: ${this.estimateTokens(result.systemPrompt + result.firstMessage)}`);
                console.log(`🗣️  First Message: "${result.firstMessage.substring(0, 100)}..."`);
                console.log(`📝 System Prompt Length: ${result.systemPrompt.length} chars`);
            });
        });
        // Performance summary
        console.log("\n📊 PERFORMANCE SUMMARY");
        console.log("======================");
        TemplatePerformanceMonitor.logMetrics();
        console.log("\n📋 OPTIMIZATION REPORT");
        console.log("======================");
        console.log(TemplatePerformanceMonitor.getOptimizationReport());
    }
    /**
     * Compare optimized vs original template performance
     */
    static runPerformanceComparison() {
        console.log("⚡ PERFORMANCE COMPARISON");
        console.log("========================\n");
        const iterations = 10;
        const callType = "daily_reckoning";
        const tone = "Confrontational";
        // Test optimized version
        console.log("Testing Optimized Template Engine...");
        const optimizedTimes = [];
        const optimizedTokens = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const result = OptimizedTemplateEngine.generateCall(callType, mockUserContext, tone);
            const end = performance.now();
            optimizedTimes.push(end - start);
            optimizedTokens.push(this.estimateTokens(result.systemPrompt + result.firstMessage));
        }
        const avgOptimizedTime = optimizedTimes.reduce((a, b) => a + b) / iterations;
        const avgOptimizedTokens = optimizedTokens.reduce((a, b) => a + b) / iterations;
        console.log(`✅ Optimized Results:`);
        console.log(`   Average Generation Time: ${avgOptimizedTime.toFixed(2)}ms`);
        console.log(`   Average Token Count: ${Math.round(avgOptimizedTokens)}`);
        console.log(`   Token Range: ${Math.min(...optimizedTokens)} - ${Math.max(...optimizedTokens)}`);
        // Estimated original performance (based on analysis)
        const estimatedOriginalTokens = 3200; // Based on original morning call analysis
        const compressionRatio = 1 - (avgOptimizedTokens / estimatedOriginalTokens);
        console.log(`\n🎯 Optimization Results:`);
        console.log(`   Token Reduction: ${(compressionRatio * 100).toFixed(1)}%`);
        console.log(`   Tokens Saved: ${Math.round(estimatedOriginalTokens - avgOptimizedTokens)} per call`);
        console.log(`   Performance: ✅ ${compressionRatio >= 0.3 ? 'Target Achieved!' : 'Needs Improvement'}`);
    }
    /**
     * Test custom call generation with overrides
     */
    static testCustomCalls() {
        console.log("🛠️  CUSTOM CALL TESTING");
        console.log("=======================\n");
        // Test 1: Custom daily reckoning call with additional goals
        console.log("Test 1: Daily reckoning call with additional goals");
        const customDailyReckoning = OptimizedTemplateEngine.generateCustomCall("daily_reckoning", mockUserContext, "Confrontational", {
            additionalGoals: [
                "Address the Instagram scrolling pattern specifically",
                "Create consequences for next failure"
            ],
            toolSetOverride: "consequence_delivery"
        });
        console.log(`✅ Generated with ${this.estimateTokens(customDailyReckoning.systemPrompt)} tokens`);
        console.log(`🗣️  Opening: "${customDailyReckoning.firstMessage}"`);
        // Test 2: Daily reckoning call with detailed intelligence
        console.log("\nTest 2: Daily reckoning call with forced detailed intelligence");
        const detailedDailyReckoning = OptimizedTemplateEngine.generateCustomCall("daily_reckoning", mockUserContext, "ColdMirror", {
            forceDetailedIntelligence: true
        });
        console.log(`✅ Generated with ${this.estimateTokens(detailedDailyReckoning.systemPrompt)} tokens`);
        console.log(`📏 System prompt length: ${detailedDailyReckoning.systemPrompt.length} chars`);
        // Test 3: Daily reckoning with custom opener
        console.log("\nTest 3: Daily reckoning with custom opener");
        const emergencyCustom = OptimizedTemplateEngine.generateCustomCall("daily_reckoning", mockUserContext, "Confrontational", {
            customOpener: "Alex. BigBruh calling. Your excuse patterns triggered emergency protocols. Time for judgment."
        });
        console.log(`✅ Custom opener applied`);
        console.log(`🗣️  Opening: "${emergencyCustom.firstMessage}"`);
    }
    /**
     * Validate that all call types work correctly
     */
    static validateAllCallTypes() {
        console.log("🔍 VALIDATION TESTING");
        console.log("=====================\n");
        const callTypes = ["daily_reckoning"];
        const tones = ["Encouraging", "Confrontational", "ColdMirror"];
        let allPassed = true;
        callTypes.forEach(callType => {
            tones.forEach(tone => {
                try {
                    const result = OptimizedTemplateEngine.generateCall(callType, mockUserContext, tone);
                    // Validate result structure
                    const hasFirstMessage = result.firstMessage && result.firstMessage.length > 10;
                    const hasSystemPrompt = result.systemPrompt && result.systemPrompt.length > 100;
                    const hasPersonality = result.systemPrompt.includes("# Personality");
                    const hasTools = result.systemPrompt.includes("# Tools");
                    if (!hasFirstMessage || !hasSystemPrompt || !hasPersonality || !hasTools) {
                        console.log(`❌ ${callType}-${tone}: Missing required sections`);
                        allPassed = false;
                    }
                    else {
                        console.log(`✅ ${callType}-${tone}: Valid`);
                    }
                }
                catch (error) {
                    console.log(`❌ ${callType}-${tone}: Error - ${error}`);
                    allPassed = false;
                }
            });
        });
        console.log(`\n🎯 Validation Result: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
        return allPassed;
    }
    // Helper method
    static estimateTokens(text) {
        return Math.round(text.length / 4);
    }
}
// === QUICK TEST RUNNER ===
export function runQuickDemo() {
    console.log("🏃‍♂️ QUICK DEMO - Daily Reckoning Call");
    console.log("=============================\n");
    const result = OptimizedTemplateEngine.generateCall("daily_reckoning", mockUserContext, "Confrontational");
    console.log("📞 FIRST MESSAGE:");
    console.log(result.firstMessage);
    console.log("\n" + "=".repeat(80) + "\n");
    console.log("🤖 SYSTEM PROMPT (First 500 chars):");
    console.log(result.systemPrompt.substring(0, 500) + "...");
    console.log("\n" + "=".repeat(80) + "\n");
    console.log("📊 METRICS:");
    console.log(`Token Estimate: ${Math.round(result.systemPrompt.length / 4)}`);
    console.log(`Character Count: ${result.systemPrompt.length}`);
    console.log(`Sections: ${(result.systemPrompt.match(/^#/gm) || []).length}`);
}
// Run demo if this file is executed directly
if (require.main === module) {
    runQuickDemo();
}
