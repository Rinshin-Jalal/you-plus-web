import { createSupabaseClient, getUserContext } from "@/features/core/utils/database";
import { format, subDays } from "date-fns";
/**
 * Sync identity_status table with actual data from promises table
 *
 * Calculates:
 * - promises_made_count: Total promises with definitive status (kept or broken)
 * - promises_broken_count: Total broken promises
 * - current_streak_days: Consecutive days with all promises kept
 * - trust_percentage: Trust score based on recent performance (last 7 days)
 * - status_summary: AI-generated discipline + notification messaging
 */
export async function syncIdentityStatus(userId, env) {
    const supabase = createSupabaseClient(env);
    try {
        console.log(`📊 Starting identity status sync for user ${userId}`);
        // Fetch all promises for this user, ordered by date descending
        const { data: allPromises, error: promisesError } = await supabase
            .from("promises")
            .select("*")
            .eq("user_id", userId)
            .order("promise_date", { ascending: false });
        if (promisesError) {
            console.error(`Failed to fetch promises for user ${userId}:`, promisesError);
            throw promisesError;
        }
        const promisesMade = (allPromises || []).filter((p) => p.status === "kept" || p.status === "broken").length;
        const promisesBroken = (allPromises || []).filter((p) => p.status === "broken").length;
        const currentStreak = calculateStreak(allPromises || []);
        const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
        const recentPromises = (allPromises || []).filter((p) => p.promise_date >= sevenDaysAgo);
        const recentBroken = recentPromises.filter((p) => p.status === "broken").length;
        const successRate = promisesMade > 0
            ? Math.round(((promisesMade - promisesBroken) / promisesMade) * 100)
            : 0;
        console.log(`📈 Promise stats: ${promisesMade} made, ${promisesBroken} broken (${promisesMade - promisesBroken} kept)`);
        console.log(`🔥 Current streak: ${currentStreak} days`);
        console.log(`⚡ Recent performance: ${recentBroken} broken in last 7 days`);
        const metrics = {
            successRate,
            currentStreak,
            promisesMade,
            promisesBroken,
            recentBroken,
        };
        const statusSummary = await generateStatusSummary({
            userId,
            env,
            supabase,
            metrics,
            allPromises: allPromises || [],
        });
        const { data: updatedStatus, error: statusError } = await supabase
            .from("identity_status")
            .upsert({
            user_id: userId,
            promises_made_count: promisesMade,
            promises_broken_count: promisesBroken,
            current_streak_days: currentStreak,
            last_updated: new Date().toISOString(),
            status_summary: statusSummary,
        }, { onConflict: "user_id" })
            .select()
            .single();
        if (statusError) {
            console.error(`Failed to update identity_status for user ${userId}:`, statusError);
            throw statusError;
        }
        console.log(`✅ Identity status synced for user ${userId}: ${promisesMade} made, ${promisesBroken} broken, ${currentStreak} day streak`);
        return {
            success: true,
            data: {
                promises_made_count: promisesMade,
                promises_broken_count: promisesBroken,
                current_streak_days: currentStreak,
                status_summary: statusSummary,
            },
        };
    }
    catch (error) {
        console.error(`Identity status sync failed for user ${userId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown sync error",
        };
    }
}
function calculateStreak(promises) {
    if (!promises || promises.length === 0)
        return 0;
    const promisesByDate = new Map();
    for (const promise of promises) {
        const date = promise.promise_date;
        if (!promisesByDate.has(date)) {
            promisesByDate.set(date, []);
        }
        promisesByDate.get(date).push(promise);
    }
    const sortedDates = Array.from(promisesByDate.keys()).sort().reverse();
    let streak = 0;
    for (const date of sortedDates) {
        const dayPromises = promisesByDate.get(date);
        const completedPromises = dayPromises.filter((p) => p.status === "kept" || p.status === "broken");
        if (completedPromises.length === 0)
            continue;
        const allKept = completedPromises.every((p) => p.status === "kept");
        if (allKept) {
            streak++;
        }
        else {
            break;
        }
    }
    return streak;
}
async function generateStatusSummary(params) {
    const { userId, env, supabase, metrics, allPromises } = params;
    let identity = null;
    let latestCallSummary = null;
    let primaryExcuse;
    try {
        const userContext = await getUserContext(env, userId);
        identity = userContext.identity;
        // Super MVP: self_sabotage_pattern now in onboarding_context
        primaryExcuse = userContext.identity?.onboarding_context?.self_sabotage_pattern;
        const { data: latestCall } = await supabase
            .from("calls")
            .select("call_type, transcript_summary, end_time, created_at")
            .eq("user_id", userId)
            .eq("call_type", "evening")
            .order("end_time", { ascending: false })
            .limit(1)
            .maybeSingle();
        latestCallSummary = latestCall?.transcript_summary || null;
    }
    catch (error) {
        console.warn(`⚠️ Failed to load context for status summary:`, error);
    }
    const fallbackSummary = buildHeuristicSummary(metrics, identity, {
        latestCallSummary,
        primaryExcuse,
    });
    if (!env.OPENAI_API_KEY) {
        console.warn("⚠️ OPENAI_API_KEY missing - using heuristic status summary");
        return fallbackSummary;
    }
    try {
        const recentPromises = allPromises
            .slice(0, 5)
            .map((p) => {
            const status = p.status?.toUpperCase?.() || "PENDING";
            return `- ${p.promise_date}: ${p.promise_text || "(no text)"} [${status}]`;
        })
            .join("\n");
        const prompt = `# USER PERFORMANCE SNAPSHOT
Success rate: ${metrics.successRate}%
Current streak: ${metrics.currentStreak} days
Promises made: ${metrics.promisesMade}
Promises broken: ${metrics.promisesBroken}
Broken promises in last 7 days: ${metrics.recentBroken}
Primary excuse: ${primaryExcuse || "unknown"}
Latest evening call summary: ${latestCallSummary || "No call summary yet."}

Recent promises:
${recentPromises || "(no promises recorded)"}

Identity data:
- Daily commitment: ${identity?.daily_commitment || "unknown"}
- Goal: ${identity?.onboarding_context?.goal || "unknown"}
- Motivation level: ${identity?.onboarding_context?.motivation_level || "unknown"}
- Future if no change: ${identity?.onboarding_context?.future_if_no_change || "none"}

You are BigBruh. Classify their discipline state and craft a brutal but motivating notification.
Return JSON with keys: disciplineLevel (CRISIS|GROWTH|STUCK|STABLE|UNKNOWN), disciplineMessage, notificationTitle, notificationMessage. Make it short, sharp, and personal.`;
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0.6,
                max_tokens: 400,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "You are BigBruh, an intense accountability enforcer. Speak with ruthless clarity. Output STRICT JSON with the required keys. Discipline level must be one of CRISIS, GROWTH, STUCK, STABLE, UNKNOWN.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI status summary request failed:", errorText);
            return fallbackSummary;
        }
        const result = await response.json();
        const content = result?.choices?.[0]?.message?.content;
        if (!content) {
            console.warn("⚠️ OpenAI status summary returned empty content");
            return fallbackSummary;
        }
        let parsed;
        try {
            parsed = JSON.parse(content);
        }
        catch (error) {
            console.warn("⚠️ Failed to parse OpenAI JSON response, using fallback", error);
            return fallbackSummary;
        }
        const summary = {
            disciplineLevel: normalizeDisciplineLevel(parsed.disciplineLevel),
            disciplineMessage: sanitizeText(parsed.disciplineMessage, fallbackSummary.disciplineMessage),
            notificationTitle: sanitizeText(parsed.notificationTitle, fallbackSummary.notificationTitle),
            notificationMessage: sanitizeText(parsed.notificationMessage, fallbackSummary.notificationMessage),
            generatedAt: new Date().toISOString(),
        };
        return summary;
    }
    catch (error) {
        console.error("⚠️ OpenAI status summary generation failed:", error);
        return fallbackSummary;
    }
}
function buildHeuristicSummary(metrics, identity, options) {
    const { successRate, currentStreak, promisesMade, promisesBroken, recentBroken } = metrics;
    let disciplineLevel = "UNKNOWN";
    if (promisesMade === 0) {
        disciplineLevel = "UNKNOWN";
    }
    else if (successRate < 40 || recentBroken >= 3 || currentStreak === 0) {
        disciplineLevel = "CRISIS";
    }
    else if (successRate >= 80 && currentStreak >= 3) {
        disciplineLevel = "GROWTH";
    }
    else if (successRate < 60 || currentStreak < 2) {
        disciplineLevel = "STUCK";
    }
    else {
        disciplineLevel = "STABLE";
    }
    const identityName = identity?.name || "bro";
    // Super MVP: self_sabotage_pattern now in onboarding_context
    const excuse = options?.primaryExcuse || identity?.onboarding_context?.self_sabotage_pattern || "weak escape";
    const latestSummary = options?.latestCallSummary;
    const disciplineMessageMap = {
        CRISIS: `You're sliding hard, ${identityName}. Every excuse (${excuse}) puts you deeper in the pit. Decide if you're done being weak.`,
        STUCK: `Momentum is dead. You keep flirting with failure and calling it effort. Lock in or lose it all.`,
        STABLE: `You're holding ground, but there's no fire yet. Stability without aggression becomes decay. Push harder.`,
        GROWTH: `Momentum is real. You're stacking disciplined days—don't soften now. Double down before comfort drags you back.`,
        UNKNOWN: `No record yet. Make a promise today and actually keep it.`,
    };
    const notificationTitleMap = {
        CRISIS: "EMERGENCY INTERVENTION",
        STUCK: "MOMENTUM CHECK",
        STABLE: "ACCOUNTABILITY CHECK",
        GROWTH: "KEEP IT MOVING",
        UNKNOWN: "ACCOUNTABILITY CHECK",
    };
    const notificationMessageMap = {
        CRISIS: `Your excuses are stacking (${promisesBroken} broken). Stop pretending tomorrow saves you.`,
        STUCK: `Success rate ${successRate}% with weak streak. Start acting like you actually want change.`,
        STABLE: `${currentStreak} day streak at ${successRate}% success. Don't let boredom kill your momentum.`,
        GROWTH: `Streak at ${currentStreak} days. Ride the wave and set a bigger promise now.`,
        UNKNOWN: `No data yet. Make a commitment and prove you belong here.`,
    };
    const message = disciplineMessageMap[disciplineLevel];
    let notificationMessage = notificationMessageMap[disciplineLevel];
    if (latestSummary && disciplineLevel === "CRISIS") {
        notificationMessage += ` Last call recap: ${latestSummary}`;
    }
    return {
        disciplineLevel,
        disciplineMessage: message,
        notificationTitle: notificationTitleMap[disciplineLevel],
        notificationMessage,
        generatedAt: new Date().toISOString(),
    };
}
const allowedDisciplineLevels = new Set([
    "CRISIS",
    "GROWTH",
    "STUCK",
    "STABLE",
    "UNKNOWN",
]);
function normalizeDisciplineLevel(level) {
    if (typeof level !== "string")
        return "UNKNOWN";
    const upper = level.toUpperCase();
    if (allowedDisciplineLevels.has(upper)) {
        return upper;
    }
    return "UNKNOWN";
}
function sanitizeText(value, fallback) {
    if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
    }
    return fallback;
}
