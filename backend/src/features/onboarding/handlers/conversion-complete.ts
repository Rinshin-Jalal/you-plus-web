import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { transcribeAudio, cloneVoice, uploadAudioToR2 } from "@/features/core/utils/transcription";
import { ConversionCompleteSchema } from "../schemas";

export const postConversionOnboardingComplete = async (c: Context) => {
  console.log("🎯 === CONVERSION ONBOARDING: Complete Request Received ===");

  const userId = getAuthenticatedUserId(c);
  console.log("👤 Authenticated User ID:", userId);

  const body = await c.req.json();
  console.log("📦 Request body keys:", Object.keys(body));

  const parsed = ConversionCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid onboarding payload", details: parsed.error.flatten() }, 400);
  }

  const payload = parsed.data;

  const env = c.env as Env;

  const {
    // Core identity
    name,
    times_tried,  // Not stored in DB yet, but collected
    core_identity,
    primary_pillar,
    dark_future,

    // Patterns
    quit_pattern,
    favorite_excuse,
    who_disappointed,  // Array

    // Dynamic pillars - array of pillar IDs the user selected
    selected_pillars,

    // Voice recordings (base64 or R2 URLs)
    future_self_intro_recording,
    why_recording,  // This will be transcribed to get the_why
    pledge_recording,
    
    // Merged voice recording for cloning (single WAV file merged on client)
    // This is the preferred source for voice cloning as it's a proper audio file
    merged_voice_recording,

    // Call settings
    call_time,
    
    // User's timezone (from browser Intl API)
    timezone,
  } = payload;

  // Validate required fields
  if (!core_identity) {
    return c.json({ error: "Missing required field: core_identity" }, 400);
  }

  if (!selected_pillars || !Array.isArray(selected_pillars) || selected_pillars.length === 0) {
    return c.json({ error: "Missing required field: selected_pillars (must be an array)" }, 400);
  }

  // Validate all 3 voice recordings are present (required for voice cloning)
  if (!future_self_intro_recording) {
    return c.json({ error: "Missing required field: future_self_intro_recording" }, 400);
  }
  if (!why_recording) {
    return c.json({ error: "Missing required field: why_recording" }, 400);
  }
  if (!pledge_recording) {
    return c.json({ error: "Missing required field: pledge_recording" }, 400);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REQUIRE STORAGE BUCKET - Audio files must be stored in R2
  // ═══════════════════════════════════════════════════════════════════════
  if (!env.AUDIO_BUCKET) {
    console.error("❌ AUDIO_BUCKET not configured - cannot process onboarding without storage");
    return c.json({ 
      error: "Storage configuration error", 
      details: "Audio storage bucket is not configured. Please contact support." 
    }, 503);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PROCESS VOICE RECORDINGS: Transcribe, Clone Voice, Upload to R2
  // ═══════════════════════════════════════════════════════════════════════
  let theWhy: string = "";
  let futureSelftroUrl: string | null = null;
  let whyRecordingUrl: string | null = null;
  let pledgeRecordingUrl: string | null = null;
  let cartesiaVoiceId: string | null = null;

  console.log("\n🎤 === PROCESSING VOICE RECORDINGS ===");

  // Check if recordings are base64 (not already URLs)
  const isBase64 = (s: string) => s.startsWith("data:") || !s.startsWith("http");
  const introIsBase64 = isBase64(future_self_intro_recording);
  const whyIsBase64 = isBase64(why_recording);
  const pledgeIsBase64 = isBase64(pledge_recording);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Transcribe why_recording ONLY to get the_why text
  // ─────────────────────────────────────────────────────────────────────────
  if (whyIsBase64) {
    console.log("📝 [1/4] Transcribing why_recording...");
    const transcriptionResult = await transcribeAudio(why_recording, env);

    if (transcriptionResult.success && transcriptionResult.text) {
      theWhy = transcriptionResult.text;
      console.log(`✅ Transcription successful: "${theWhy.substring(0, 100)}..."`);
    } else {
      console.warn(`⚠️ Transcription failed: ${transcriptionResult.error}`);
      theWhy = "[Voice recording - transcription pending]";
    }
  } else {
    console.log("📎 why_recording is already a URL, skipping transcription");
    theWhy = body.the_why || "[Voice recording]";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Clone voice from merged recording (or fallback to best single)
  // ─────────────────────────────────────────────────────────────────────────
  // The client merges all 3 recordings into a single WAV file using Web Audio API
  // This produces a valid audio file that Cartesia can process (unlike raw byte concatenation)
  
  if (merged_voice_recording && isBase64(merged_voice_recording)) {
    console.log("🎭 [2/4] Cloning user's voice from merged recording (client-side merged)...");
    
    // Use the merged recording - it's already a proper audio file
    const cloneResult = await cloneVoice(
      [merged_voice_recording],  // Single merged file
      userId,
      name || "User",
      env
    );

    if (cloneResult.success && cloneResult.voiceId) {
      cartesiaVoiceId = cloneResult.voiceId;
      console.log(`✅ Voice cloned successfully! Voice ID: ${cartesiaVoiceId}`);
    } else {
      console.warn(`⚠️ Voice cloning failed: ${cloneResult.error}`);
      console.warn("⚠️ User will use default agent voice until cloning succeeds");
    }
  } else if (introIsBase64 && whyIsBase64 && pledgeIsBase64) {
    // Fallback: Use the single largest recording if no merged audio
    console.log("🎭 [2/4] No merged recording - using largest individual recording...");

    // Find the largest recording
    const recordings = [
      { name: 'intro', data: future_self_intro_recording },
      { name: 'why', data: why_recording },
      { name: 'pledge', data: pledge_recording }
    ];
    
    const largestRecording = recordings.reduce((best, current) => 
      current.data.length > best.data.length ? current : best
    );
    
    console.log(`   Using ${largestRecording.name} recording (${largestRecording.data.length} chars)`);

    const cloneResult = await cloneVoice(
      [largestRecording.data],
      userId,
      name || "User",
      env
    );

    if (cloneResult.success && cloneResult.voiceId) {
      cartesiaVoiceId = cloneResult.voiceId;
      console.log(`✅ Voice cloned successfully! Voice ID: ${cartesiaVoiceId}`);
    } else {
      console.warn(`⚠️ Voice cloning failed: ${cloneResult.error}`);
      console.warn("⚠️ User will use default agent voice until cloning succeeds");
    }
  } else {
    console.log("📎 Some recordings are already URLs, skipping voice cloning");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 & 4: Upload ALL 3 recordings to R2 for future reference
  // ─────────────────────────────────────────────────────────────────────────
  // AUDIO_BUCKET is required (validated above)
  console.log("📤 [3/4] Uploading all recordings to R2...");

  // Upload future_self_intro_recording
  if (introIsBase64) {
    futureSelftroUrl = await uploadAudioToR2(
      future_self_intro_recording,
      userId,
      "future_self_intro",
      env.AUDIO_BUCKET,
      env
    );
    console.log(`   ✅ future_self_intro uploaded`);
  } else {
    futureSelftroUrl = future_self_intro_recording;
  }

  // Upload why_recording
  if (whyIsBase64) {
    whyRecordingUrl = await uploadAudioToR2(
      why_recording,
      userId,
      "why",
      env.AUDIO_BUCKET,
      env
    );
    console.log(`   ✅ why_recording uploaded`);
  } else {
    whyRecordingUrl = why_recording;
  }

  // Upload pledge_recording
  if (pledgeIsBase64) {
    pledgeRecordingUrl = await uploadAudioToR2(
      pledge_recording,
      userId,
      "pledge",
      env.AUDIO_BUCKET,
      env
    );
    console.log(`   ✅ pledge_recording uploaded`);
  } else {
    pledgeRecordingUrl = pledge_recording;
  }

  console.log("📤 [4/4] All recordings uploaded to R2");

  // Validate that we have the_why
  if (!theWhy) {
    return c.json({
      error: "Failed to transcribe why_recording"
    }, 400);
  }

  // Use default call_time if not provided (21:00 = 9pm evening reflection)
  const finalCallTime = call_time || '21:00';

  console.log(`\n📊 === CONVERSION ONBOARDING DATA ===`);
  console.log(`Core Identity: ${core_identity}`);
  console.log(`Selected Pillars: ${selected_pillars.join(', ')}`);
  console.log(`Primary Pillar: ${primary_pillar || selected_pillars[0]}`);
  console.log(`Call Time: ${finalCallTime}${!call_time ? ' (default)' : ''}`);

  const supabase = createSupabaseClient(env);

  try {
    // Get user's name from auth first
    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    const userName = name || userData?.name || "User";

    console.log(`\n📦 === BUILDING ONBOARDING CONTEXT ===`);

    // Parse callTime
    let callTimeString: string;
    if (typeof finalCallTime === 'string') {
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(finalCallTime)) {
        const parts = finalCallTime.split(':');
        callTimeString = `${parts[0]!.padStart(2, '0')}:${parts[1]!}:${parts[2] || '00'}`;
      } else {
        const callTimeDate = new Date(finalCallTime);
        if (!isNaN(callTimeDate.getTime())) {
          callTimeString = `${String(callTimeDate.getHours()).padStart(2, "0")}:${String(
            callTimeDate.getMinutes()
          ).padStart(2, "0")}:${String(callTimeDate.getSeconds()).padStart(2, "0")}`;
        } else {
          console.warn(`⚠️ Could not parse callTime: ${finalCallTime}, using default 21:00:00`);
          callTimeString = '21:00:00';
        }
      }
    } else {
      console.warn(`⚠️ callTime is not a string: ${finalCallTime}, using default 21:00:00`);
      callTimeString = '21:00:00';
    }

    console.log(`📅 Parsed callTime: ${finalCallTime} -> ${callTimeString}`);

    // ═══════════════════════════════════════════════════════════════════════
    // FUTURE SELF SYSTEM - Dynamic Pillars
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`\n💾 === SAVING TO FUTURE_SELF TABLE ===`);

    // Extract the primary pillar ID from the selection (strip emoji if present)
    let mappedPrimaryPillar: string = selected_pillars[0]; // Default to first selected
    if (primary_pillar) {
      // Try to extract pillar ID from emoji+label format like "💪 Health & Fitness"
      // Find which selected pillar matches
      for (const pillarId of selected_pillars) {
        // Check if primary_pillar contains this pillar ID or related text
        const pillarLower = pillarId.toLowerCase();
        const primaryLower = primary_pillar.toLowerCase();
        if (primaryLower.includes(pillarLower) ||
          primaryLower.includes(pillarLower.replace('_', ' ')) ||
          primaryLower.includes(pillarLower.replace('custom_', ''))) {
          mappedPrimaryPillar = pillarId;
          break;
        }
      }
    }

    // 1. Create or update future_self record (upsert to handle re-onboarding)
    const { data: futureSelfData, error: futureSelfError } = await supabase
      .from("future_self")
      .upsert({
        user_id: userId,
        core_identity: core_identity,
        primary_pillar: mappedPrimaryPillar,
        the_why: theWhy,  // Transcribed text from why_recording
        dark_future: dark_future || null,
        quit_pattern: quit_pattern || null,
        favorite_excuse: favorite_excuse || null,
        who_disappointed: Array.isArray(who_disappointed) ? who_disappointed : (who_disappointed ? [who_disappointed] : []),
        future_self_intro_url: futureSelftroUrl || null,  // R2 URL
        why_recording_url: whyRecordingUrl || null,  // R2 URL
        pledge_recording_url: pledgeRecordingUrl || null,  // R2 URL
        cartesia_voice_id: cartesiaVoiceId || null,  // Cloned voice ID for Future Self agent
        supermemory_container_id: userId,
        selected_pillars: selected_pillars, // Store the array of selected pillar IDs
      }, { onConflict: 'user_id' })
      .select('id')
      .single();

    if (futureSelfError) {
      console.error("❌ Future Self insert failed:", futureSelfError);
      throw futureSelfError;
    }

    const futureSelfId = futureSelfData.id;
    console.log(`✅ Future Self created/updated with ID: ${futureSelfId}`);

    // 2. Delete existing pillars for this user (for re-onboarding scenarios)
    const { error: deletePillarsError } = await supabase
      .from("future_self_pillars")
      .delete()
      .eq("user_id", userId);

    if (deletePillarsError) {
      console.error("❌ Failed to delete existing pillars:", deletePillarsError);
      throw deletePillarsError;
    }
    console.log(`🗑️ Cleared existing pillars for user`);

    // 3. Create pillar records for each selected pillar
    // Dynamic pillar data comes in as: {pillar_id}_current, {pillar_id}_goal, {pillar_id}_future
    const createdPillars: string[] = [];

    for (let i = 0; i < selected_pillars.length; i++) {
      const pillarId = selected_pillars[i];

      // Extract pillar data from body using dynamic field names
      const currentState = body[`${pillarId}_current`];
      const goal = body[`${pillarId}_goal`];
      const futureState = body[`${pillarId}_future`];

      // Skip if we don't have the required data
      if (!currentState || !futureState) {
        console.warn(`⚠️ Skipping pillar ${pillarId} - missing required fields`);
        continue;
      }

      // Calculate priority - primary pillar gets 100, others get decreasing priority
      const isPrimary = pillarId === mappedPrimaryPillar;
      const priority = isPrimary ? 100 : Math.max(50, 90 - (i * 10));

      // Identity statement is derived from future state or core identity
      const identityStatement = `I am someone who ${futureState.toLowerCase().startsWith('i ') ? futureState.slice(2) : futureState}`;

      const { error: pillarError } = await supabase
        .from("future_self_pillars")
        .insert({
          user_id: userId,
          future_self_id: futureSelfId,
          pillar: pillarId,
          current_state: currentState,
          future_state: futureState,
          identity_statement: identityStatement,
          non_negotiable: goal || `I show up for ${pillarId.replace(/_/g, ' ')} every day`,
          priority: priority,
        });

      if (pillarError) {
        console.error(`❌ Pillar ${pillarId} insert failed:`, pillarError);
        throw pillarError;
      }
      console.log(`✅ Pillar created: ${pillarId} (priority: ${priority})`);
      createdPillars.push(pillarId);
    }

    // 4. Create/update status record
    const { error: statusError } = await supabase
      .from("status")
      .upsert({
        user_id: userId,
        current_streak_days: 0,
        longest_streak_days: 0,
        total_calls_completed: 0,
        last_call_at: null,
      }, { onConflict: 'user_id' });

    if (statusError) {
      console.error("❌ Status upsert failed:", statusError);
      throw statusError;
    }
    console.log(`✅ Status record created/updated`);

    console.log(`\n👤 === UPDATING USER RECORD ===`);

    // Prepare user update data
    const userUpdateData: Record<string, unknown> = {
      name: userName,
      call_time: callTimeString,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add timezone if provided (from browser Intl API)
    if (timezone && typeof timezone === 'string') {
      userUpdateData.timezone = timezone;
      console.log(`📍 Timezone: ${timezone}`);
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(userUpdateData)
      .eq("id", userId);

    if (updateError) {
      console.error("❌ User update failed:", updateError);
      throw updateError;
    }

    console.log(`✅ User updated with call_time: ${callTimeString}${timezone ? `, timezone: ${timezone}` : ''}`);

    console.log(`\n🎉 === CONVERSION ONBOARDING COMPLETE ===`);
    console.log(`Created ${createdPillars.length} pillars: ${createdPillars.join(', ')}`);
    console.log(`Voice cloned: ${cartesiaVoiceId ? 'Yes' : 'No'}`);

    return c.json({
      success: true,
      message: "Onboarding completed successfully",
      completedAt: new Date().toISOString(),
      futureSelf: {
        id: futureSelfId,
        pillars: createdPillars,
        primaryPillar: mappedPrimaryPillar,
        voiceCloned: !!cartesiaVoiceId,
      },
    });
  } catch (error) {
    console.error("💥 Conversion onboarding failed:", error);
    return c.json(
      {
        success: false,
        error: "Failed to complete onboarding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
