/**
 * Supermemory Integration Service
 * ================================
 * 
 * Handles all memory operations with Supermemory:
 * - Store onboarding profiles
 * - Store call transcripts (future)
 * - Fetch user profiles (future, mainly used by Python agent)
 * 
 * The agent uses the profile via Python client.
 * This TypeScript service is for storing memories from the backend.
 */

import { Env } from "@/types/environment";

const SUPERMEMORY_BASE_URL = "https://api.supermemory.ai/v3";

interface AddMemoryResult {
  success: boolean;
  memoryId?: string;
  error?: string;
}

interface OnboardingData {
  goal?: string;
  goalDeadline?: string;
  motivationLevel?: number;
  attemptCount?: number;
  lastAttemptOutcome?: string;
  previousAttemptOutcome?: string;
  favoriteExcuse?: string;
  whoDisappointed?: string;
  biggestObstacle?: string;
  quitTime?: string;
  age?: number;
  gender?: string;
  location?: string;
  successVision?: string;
  futureIfNoChange?: string;
  whatSpent?: string;
  biggestFear?: string;
  beliefLevel?: number;
  dailyCommitment?: string;
  witness?: string;
}

/**
 * Add a memory to Supermemory
 */
export async function addMemory(
  env: Env,
  containerTag: string,
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<AddMemoryResult> {
  const apiKey = env.SUPERMEMORY_API_KEY;
  
  if (!apiKey) {
    console.log("⚠️ SUPERMEMORY_API_KEY not configured, skipping memory storage");
    return { success: false, error: "API key not configured" };
  }

  try {
    const response = await fetch(`${SUPERMEMORY_BASE_URL}/memories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        containerTags: [containerTag],
        metadata,
      }),
    });

    if (response.ok) {
      const data = await response.json() as { id?: string };
      console.log(`✅ Memory added to Supermemory for ${containerTag}`);
      return { success: true, memoryId: data.id };
    } else {
      const errorText = await response.text();
      console.error(`❌ Supermemory error: ${response.status} - ${errorText}`);
      return { success: false, error: `${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error(`❌ Supermemory request failed:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Format onboarding data as a rich text document for Supermemory
 */
export function formatOnboardingProfile(data: OnboardingData): string {
  const now = new Date().toISOString();
  
  return `
USER ONBOARDING PROFILE
=======================
Created: ${now}

GOAL & MOTIVATION
-----------------
Goal: ${data.goal || "Not specified"}
Deadline: ${data.goalDeadline || "No deadline"}
Motivation Level: ${data.motivationLevel || 5}/10
Belief Level: ${data.beliefLevel || 5}/10
Daily Commitment: ${data.dailyCommitment || "Not specified"}

FAILURE PATTERNS (CRITICAL - USE FOR CALLOUTS)
----------------------------------------------
Times Tried Before: ${data.attemptCount || 0}
How They Usually Quit: ${data.lastAttemptOutcome || "Unknown"}
Previous Attempt: ${data.previousAttemptOutcome || "Unknown"}
When They Usually Quit: ${data.quitTime || "Unknown"}
Favorite Excuse: "${data.favoriteExcuse || "Not shared"}"
Biggest Obstacle: ${data.biggestObstacle || "Not shared"}

EMOTIONAL TRIGGERS (USE STRATEGICALLY)
--------------------------------------
Who They've Disappointed: ${data.whoDisappointed || "Not shared"}
Biggest Fear: ${data.biggestFear || "Not shared"}
What They've Already Wasted: ${data.whatSpent || "Not shared"}
Vision of Success: "${data.successVision || "Not shared"}"
Future If Nothing Changes: "${data.futureIfNoChange || "Not shared"}"
Who's Watching/Witness: ${data.witness || "No one"}

DEMOGRAPHICS
------------
Age: ${data.age || "Unknown"}
Gender: ${data.gender || "Unknown"}
Location: ${data.location || "Unknown"}

---
This profile was created during onboarding. It represents the user's
starting point and should evolve as they progress through their journey.
The agent should use this information strategically - not all at once,
but when it's most impactful.
`.trim();
}

/**
 * Store user's onboarding profile in Supermemory
 * 
 * Called when onboarding completes. Supermemory will:
 * 1. Parse this into semantic memories
 * 2. Build a User Profile automatically
 * 3. Make it searchable and retrievable
 */
export async function addOnboardingProfile(
  env: Env,
  userId: string,
  data: OnboardingData
): Promise<AddMemoryResult> {
  const content = formatOnboardingProfile(data);
  
  return addMemory(env, userId, content, {
    type: "onboarding_profile",
    source: "web_onboarding",
    version: "1.0",
    created_at: new Date().toISOString(),
  });
}

/**
 * Store a voice recording transcript in Supermemory
 * 
 * The actual audio is stored in voice_samples table.
 * This stores the TEXT content for Supermemory to learn from.
 */
export async function addVoiceTranscript(
  env: Env,
  userId: string,
  recordingType: string,
  transcript: string
): Promise<AddMemoryResult> {
  const content = `
VOICE RECORDING - ${recordingType.toUpperCase().replace(/_/g, " ")}
${"=".repeat(60)}

User's own words (transcribed from voice):

"${transcript}"

---
This is what the user said when asked about ${recordingType.replace(/_/g, " ")}.
These are their authentic words and emotional expression.
`.trim();

  return addMemory(env, userId, content, {
    type: "voice_transcript",
    recording_type: recordingType,
    source: "onboarding_voice",
    timestamp: new Date().toISOString(),
  });
}
