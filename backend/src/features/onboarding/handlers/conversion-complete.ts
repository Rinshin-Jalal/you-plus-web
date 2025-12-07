import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";

export const postConversionOnboardingComplete = async (c: Context) => {
  console.log("🎯 === CONVERSION ONBOARDING: Complete Request Received ===");

  const userId = getAuthenticatedUserId(c);
  console.log("👤 Authenticated User ID:", userId);

  const body = await c.req.json();
  console.log("📦 Request body keys:", Object.keys(body));

  const {
    // Core identity
    name,
    times_tried,  // Not stored in DB yet, but collected
    core_identity,
    primary_pillar,
    the_why,
    dark_future,
    
    // Patterns
    quit_pattern,
    favorite_excuse,
    who_disappointed,  // Array
    
    // Dynamic pillars - array of pillar IDs the user selected
    selected_pillars,
    
    // Voice recordings (base64 or R2 URLs)
    future_self_intro_recording,
    why_recording,
    pledge_recording,
    
    // Call settings
    call_time,
  } = body;

  // Validate required fields
  if (!core_identity) {
    return c.json({ error: "Missing required field: core_identity" }, 400);
  }
  
  if (!the_why) {
    return c.json({ error: "Missing required field: the_why" }, 400);
  }

  if (!selected_pillars || !Array.isArray(selected_pillars) || selected_pillars.length === 0) {
    return c.json({ error: "Missing required field: selected_pillars (must be an array)" }, 400);
  }

  // Use default call_time if not provided (21:00 = 9pm evening reflection)
  const finalCallTime = call_time || '21:00';

  console.log(`\n📊 === CONVERSION ONBOARDING DATA ===`);
  console.log(`Core Identity: ${core_identity}`);
  console.log(`Selected Pillars: ${selected_pillars.join(', ')}`);
  console.log(`Primary Pillar: ${primary_pillar || selected_pillars[0]}`);
  console.log(`Call Time: ${finalCallTime}${!call_time ? ' (default)' : ''}`);

  const env = c.env as Env;
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
        the_why: the_why,
        dark_future: dark_future || null,
        quit_pattern: quit_pattern || null,
        favorite_excuse: favorite_excuse || null,
        who_disappointed: who_disappointed || [],
        future_self_intro_url: future_self_intro_recording || null,
        why_recording_url: why_recording || null,
        pledge_recording_url: pledge_recording || null,
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

    const { error: updateError } = await supabase
      .from("users")
      .update({
        name: userName,
        call_time: callTimeString,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ User update failed:", updateError);
      throw updateError;
    }

    console.log(`✅ User updated with call_time: ${callTimeString}`);

    console.log(`\n🎉 === CONVERSION ONBOARDING COMPLETE ===`);
    console.log(`Created ${createdPillars.length} pillars: ${createdPillars.join(', ')}`);

    return c.json({
      success: true,
      message: "Onboarding completed successfully",
      completedAt: new Date().toISOString(),
      futureSelf: {
        id: futureSelfId,
        pillars: createdPillars,
        primaryPillar: mappedPrimaryPillar,
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
