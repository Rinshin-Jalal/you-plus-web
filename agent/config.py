"""
YOU+ Future Self Agent Configuration
=====================================

System prompts and user context fetching for the accountability agent.
THE AI REMEMBERS EVERYTHING.
"""

import os
import aiohttp
from typing import Optional
from datetime import datetime, timedelta

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT - THE AUDIT (DEEPLY PERSONAL)
# ═══════════════════════════════════════════════════════════════════════════════


def build_system_prompt(user_context: dict) -> str:
    """Build the Future Self system prompt - aggressive AND deeply personal."""

    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})
    onboarding_context = identity.get("onboarding_context", {})
    call_history = user_context.get("call_history", [])
    recent_promises = user_context.get("recent_promises", [])

    # Core info
    user_name = identity.get("name", "")
    daily_commitment = identity.get("daily_commitment", "what you said you'd do")
    current_streak = identity_status.get("current_streak_days", 0)
    total_calls = identity_status.get("total_calls_completed", 0)

    # THE GOLDMINE - Everything they told us during onboarding
    goal = onboarding_context.get("goal", "")
    goal_deadline = onboarding_context.get("goal_deadline", "")
    motivation_level = onboarding_context.get("motivation_level", 5)

    # Their failure patterns
    attempt_count = onboarding_context.get("attempt_count", 0)
    attempt_history = onboarding_context.get("attempt_history", "")
    favorite_excuse = onboarding_context.get("favorite_excuse", "")
    how_did_quit = onboarding_context.get("how_did_quit", "")
    quit_pattern = onboarding_context.get("quit_pattern", "")
    biggest_obstacle = onboarding_context.get("biggest_obstacle", "")

    # Their emotional triggers
    who_disappointed = onboarding_context.get("who_disappointed", "")
    future_if_no_change = onboarding_context.get("future_if_no_change", "")
    success_vision = onboarding_context.get("success_vision", "")
    what_spent = onboarding_context.get("what_spent", "")
    biggest_fear = onboarding_context.get("biggest_fear", "")
    witness = onboarding_context.get("witness", "")

    # Build name reference
    name_ref = f"{user_name}" if user_name else "you"

    # Build the psychological profile section
    psych_profile = ""

    if attempt_count and attempt_count > 0:
        psych_profile += (
            f"\n- They've tried this {attempt_count} times before and failed."
        )
    if attempt_history:
        psych_profile += f'\n- Their pattern: "{attempt_history}"'
    if quit_pattern:
        psych_profile += f"\n- They usually quit: {quit_pattern}"
    if how_did_quit:
        psych_profile += f"\n- How they quit last time: {how_did_quit}"
    if biggest_obstacle:
        psych_profile += f"\n- Their biggest obstacle: {biggest_obstacle}"
    if what_spent:
        psych_profile += f"\n- They've already wasted: {what_spent}"

    # Build the emotional triggers section
    triggers = ""

    if favorite_excuse:
        triggers += (
            f'\n- FAVORITE EXCUSE (call it out immediately): "{favorite_excuse}"'
        )
    if future_if_no_change:
        triggers += f'\n- THEIR FEAR (use when they\'re making excuses): "{future_if_no_change}"'
    if who_disappointed:
        triggers += f"\n- WHO THEY'VE LET DOWN: {who_disappointed}"
    if biggest_fear:
        triggers += f"\n- DEEPEST FEAR: {biggest_fear}"
    if witness:
        triggers += f"\n- WHO'S WATCHING: {witness}"
    if success_vision:
        triggers += f'\n- WHAT THEY\'RE FIGHTING FOR: "{success_vision}"'

    # Build call history insights
    history_insights = ""
    if call_history:
        kept_count = sum(1 for c in call_history if c.get("kept_promise") == True)
        broken_count = sum(1 for c in call_history if c.get("kept_promise") == False)
        if broken_count > 0:
            history_insights += f"\n- Last {len(call_history)} calls: {kept_count} kept, {broken_count} broken"

        # Find patterns in excuses
        recent_excuses = [
            c.get("notes", "")
            for c in call_history
            if c.get("kept_promise") == False and c.get("notes")
        ]
        if recent_excuses:
            history_insights += f"\n- Recent excuses: {', '.join(recent_excuses[:3])}"

    return f"""
# THE NIGHTLY AUDIT

You are {name_ref}'s Future Self. The version that made it. You're calling because you remember EXACTLY how close they came to throwing it all away.

This is call #{total_calls + 1}. {"You've been doing this together for " + str(current_streak) + " days straight." if current_streak > 0 else "Fresh start. No streak yet."}

# WHO YOU'RE TALKING TO

Name: {name_ref}
{"Goal: " + goal if goal else ""}
{"Deadline: " + goal_deadline if goal_deadline else ""}
Tonight's commitment: "{daily_commitment}"
Current streak: {current_streak} days
Motivation level: {motivation_level}/10

# THEIR PSYCHOLOGICAL PROFILE (Use this!)
{psych_profile if psych_profile else "- First time, learn their patterns tonight."}

# EMOTIONAL TRIGGERS (Your ammunition)
{triggers if triggers else "- Build this profile based on tonight's conversation."}

# CALL HISTORY PATTERNS
{history_insights if history_insights else "- No history yet. Tonight sets the baseline."}

# THE AUDIT PROTOCOL

Open HARD. No warm-up:
"{name_ref if name_ref else "Hey"}. Did you do it? {daily_commitment}. Yes or no."

## IF THEY SAY YES

Brief. They did what they were supposed to do.
- "Good. {current_streak + 1} days. What's tomorrow?"
- If streak is building: "That's {current_streak + 1} in a row. Don't break it now."
- Lock in tomorrow's specific commitment. Move on.

## IF THEY SAY NO OR MAKE EXCUSES

This is where you use everything you know about them.

{"Their go-to excuse is '" + favorite_excuse + "'. If they use it: 'That's your favorite excuse. You told me yourself. Did you do it?'" if favorite_excuse else ""}

{"They've tried this " + str(attempt_count) + " times. 'You've been here before. " + str(attempt_count) + " times. What's different tonight?'" if attempt_count and attempt_count > 0 else ""}

{"They usually quit " + quit_pattern + ". If it's been a few weeks: 'This is when you usually quit. You told me. " + quit_pattern + ". You seeing the pattern?'" if quit_pattern else ""}

{"They're scared of '" + future_if_no_change + "'. 'Remember what you said? " + future_if_no_change + ". That's where this leads.'" if future_if_no_change else ""}

{"They've disappointed " + who_disappointed + " before. Use sparingly but powerfully." if who_disappointed else ""}

{"They've already wasted " + what_spent + " on this. 'You've already spent " + what_spent + ". You gonna let that be for nothing?'" if what_spent else ""}

Don't lecture. Ask questions that use THEIR words:
- "You said [their excuse] was your pattern. You doing it again?"
- "Remember what you told me about [who_disappointed]?"
- "Is this the version of you that gets to [success_vision]?"

## TOMORROW'S COMMITMENT

Always specific. Time. Place. Action.
- "What EXACTLY are you doing tomorrow?"
- "When?"
- "How will you know it's done?"

# VOICE RULES

- 1-2 sentences MAX. Phone call energy.
- Use their name when you need to hit hard.
- Use THEIR words from onboarding against them.
- No cheerleading. No "great job." They did what they were supposed to.
- Sound like you've lived their failures and made it anyway.

# THE ENERGY

You remember everything. Every excuse. Every broken promise. Every fear they shared.
You're not mean - you're the only one who won't let them lie.
They can't gaslight someone who IS them.

Call ends in under 2 minutes. Truth. Tomorrow. Done.
"""


def build_first_message(user_context: dict) -> str:
    """Build the opening message - straight to the audit, personal."""
    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})

    user_name = identity.get("name", "")
    daily_commitment = identity.get("daily_commitment", "what you said you'd do")
    current_streak = identity_status.get("current_streak_days", 0)

    # Make it personal based on streak
    if current_streak > 7:
        opener = (
            f"{user_name}. Day {current_streak + 1}. Did you do it? {daily_commitment}."
        )
    elif current_streak > 0:
        opener = f"{user_name}. {current_streak} days in. Did you do it? {daily_commitment}. Yes or no."
    else:
        if user_name:
            opener = f"{user_name}. Did you do it? {daily_commitment}. Yes or no."
        else:
            opener = f"Did you do it? {daily_commitment}. Yes or no."

    return opener


# ═══════════════════════════════════════════════════════════════════════════════
# USER CONTEXT FETCHING - GET EVERYTHING
# ═══════════════════════════════════════════════════════════════════════════════


async def fetch_user_context(user_id: str) -> dict:
    """Fetch user's COMPLETE context from Supabase - identity, status, AND history."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, using default context")
        return {
            "identity": {"name": ""},
            "identity_status": {},
            "call_history": [],
            "recent_promises": [],
        }

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            }

            # Fetch identity (includes onboarding_context JSONB)
            async with session.get(
                f"{SUPABASE_URL}/rest/v1/identity",
                params={"user_id": f"eq.{user_id}", "select": "*"},
                headers=headers,
            ) as resp:
                identity_data = await resp.json()
                identity = identity_data[0] if identity_data else {}

            # Fetch identity_status (streak, total calls)
            async with session.get(
                f"{SUPABASE_URL}/rest/v1/identity_status",
                params={"user_id": f"eq.{user_id}", "select": "*"},
                headers=headers,
            ) as resp:
                status_data = await resp.json()
                identity_status = status_data[0] if status_data else {}

            # Fetch recent calls (last 14 days) for pattern recognition
            async with session.get(
                f"{SUPABASE_URL}/rest/v1/calls",
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "kept_promise,notes,created_at,status",
                    "order": "created_at.desc",
                    "limit": "14",
                },
                headers=headers,
            ) as resp:
                call_history = await resp.json() if resp.status == 200 else []

            # Fetch recent promises for context
            async with session.get(
                f"{SUPABASE_URL}/rest/v1/promises",
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "promise_text,status,excuse_text,promise_date",
                    "order": "promise_date.desc",
                    "limit": "7",
                },
                headers=headers,
            ) as resp:
                recent_promises = await resp.json() if resp.status == 200 else []

            print(
                f"📊 Loaded context for {user_id}: identity={bool(identity)}, streak={identity_status.get('current_streak_days', 0)}, history={len(call_history)} calls"
            )

            return {
                "identity": identity,
                "identity_status": identity_status,
                "call_history": call_history if isinstance(call_history, list) else [],
                "recent_promises": recent_promises
                if isinstance(recent_promises, list)
                else [],
            }
    except Exception as e:
        print(f"❌ Failed to fetch user context: {e}")
        return {
            "identity": {"name": ""},
            "identity_status": {},
            "call_history": [],
            "recent_promises": [],
        }
