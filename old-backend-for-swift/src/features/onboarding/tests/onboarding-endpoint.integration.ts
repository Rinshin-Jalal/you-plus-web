/**
 * 🧪 ONBOARDING ENDPOINT TESTER
 *
 * Test the POST /onboarding/v3/complete endpoint with type-safe mock data
 *
 * 🚀 QUICK START:
 * 1. Get auth token (see QUICK_START.md for 4 methods)
 *    - Easiest: Run `npx tsx src/features/onboarding/tests/get-auth-token.ts`
 * 2. Paste token in CONFIG below
 * 3. Make sure backend is running: `npm run dev` in /be folder
 * 4. Run: npx tsx src/features/onboarding/tests/onboarding-endpoint.test.ts
 * 5. Check logs for extraction results
 *
 * 📚 DOCUMENTATION:
 * - QUICK_START.md - How to get auth token (4 methods)
 * - README.md - Full test documentation
 *
 * 🧪 TESTS INCLUDED:
 * - ✅ Basic onboarding completion
 * - ✅ Time window extraction (string format from Swift)
 * - ✅ Dual sliders extraction (comma-separated string)
 * - ✅ Voice responses (base64 audio)
 * - ✅ All response types
 * - ⚠️ Edge cases (missing data, invalid formats)
 */

/// <reference types="node" />

// ═══════════════════════════════════════════════════════════════════════════
// 📝 TYPE DEFINITIONS (Type-Safe Test Data)
// ═══════════════════════════════════════════════════════════════════════════

type OnboardingResponseType =
  | "voice"
  | "text"
  | "choice"
  | "dual_sliders"
  | "time_window_picker"
  | "long_press_activate"
  | "explanation"
  | "timezone_selection";

interface OnboardingResponse {
  type: OnboardingResponseType;
  value: string | number | boolean | null;
  timestamp: string;
  voiceUri?: string;
  duration?: number;
  audioFileSize?: number;
  audioFormat?: string;
  db_field?: string[];
}

interface OnboardingState {
  currentStep: number;
  responses: Record<string, OnboardingResponse>;
  totalResponses: number;
  progressPercentage: number;
  startedAt: string;
  lastSavedAt: string;
  isCompleted: boolean;
  completedAt: string;
  userName: string;
  callTime?: string;
  userTimezone: string;
}

interface OnboardingCompleteRequest {
  userId?: string; // Optional - extracted from auth token
  state: OnboardingState;
  voipToken?: string;
  pushToken?: string;
  deviceMetadata?: {
    type: "apns" | "fcm";
    device_model?: string;
    os_version?: string;
    app_version?: string;
    locale?: string;
    timezone?: string;
  };
}

interface OnboardingCompleteResponse {
  success: boolean;
  message?: string;
  completedAt?: string;
  totalSteps?: number;
  filesProcessed?: number;
  processingWarnings?: string | null;
  identityExtraction?: {
    success: boolean;
    fieldsExtracted?: number;
    voiceTranscribed?: number;
    error?: string;
  };
  identityStatusSync?: {
    success: boolean;
    error?: string;
  };
  error?: string;
  details?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  AUTH_TOKEN: "eyJhbGciOiJIUzI1NiIsImtpZCI6IkpacFlrRzRDVDZpNldXNUciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21waWNxbGxwcXR3ZmFmcXBwd2FsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyZDg5MTkxZS01MTYzLTQ2NGItODEzZS01YTczMjAzNGM4MjMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwNTE1NDcxLCJpYXQiOjE3NjA1MTE4NzEsImVtYWlsIjoiaGV5QHJpbnNoLmluIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImhleUByaW5zaC5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjJkODkxOTFlLTUxNjMtNDY0Yi04MTNlLTVhNzMyMDM0YzgyMyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzYwNTExODcxfV0sInNlc3Npb25faWQiOiI4ODczNTA2My1iMDJiLTRiNGItOGUyMy0zM2FhZTQzZTcxYjYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.ASapNf39NTDE6DmXnvJkjxbgpLYC6MEx6FPfAf_OsMI",
  API_URL: "http://localhost:8787",
  USER_ID: "5dad2c4c-52c7-43c2-b6f8-cab2e27c7523",
};

// ═══════════════════════════════════════════════════════════════════════════
// 📦 TEST DATA BUILDERS (Type-Safe)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a mock voice response with base64 audio
 */
function createVoiceResponse(
  stepId: number,
  dbField: string[],
  duration: number = 10
): OnboardingResponse {
  // Create minimal valid base64 audio (actual audio would be much longer)
  const mockAudioBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

  return {
    type: "voice",
    value: `data:audio/m4a;base64,${mockAudioBase64}`,
    timestamp: new Date().toISOString(),
    voiceUri: `/voice-recordings/step-${stepId}.m4a`,
    duration,
    audioFileSize: mockAudioBase64.length,
    audioFormat: "m4a",
    db_field: dbField,
  };
}

/**
 * Create a mock text response
 */
function createTextResponse(
  text: string,
  dbField?: string[]
): OnboardingResponse {
  return {
    type: "text",
    value: text,
    timestamp: new Date().toISOString(),
    db_field: dbField,
  };
}

/**
 * Create a mock choice response
 */
function createChoiceResponse(
  choice: string,
  dbField?: string[]
): OnboardingResponse {
  return {
    type: "choice",
    value: choice,
    timestamp: new Date().toISOString(),
    db_field: dbField,
  };
}

/**
 * Create a mock dual sliders response (Swift format: comma-separated string)
 */
function createDualSlidersResponse(
  slider1: number,
  slider2: number,
  dbField: string[]
): OnboardingResponse {
  return {
    type: "dual_sliders",
    value: `${slider1},${slider2}`, // Swift sends as comma-separated string
    timestamp: new Date().toISOString(),
    db_field: dbField,
  };
}

/**
 * Create a mock time window picker response (Swift format: string "HH:MM-HH:MM")
 */
function createTimeWindowResponse(
  startTime: string,
  endTime: string,
  dbField: string[]
): OnboardingResponse {
  return {
    type: "time_window_picker",
    value: `${startTime}-${endTime}`, // Swift sends as string "20:30-21:00"
    timestamp: new Date().toISOString(),
    db_field: dbField,
  };
}

/**
 * Create a mock long press response
 */
function createLongPressResponse(
  duration: number
): OnboardingResponse {
  return {
    type: "long_press_activate",
    value: "activated",
    timestamp: new Date().toISOString(),
    duration,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 MOCK TEST PAYLOADS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SCENARIO 1: Minimal valid onboarding (just enough to pass)
 */
function createMinimalOnboarding(): OnboardingCompleteRequest {
  const now = new Date().toISOString();

  return {
    state: {
      currentStep: 45,
      responses: {
        "3": createTextResponse("John", ["identity_name"]),
        "37": createTimeWindowResponse("20:30", "21:00", ["evening_call_time"]),
      },
      totalResponses: 2,
      progressPercentage: 100,
      startedAt: now,
      lastSavedAt: now,
      isCompleted: true,
      completedAt: now,
      userName: "John",
      callTime: "20:30",
      userTimezone: "America/New_York",
    },
  };
}

/**
 * SCENARIO 2: Complete onboarding with all response types
 */
function createCompleteOnboarding(): OnboardingCompleteRequest {
  const now = new Date().toISOString();

  return {
    state: {
      currentStep: 45,
      responses: {
        // Step 2: Voice commitment
        "2": createVoiceResponse(2, ["voice_commitment"], 12),

        // Step 3: User name (text)
        "3": createTextResponse("John Doe", ["identity_name"]),

        // Step 5: Biggest lie (voice)
        "5": createVoiceResponse(5, ["biggest_lie"], 8),

        // Step 6: Favorite excuse (choice)
        "6": createChoiceResponse("I don't have time", ["favorite_excuse"]),

        // Step 7: Last failure (voice)
        "7": createVoiceResponse(7, ["last_failure"], 15),

        // Step 9: Weakness window (text)
        "9": createTextResponse("Late night around 11 PM when I'm tired", ["weakness_window"]),

        // Step 10: Procrastination now (voice)
        "10": createVoiceResponse(10, ["procrastination_now"], 10),

        // Step 11: Motivation sliders (dual_sliders)
        "11": createDualSlidersResponse(7, 9, ["motivation_fear_intensity", "motivation_desire_intensity"]),

        // Step 12: Time waster (choice)
        "12": createChoiceResponse("Social media scrolling", ["time_waster"]),

        // Step 14: Fear version (voice)
        "14": createVoiceResponse(14, ["fear_version"], 12),

        // Step 18: Quit counter (text)
        "18": createTextResponse("5", ["quit_counter"]),

        // Step 19: Daily non-negotiable (text)
        "19": createTextResponse("30 minutes of exercise", ["daily_non_negotiable"]),

        // Step 20: Commitment time (text)
        "20": createTextResponse("06:30", ["commitment_time"]),

        // Step 29: Success metric (text)
        "29": createTextResponse("Lose 20lbs by June 1st", ["success_metric"]),

        // Step 30: Transformation date (text)
        "30": createTextResponse("2025-06-01", ["transformation_date"]),

        // Step 33: Streak target (text)
        "33": createTextResponse("100", ["streak_target"]),

        // Step 37: Evening call time (time_window_picker)
        "37": createTimeWindowResponse("20:30", "21:00", ["evening_call_time"]),

        // Step 38: External judge (text)
        "38": createTextResponse("My father", ["external_judge"]),

        // Step 39: Failure threshold (choice)
        "39": createChoiceResponse("3 strikes", ["failure_threshold"]),

        // Step 41: Oath recording (voice)
        "41": createVoiceResponse(41, ["oath_recording"], 10),

        // Step 43: Contract seal (long_press)
        "43": createLongPressResponse(7000),
      },
      totalResponses: 21,
      progressPercentage: 100,
      startedAt: now,
      lastSavedAt: now,
      isCompleted: true,
      completedAt: now,
      userName: "John Doe",
      callTime: "20:30",
      userTimezone: "America/New_York",
    },
    pushToken: "mock-apns-token-12345",
    deviceMetadata: {
      type: "apns",
      device_model: "iPhone 15 Pro",
      os_version: "iOS 17.2",
      app_version: "1.0.0",
      locale: "en_US",
      timezone: "America/New_York",
    },
  };
}

/**
 * SCENARIO 3: Edge case - Missing call time
 */
function createMissingCallTimeOnboarding(): OnboardingCompleteRequest {
  const base = createMinimalOnboarding();
  delete base.state.responses["37"]; // Remove evening call time
  base.state.callTime = undefined;
  return base;
}

/**
 * SCENARIO 4: Edge case - Invalid dual sliders format
 */
function createInvalidSlidersOnboarding(): OnboardingCompleteRequest {
  const base = createCompleteOnboarding();
  // Send invalid slider format
  base.state.responses["11"] = {
    type: "dual_sliders",
    value: "invalid_format", // Should be "7,9"
    timestamp: new Date().toISOString(),
    db_field: ["motivation_fear_intensity", "motivation_desire_intensity"],
  };
  return base;
}

/**
 * SCENARIO 5: Edge case - Voice without base64 prefix
 */
function createInvalidVoiceOnboarding(): OnboardingCompleteRequest {
  const base = createCompleteOnboarding();
  // Send voice without proper base64 prefix
  base.state.responses["2"] = {
    type: "voice",
    value: "just-a-plain-string", // Should start with "data:audio/"
    timestamp: new Date().toISOString(),
    voiceUri: "/voice-recordings/step-2.m4a",
    duration: 10,
    db_field: ["voice_commitment"],
  };
  return base;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runTest(
  testName: string,
  payload: OnboardingCompleteRequest
): Promise<void> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 TEST: ${testName}`);
  console.log(`${"=".repeat(80)}\n`);

  try {
    const response = await fetch(`${CONFIG.API_URL}/onboarding/v3/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data: OnboardingCompleteResponse = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📦 Response Data:`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`\n✅ TEST PASSED: ${testName}`);
      console.log(`   - Total Steps: ${data.totalSteps}`);
      console.log(`   - Files Processed: ${data.filesProcessed}`);
      console.log(`   - Identity Extraction: ${data.identityExtraction?.success ? "SUCCESS" : "FAILED"}`);
      console.log(`   - Fields Extracted: ${data.identityExtraction?.fieldsExtracted || 0}`);
    } else {
      console.log(`\n❌ TEST FAILED: ${testName}`);
      console.log(`   - Error: ${data.error}`);
      console.log(`   - Details: ${data.details}`);
    }
  } catch (error) {
    console.log(`\n💥 TEST ERROR: ${testName}`);
    console.error(error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 MAIN TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║              🧪 ONBOARDING ENDPOINT TEST SUITE                           ║
║                                                                           ║
║  Testing: POST /onboarding/v3/complete                                   ║
║  API URL: ${CONFIG.API_URL.padEnd(58)} ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  // Validate configuration
  if (CONFIG.AUTH_TOKEN === "YOUR_AUTH_TOKEN_HERE") {
    console.error(`
❌ ERROR: Please set your AUTH_TOKEN in the CONFIG section at the top of this file!

To get your auth token:
1. Login to your app or use Supabase dashboard
2. Copy the JWT token from localStorage or API response
3. Set it in CONFIG.AUTH_TOKEN
    `);
    process.exit(1);
  }

  // Run all test scenarios
  // await runTest("1. Minimal Valid Onboarding", createMinimalOnboarding());
  await runTest("2. Complete Onboarding (All Response Types)", createCompleteOnboarding());
  // await runTest("3. Edge Case: Missing Call Time", createMissingCallTimeOnboarding());
  // await runTest("4. Edge Case: Invalid Dual Sliders Format", createInvalidSlidersOnboarding());
  // await runTest("5. Edge Case: Invalid Voice Format", createInvalidVoiceOnboarding());

  console.log(`\n${"=".repeat(80)}`);
  console.log(`🎉 ALL TESTS COMPLETE`);
  console.log(`${"=".repeat(80)}\n`);
}

// Run tests
main().catch(console.error);
