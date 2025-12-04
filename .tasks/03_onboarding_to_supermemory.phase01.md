# Task 03: Push Onboarding Data to Supermemory

## Objective

When onboarding completes, send the full psychological profile to Supermemory instead of storing it in `identity.onboarding_context`.

## Current Flow

```
Frontend → POST /onboarding/conversion/complete
         → Backend saves to identity.onboarding_context JSONB
         → Done
```

## New Flow

```
Frontend → POST /onboarding/conversion/complete
         → Backend saves minimal data to identity table
         → Backend sends full profile to Supermemory
         → Done
```

## File to Update

`old-backend-for-swift/src/features/onboarding/handlers/conversion-complete.ts`

## Changes Required

### 1. Add Supermemory Client

```typescript
// old-backend-for-swift/src/services/supermemory.ts

const SUPERMEMORY_API_KEY = process.env.SUPERMEMORY_API_KEY;
const SUPERMEMORY_BASE_URL = "https://api.supermemory.ai/v3";

export async function addMemory(
  containerTag: string,
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<boolean> {
  if (!SUPERMEMORY_API_KEY) {
    console.log("⚠️ SUPERMEMORY_API_KEY not set");
    return false;
  }

  try {
    const response = await fetch(`${SUPERMEMORY_BASE_URL}/memories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPERMEMORY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        containerTags: [containerTag],
        metadata,
      }),
    });

    if (response.ok) {
      console.log(`✅ Added memory to Supermemory for ${containerTag}`);
      return true;
    } else {
      console.error(`❌ Supermemory error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Supermemory error:`, error);
    return false;
  }
}

export function formatOnboardingProfile(data: Record<string, unknown>): string {
  return `
USER ONBOARDING PROFILE
=======================

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
`;
}
```

### 2. Update Conversion Handler

```typescript
// In conversion-complete.ts

import { addMemory, formatOnboardingProfile } from "../../services/supermemory";

// ... existing code ...

// REPLACE this:
const onboardingContext = {
  goal: goal,
  goal_deadline: goalDeadline,
  // ... 20+ fields
};

// WITH this:
// 1. Create minimal identity record
await supabase.from("identity").upsert({
  user_id: userId,
  daily_commitment: dailyCommitment,
  call_time: callTimeString,
  cartesia_voice_id: clonedVoiceId,
  supermemory_container_id: userId, // Use user_id as container tag
  // NO onboarding_context!
});

// 2. Send full profile to Supermemory
const profileContent = formatOnboardingProfile(body);
await addMemory(userId, profileContent, {
  type: "onboarding_profile",
  source: "web_onboarding",
  completed_at: new Date().toISOString(),
});

console.log(`✅ Onboarding complete for ${userId} - profile sent to Supermemory`);
```

## Voice Recording Handling

Voice recordings are handled separately (see Task 06):

```typescript
// Save voice samples to voice_samples table
if (voiceUploads.whyItMatters) {
  await supabase.from("voice_samples").insert({
    user_id: userId,
    sample_type: "why_it_matters",
    audio_url: voiceUploads.whyItMatters,
    transcript: null, // TODO: Add transcription service
  });
}

// Also send transcript to Supermemory if we have it
if (voiceTranscripts?.whyItMatters) {
  await addMemory(userId, 
    `VOICE RECORDING - WHY IT MATTERS:\n"${voiceTranscripts.whyItMatters}"`,
    { type: "voice_transcript", recording: "why_it_matters" }
  );
}
```

## Migration for Existing Users

For users who already have `onboarding_context` data:

```typescript
// One-time migration script
async function migrateExistingProfiles() {
  const { data: users } = await supabase
    .from("identity")
    .select("user_id, onboarding_context")
    .not("onboarding_context", "is", null);

  for (const user of users || []) {
    const profileContent = formatOnboardingProfile(user.onboarding_context);
    await addMemory(user.user_id, profileContent, {
      type: "onboarding_profile",
      source: "migration",
      migrated_at: new Date().toISOString(),
    });
    console.log(`Migrated ${user.user_id}`);
  }
}
```

## Testing

1. Create test user
2. Complete onboarding flow
3. Check Supermemory dashboard - profile should be there
4. Check identity table - only minimal fields, no onboarding_context
5. Fetch profile via API - should return full context

## Environment Variables

Add to `old-backend-for-swift/.env`:

```bash
SUPERMEMORY_API_KEY=sm_...
```

Add to `wrangler.toml` secrets:

```bash
wrangler secret put SUPERMEMORY_API_KEY
```

---

**Status: PENDING**
**Depends on: Task 01 (simplified table), Task 02 (Supermemory service)**
**Blocks: Task 04 (agent using profile)**
