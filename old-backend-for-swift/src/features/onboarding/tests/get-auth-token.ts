/**
 * 🔑 GET SUPABASE AUTH TOKEN - Helper Script
 *
 * This script helps you get a valid Supabase auth token for testing
 *
 * USAGE:
 * 1. Fill in your credentials below
 * 2. Run: npx tsx src/features/onboarding/tests/get-auth-token.ts
 * 3. Copy the token to onboarding-endpoint.test.ts
 */

/// <reference types="node" />

import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION - FILL THESE IN
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // 🔗 Your Supabase project URL (from Supabase dashboard)
  SUPABASE_URL: "https://mpicqllpqtwfafqppwal.supabase.co",

  // 🔑 Your Supabase anon key (from Supabase dashboard → Settings → API)
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1waWNxbGxwcXR3ZmFmcXBwd2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE3MjAsImV4cCI6MjA2NTkwNzcyMH0._fDXGCSWd3c9_pylJnhux_Jh0sp3vD8aJUApYxs1_sI",

  // 📧 Test user credentials
  // Option 1: Use existing user
  TEST_EMAIL: "hey@rinsh.in",
  TEST_PASSWORD: "TestPassword123!",

  // Option 2: Create new test user (set to true)
  CREATE_NEW_USER: false ,
  NEW_USER_EMAIL: "hey@rinsh.in",
  NEW_USER_PASSWORD: "TestPassword123!",
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function getAuthToken() {
  console.log("\n🔐 SUPABASE AUTH TOKEN GETTER\n");

  // Create Supabase client
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

  try {
    // Option 1: Create new user
    if (CONFIG.CREATE_NEW_USER) {
      console.log("📝 Creating new test user...");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: CONFIG.NEW_USER_EMAIL,
        password: CONFIG.NEW_USER_PASSWORD,
      });

      if (signUpError) {
        console.error("❌ Error creating user:", signUpError.message);
        console.log("\n💡 Tips:");
        console.log("   - User might already exist - set CREATE_NEW_USER to false");
        console.log("   - Check email confirmation requirements in Supabase dashboard");
        console.log("   - Password must meet minimum requirements\n");
        process.exit(1);
      }

      if (signUpData.session) {
        displayToken(signUpData.session.access_token, signUpData.user?.id || "unknown");
        return;
      } else {
        console.log("⚠️  User created but email confirmation required!");
        console.log("📧 Check your email and confirm, then run this script again with CREATE_NEW_USER = false\n");
        process.exit(0);
      }
    }

    // Option 2: Sign in with existing user
    console.log("🔐 Signing in with existing user...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: CONFIG.TEST_EMAIL,
      password: CONFIG.TEST_PASSWORD,
    });

    if (signInError) {
      console.error("❌ Error signing in:", signInError.message);
      console.log("\n💡 Tips:");
      console.log("   - Check your email/password are correct");
      console.log("   - Make sure the user exists in Supabase (Auth → Users)");
      console.log("   - Check if email confirmation is required");
      console.log("   - Try creating a new user by setting CREATE_NEW_USER to true\n");
      process.exit(1);
    }

    if (signInData.session) {
      displayToken(signInData.session.access_token, signInData.user.id);
    } else {
      console.error("❌ No session returned from sign in\n");
      process.exit(1);
    }

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  }
}

function displayToken(token: string, userId: string) {
  console.log("\n✅ SUCCESS! Here's your auth token:\n");
  console.log("═".repeat(80));
  console.log("\n🔑 ACCESS TOKEN:");
  console.log(token);
  console.log("\n👤 USER ID:");
  console.log(userId);
  console.log("\n" + "═".repeat(80));

  console.log("\n📋 NEXT STEPS:\n");
  console.log("1. Copy the ACCESS TOKEN above");
  console.log("2. Open: be/src/features/onboarding/tests/onboarding-endpoint.test.ts");
  console.log("3. Find the CONFIG section at the top");
  console.log("4. Paste the token in AUTH_TOKEN:\n");
  console.log("   const CONFIG = {");
  console.log(`     AUTH_TOKEN: "${token.substring(0, 50)}...",`);
  console.log("     API_URL: \"http://localhost:8787\",");
  console.log("   };\n");
  console.log("5. Run the tests:");
  console.log("   npx tsx src/features/onboarding/tests/onboarding-endpoint.test.ts\n");

  // Token info
  try {
    const tokenParts = token?.split('.');
    if (!tokenParts || tokenParts.length < 2 || !tokenParts[1]) throw new Error("Malformed token");
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    const expiresAt = new Date(payload.exp * 1000);
    console.log("⏰ Token expires at:", expiresAt.toLocaleString());
    console.log("   (Valid for ~1 hour from now)\n");
  } catch (e) {
    // Ignore JWT parsing errors
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 ALTERNATIVE METHOD: Get from existing session
// ═══════════════════════════════════════════════════════════════════════════

async function getTokenFromExistingSession() {
  console.log("\n🔍 Checking for existing session...\n");

  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.log("❌ No existing session found:", error.message);
    return null;
  }

  if (session) {
    console.log("✅ Found existing session!");
    displayToken(session.access_token, session.user.id);
    return session.access_token;
  }

  console.log("ℹ️  No existing session");
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 RUN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║              🔑 SUPABASE AUTH TOKEN GETTER                               ║
║                                                                           ║
║  Get a valid JWT token for testing your onboarding endpoint             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  await getAuthToken();
}

main().catch(console.error);
