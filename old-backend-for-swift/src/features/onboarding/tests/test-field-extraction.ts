/**
 * 🔍 TEST: Field Extraction for transformation_date and daily_non_negotiable
 *
 * This test specifically checks if these two fields are being extracted and saved.
 *
 * Run: npx tsx src/features/onboarding/tests/test-field-extraction.ts
 */

/// <reference types="node" />

// Copy your auth token here
const CONFIG = {
  AUTH_TOKEN: "eyJhbGciOiJIUzI1NiIsImtpZCI6IkpacFlrRzRDVDZpNldXNUciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21waWNxbGxwcXR3ZmFmcXBwd2FsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyZDg5MTkxZS01MTYzLTQ2NGItODEzZS01YTczMjAzNGM4MjMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwNTIyNjYzLCJpYXQiOjE3NjA1MTkwNjMsImVtYWlsIjoiaGV5QHJpbnNoLmluIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImhleUByaW5zaC5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjJkODkxOTFlLTUxNjMtNDY0Yi04MTNlLTVhNzMyMDM0YzgyMyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzYwNTE5MDYzfV0sInNlc3Npb25faWQiOiI3NTdlMmRlYy0yOTk2LTQ4NmItODBhMy0yNDY1MWNiOWFhMGEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.athpQiXW5hqmgJgrzff7_1Odm8FGLjYkdJT99u9qbLs",
  API_URL: "http://localhost:8787",
};

async function testFieldExtraction() {
  console.log("\n🔍 Testing transformation_date and daily_non_negotiable extraction\n");

  const now = new Date().toISOString();

  const payload = {
    state: {
      currentStep: 45,
      responses: {
        // Step 3: Name
        "3": {
          type: "text",
          value: "Test User",
          timestamp: now,
          db_field: ["identity_name"]
        },
        // Step 19: Daily non-negotiable (THIS IS THE KEY ONE)
        "19": {
          type: "text",
          value: "Exercise 30 minutes daily",
          timestamp: now,
          db_field: ["daily_non_negotiable"]
        },
        // Step 30: Transformation date (THIS IS THE KEY ONE)
        "30": {
          type: "text",
          value: "2025-12-31",
          timestamp: now,
          db_field: ["transformation_date"]
        },
        // Step 37: Call time
        "37": {
          type: "time_window_picker",
          value: "20:30-21:00",
          timestamp: now,
          db_field: ["evening_call_time"]
        },
      },
      totalResponses: 4,
      progressPercentage: 100,
      startedAt: now,
      lastSavedAt: now,
      isCompleted: true,
      completedAt: now,
      userName: "Test User",
      callTime: "20:30",
      userTimezone: "America/New_York",
    },
  };

  console.log("📤 Sending payload with:");
  console.log("  Step 19: daily_non_negotiable = 'Exercise 30 minutes daily'");
  console.log("  Step 30: transformation_date = '2025-12-31'");
  console.log();

  try {
    const response = await fetch(`${CONFIG.API_URL}/onboarding/v3/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📦 Response Data:`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`\n✅ SUCCESS!`);
      console.log(`\n📝 NOW CHECK BACKEND LOGS FOR:`);
      console.log(`   ✅ Extracted daily_non_negotiable: "Exercise 30 minutes daily"`);
      console.log(`   ✅ Extracted transformation_target_date: "2025-12-31"`);
      console.log(`\n📝 THEN CHECK DATABASE:`);
      console.log(`   SELECT daily_non_negotiable, transformation_target_date FROM identity WHERE user_id = 'your-user-id';`);
    } else {
      console.log(`\n❌ FAILED:`);
      console.log(`   Error: ${data.error}`);
    }

  } catch (error) {
    console.error(`\n💥 ERROR:`, error);
  }
}

// Run test
if (CONFIG.AUTH_TOKEN === "YOUR_AUTH_TOKEN_HERE") {
  console.error("\n❌ Please set your AUTH_TOKEN in the CONFIG section!\n");
  process.exit(1);
}

testFieldExtraction().catch(console.error);
