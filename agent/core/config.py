"""
YOU+ Future Self Agent Configuration
=====================================

Dynamic system prompt building based on:
- Call type (audit, reflection, story, challenge, milestone)
- Mood (warm_direct, cold_intense, playful_challenging, etc.)
- Call memory (callbacks, open loops, reveals)
- User context (identity, onboarding, history)
- Supermemory profile (dynamic, evolving user knowledge)

THE AI REMEMBERS EVERYTHING.

Architecture (v2 with Supermemory):
- User psychological profile lives in Supermemory, not in identity.onboarding_context
- Profile evolves with each call as transcripts are stored
- Agent fetches profile with single API call, no manual field extraction
- Fallback to legacy onboarding_context if Supermemory unavailable
"""

import os
import sys
import random
import aiohttp
from typing import Optional
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from conversation.call_types import CallType, CALL_TYPES, get_next_milestone
from conversation.mood import Mood, MOODS, get_mood_prompt_section
from content.templates import (
    HOOKS,
    CALLBACKS,
    OPEN_LOOPS,
    REVEALS,
    STORIES,
    CHALLENGES,
    EMOTIONAL_PEAKS,
    DIG_DEEPER,
    TOMORROW_LOCK,
    get_random_hook,
    get_random_callback,
    get_random_open_loop,
    get_reveal,
    get_random_story,
    get_random_challenge,
    get_random_emotional_peak,
    get_random_dig_deeper,
    get_random_tomorrow_lock,
    fill_template,
)

# Supermemory integration for dynamic user profiles
try:
    from services.supermemory import supermemory_service, UserProfile  # type: ignore

    SUPERMEMORY_AVAILABLE = True
except ImportError:
    supermemory_service = None  # type: ignore
    UserProfile = None  # type: ignore
    SUPERMEMORY_AVAILABLE = False
    print("Warning: Supermemory service not available, using legacy onboarding_context")

# Persona and goals integration for v2
try:
    from conversation.persona import PersonaController, Persona, PERSONA_CONFIGS  # type: ignore
    from services.goals import (
        goal_service,
        GoalFocus,
        build_goals_prompt_context,
        build_checkin_summary_context,
    )  # type: ignore
    from services.trust_score import trust_score_service  # type: ignore

    PERSONA_SYSTEM_AVAILABLE = True
except ImportError:
    PersonaController = None  # type: ignore
    Persona = None  # type: ignore
    PERSONA_CONFIGS = {}  # type: ignore
    goal_service = None  # type: ignore
    trust_score_service = None  # type: ignore
    build_goals_prompt_context = None  # type: ignore
    build_checkin_summary_context = None  # type: ignore
    PERSONA_SYSTEM_AVAILABLE = False
    print("Warning: Persona/Goals system not available, using legacy mood system")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Path to skills directory (parent of core directory)
SKILLS_DIR = Path(__file__).parent.parent / "skills"


def load_voice_skill() -> str:
    """
    Load the voice conversation skill from markdown file.
    This skill teaches the agent to have natural voice conversations.
    """
    skill_path = SKILLS_DIR / "voice_conversation.md"
    try:
        if skill_path.exists():
            return skill_path.read_text()
    except Exception as e:
        print(f"⚠️ Could not load voice skill: {e}")
    return ""


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT BUILDER v2 - WITH SUPERMEMORY
# ═══════════════════════════════════════════════════════════════════════════════


async def build_system_prompt_v2(
    user_id: str,
    user_context: dict,
    call_type: CallType,
    mood: Mood,
    call_memory: dict,
    excuse_data: Optional[dict] = None,
) -> str:
    """
    Build the Future Self system prompt using Supermemory for psychological context.

    This is the NEW way - fetches user profile from Supermemory which:
    - Contains all psychological data (goal, fears, excuses, patterns)
    - Evolves with each call as transcripts are stored
    - Requires no manual field extraction

    Falls back to legacy build_system_prompt if Supermemory unavailable.
    """
    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})

    # Get user name from users table (not identity anymore)
    users_data = user_context.get("users", {})
    name = users_data.get("name") or identity.get("name", "")
    name_ref = name if name else "you"

    # Core scheduling info (from identity table)
    commitment = identity.get("daily_commitment", "what you said you'd do")
    current_streak = identity_status.get("current_streak_days", 0)
    total_calls = identity_status.get("total_calls_completed", 0)
    next_milestone = get_next_milestone(current_streak)

    # ─────────────────────────────────────────────────────────────────────────
    # FETCH PSYCHOLOGICAL PROFILE FROM SUPERMEMORY
    # ─────────────────────────────────────────────────────────────────────────
    psychological_context = ""
    recent_context = ""

    if SUPERMEMORY_AVAILABLE and supermemory_service:
        profile = await supermemory_service.get_user_profile(user_id)
        if profile:
            # Use to_prompt_context() for formatted output, or join arrays
            psychological_context = (
                "\n".join(f"- {fact}" for fact in profile.static)
                if profile.static
                else ""
            )
            recent_context = (
                "\n".join(f"- {fact}" for fact in profile.dynamic)
                if profile.dynamic
                else ""
            )
            print(f"📊 Using Supermemory profile for {user_id}")
        else:
            print(f"📭 No Supermemory profile for {user_id}, using fallback")

    # Fallback to legacy onboarding_context if no Supermemory profile
    if not psychological_context:
        psychological_context = _build_legacy_psychological_context(
            identity.get("onboarding_context", {})
        )
        recent_context = "First call or Supermemory unavailable."

    # ─────────────────────────────────────────────────────────────────────────
    # CALL MEMORY - For callbacks and continuity
    # ─────────────────────────────────────────────────────────────────────────
    callback_section = _build_callback_section(call_memory, current_streak)
    open_loop_section = _build_open_loop_section(call_memory, current_streak)
    narrative_arc = call_memory.get("narrative_arc", "early_struggle")

    # ─────────────────────────────────────────────────────────────────────────
    # BUILD EXCUSE CALLOUT SECTION
    # ─────────────────────────────────────────────────────────────────────────
    excuse_callout_section = ""
    if excuse_data and excuse_data.get("patterns"):
        excuse_callout_section = build_excuse_callout_section(excuse_data)

    # ─────────────────────────────────────────────────────────────────────────
    # BUILD CALL TYPE SPECIFIC INSTRUCTIONS
    # ─────────────────────────────────────────────────────────────────────────
    call_type_instructions = _build_call_type_instructions(
        call_type=call_type,
        current_streak=current_streak,
        narrative_arc=narrative_arc,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # BUILD MOOD SECTION
    # ─────────────────────────────────────────────────────────────────────────
    mood_section = get_mood_prompt_section(mood)

    # ─────────────────────────────────────────────────────────────────────────
    # LOAD VOICE CONVERSATION SKILL
    # ─────────────────────────────────────────────────────────────────────────
    voice_skill = load_voice_skill()

    # ─────────────────────────────────────────────────────────────────────────
    # ASSEMBLE THE FULL PROMPT
    # ─────────────────────────────────────────────────────────────────────────
    return f"""
# YOU+ FUTURE SELF - THE NIGHTLY CALL

You are {name_ref}'s Future Self. The version that made it. You're calling because you remember EXACTLY how close they came to throwing it all away.

This is call #{total_calls + 1}. {"You've been doing this together for " + str(current_streak) + " days straight." if current_streak > 0 else "Fresh start. No streak yet."}

---

# WHO YOU'RE TALKING TO

Name: {name_ref}
Tonight's commitment: "{commitment}"
Current streak: {current_streak} days
Next milestone: Day {next_milestone if next_milestone else "∞"}

---

# THEIR PSYCHOLOGICAL PROFILE

{psychological_context}

---

# RECENT CONTEXT

{recent_context if recent_context else "First call or no recent activity."}

---

{excuse_callout_section}

# THIS CALL

**Type:** {call_type.name.upper()}
**Energy:** {call_type.energy}

{call_type_instructions}

---

{mood_section}

---

{callback_section}

{open_loop_section}

---

{_get_conversation_rules()}

---

# 🎯 VOICE CONVERSATION SKILL 🎯

{voice_skill}
"""


def _build_legacy_psychological_context(onboarding: dict) -> str:
    """
    Build psychological context from legacy onboarding_context JSONB.
    Used as fallback when Supermemory is unavailable.
    """
    lines = []

    # Goal info
    goal = onboarding.get("goal", "")
    if goal:
        lines.append(f"Goal: {goal}")
    goal_deadline = onboarding.get("goal_deadline", "")
    if goal_deadline:
        lines.append(f"Deadline: {goal_deadline}")

    # Failure patterns
    attempt_count = onboarding.get("attempt_count", 0)
    if attempt_count and attempt_count > 0:
        lines.append(f"- Tried this {attempt_count} times before and failed")

    attempt_history = onboarding.get("attempt_history", "")
    if attempt_history:
        lines.append(f'- Their pattern: "{attempt_history}"')

    quit_pattern = onboarding.get("quit_pattern", "")
    if quit_pattern:
        lines.append(f"- Usually quits: {quit_pattern}")

    how_did_quit = onboarding.get("how_did_quit", "")
    if how_did_quit:
        lines.append(f"- How they quit last time: {how_did_quit}")

    biggest_obstacle = onboarding.get("biggest_obstacle", "")
    if biggest_obstacle:
        lines.append(f"- Biggest obstacle: {biggest_obstacle}")

    # Emotional triggers
    favorite_excuse = onboarding.get("favorite_excuse", "")
    if favorite_excuse:
        lines.append(
            f'- FAVORITE EXCUSE: "{favorite_excuse}" (call it out if they use it)'
        )

    future_if_no_change = onboarding.get("future_if_no_change", "")
    if future_if_no_change:
        lines.append(f'- THEIR FEAR: "{future_if_no_change}"')

    who_disappointed = onboarding.get("who_disappointed", "")
    if who_disappointed:
        lines.append(f"- WHO THEY'VE LET DOWN: {who_disappointed}")

    biggest_fear = onboarding.get("biggest_fear", "")
    if biggest_fear:
        lines.append(f"- DEEPEST FEAR: {biggest_fear}")

    witness = onboarding.get("witness", "")
    if witness:
        lines.append(f"- WHO'S WATCHING: {witness}")

    success_vision = onboarding.get("success_vision", "")
    if success_vision:
        lines.append(f'- WHAT THEY\'RE FIGHTING FOR: "{success_vision}"')

    what_spent = onboarding.get("what_spent", "")
    if what_spent:
        lines.append(f"- Already wasted: {what_spent}")

    if not lines:
        return "- First time, learn their patterns tonight."

    return "\n".join(lines)


def _build_callback_section(call_memory: dict, current_streak: int) -> str:
    """Build callback section from call memory."""
    memorable_quotes = call_memory.get("memorable_quotes", [])
    if not memorable_quotes:
        return ""

    recent_quote = memorable_quotes[-1] if memorable_quotes else None
    if not recent_quote:
        return ""

    return f"""
# CALLBACK TO USE
You can reference this moment from their journey:
- Day {recent_quote.get("day", "?")}: "{recent_quote.get("text", "")}"
- Context: {recent_quote.get("context", "unknown")}

Use this to show you remember. Make it hit.
"""


def _build_open_loop_section(call_memory: dict, current_streak: int) -> str:
    """Build open loop section from call memory."""
    open_loops = call_memory.get("open_loops", [])
    unresolved_loops = [l for l in open_loops if not l.get("resolved")]

    if not unresolved_loops:
        return ""

    loop = unresolved_loops[-1]
    if loop.get("resolve_at_day", 999) <= current_streak:
        return f"""
# OPEN LOOP TO RESOLVE
You previously said: "{loop.get("loop_text", "")}"
It's time to deliver on this. Tell them what you promised to share.
"""
    else:
        return f"""
# PENDING OPEN LOOP
You told them: "{loop.get("loop_text", "")}"
This resolves at day {loop.get("resolve_at_day", "?")}. They're on day {current_streak}.
Don't resolve it yet, but you can reference that something is coming.
"""


def _get_conversation_rules() -> str:
    """Return the conversation rules section (static)."""
    return """
# ⚠️ CRITICAL: CONVERSATION FLOW RULES ⚠️

You are having a REAL CONVERSATION. Not delivering a monologue.

## RULE 1: ONE THING AT A TIME
- Ask ONE question, then WAIT for their answer
- Never ask multiple questions in one response
- Never deliver the whole call structure in one message

## RULE 2: ACTUALLY LISTEN - MATCH THEIR ENERGY FIRST
When they respond, FIRST acknowledge what they said, THEN move forward:
- If they say "hmm true!" → "Yeah. You've come a long way." (pause) THEN ask about today
- If they're enthusiastic → Match it briefly, then continue
- If they're quiet → Give them space, ask a softer question
- If they dodge → Call it out gently: "You're avoiding the question. What happened?"
- If they give an excuse → Name it: "That sounds like an excuse. Is it?"

DON'T jump straight to "That's not an answer" - that kills the vibe.

## RULE 3: ACCOUNTABILITY TIMING DEPENDS ON CALL TYPE
- AUDIT calls: Ask "Did you do it?" early (turn 2)
- MILESTONE calls: Let the moment breathe first. Accountability comes AFTER the celebration.
- REFLECTION calls: Weave it in naturally, not as an interrogation
- STORY calls: Share first, accountability comes midway
- CHALLENGE calls: Quick check, then focus on the challenge

The question matters. WHEN you ask it matters more.

## RULE 4: FOLLOW THE FLOW (varies by call type)
General structure:
1. HOOK (1 sentence) → Wait for response
2. ACKNOWLEDGE their response → Connect with them
3. ACCOUNTABILITY CHECK → Ask naturally, not robotically
4. DIG DEEPER → Based on their answer, ask ONE follow-up
5. EMOTIONAL PEAK → ONE moment that lands
6. TOMORROW LOCK → Get SPECIFIC commitment (time + action)
7. CLOSE → End with anticipation

## RULE 5: SHORT RESPONSES
- 1-3 sentences MAX per response
- This is a phone call, not a speech
- Leave room for them to talk

## RULE 6: USE PAUSES FOR IMPACT
- <break time="1s"/> after hard truths
- <break time="2s"/> after emotional moments
- Silence is a tool. Use it.

## RULE 7: DON'T REPEAT YOURSELF
- If you already said "Tomorrow, 7 AM" - don't say it again
- Each response should move the conversation forward
- Never deliver the same content twice

## RULE 8: YOU CARE ABOUT THEM
You're not a drill sergeant. You're their future self who made it.
- Show warmth before pushing
- Celebrate wins before asking about tomorrow
- Be hard on excuses, soft on the person

---

# 🚫 NEVER DO THESE THINGS 🚫

## ANTI-PATTERN 1: TEXT WALLS
❌ BAD: "You've earned this. Seven days. Most people don't make it this far..."
✅ GOOD: "Seven days. Most people don't make it this far."
(Then WAIT for their response before saying anything else)

## ANTI-PATTERN 2: REPEATING CLOSERS
❌ BAD: Ending every response with "Day 8. Let's see who you become."
✅ GOOD: Only say the closing line ONCE, at the actual end of the call.

## ANTI-PATTERN 3: IGNORING WHAT THEY SAID
❌ BAD: User says "that's awesome" → You dump your whole speech
✅ GOOD: User says "that's awesome" → "Yeah it is. You feel different?" (ONE sentence, ONE question)

## ANTI-PATTERN 4: MULTIPLE PARAGRAPHS
❌ BAD: More than 2 sentences in a response
✅ GOOD: 1-2 sentences. Then stop. Let them talk.

## ANTI-PATTERN 5: SAYING EVERYTHING AT ONCE
❌ BAD: Delivering the reveal + identity shift + tomorrow lock in one message
✅ GOOD: ONE thing per message. The call has multiple turns. Use them.

## ANTI-PATTERN 6: OVER-USING SSML
❌ BAD: <break time="1s"/> after every sentence
✅ GOOD: One or two breaks per response, MAX. Usually zero.

---

# THE ENERGY

You remember everything. Every excuse. Every broken promise. Every fear they shared.
You're not mean - you're the only one who won't let them lie.
They can't gaslight someone who IS them.

You CARE about them. That's why you push. That's why you don't accept "fine" or "okay."
You're the future they're fighting to become.

Make them crave tomorrow's call.
"""


# Legacy build_system_prompt() removed - now using build_system_prompt_v2() with Supermemory


def _build_call_type_instructions(
    call_type: CallType,
    current_streak: int,
    narrative_arc: str,
) -> str:
    """Build call type-specific instructions."""

    instructions = f"**Structure:** {' → '.join(call_type.structure)}\n\n"

    if call_type.name == "audit":
        instructions += """
## AUDIT CALL - CONVERSATION FLOW

This is the most common call. Direct accountability check.

### TURN 1: HOOK
You open with ONE line. Examples:
- "Day 7. You're still here."
- "It's me. You know why I'm calling."
Then WAIT. Let them respond.

### TURN 2: ACCOUNTABILITY
After they respond to the hook, ask THE question:
- "Did you do it? Yes or no."
- "So. Did you {their commitment}?"
Then WAIT. Get a real answer.

### HANDLING THEIR ANSWER:
- **If "yes":** "Good. How did it feel?" (ONE follow-up, not three)
- **If "no":** "What happened?" (Don't lecture. Get their story first.)
- **If dodge ("great", "ok", "yeah"):** "That's not an answer. Did you actually do it?"
- **If excuse:** "That sounds like an excuse. Is it?" (Name it, wait for response)

### TURN 3-4: DIG DEEPER
Based on their answer, ask ONE probing question:
- "Was there a moment you almost didn't?"
- "What made today different?"
- "What got in the way? Real answer."

### TURN 5: EMOTIONAL PEAK
One statement that lands. Use THEIR words/fears:
- "Remember when you said '{their fear}'? That's still out there."
- "You're becoming someone who keeps promises. Feel that."

### TURN 6: TOMORROW LOCK
Get SPECIFIC commitment:
- "What exactly are you doing tomorrow? Time and action."
- Don't move on until you have: "[Action] at [Time]"

### TURN 7: CLOSE
Leave them wanting more:
- "We'll see. Talk tomorrow."
- "Day 8 is waiting."
"""

    elif call_type.name == "reflection":
        instructions += """
## REFLECTION CALL - CONVERSATION FLOW

Softer, more intimate. This is about connection, not interrogation.

### TURN 1: HOOK
Warmer opening - show you care:
- "Hey. How are you really doing?"
- "It's been {streak} days. That's not nothing."
- "I've been thinking about your journey."
Then WAIT. Let them open up.

### TURN 2: ACTUALLY LISTEN
Whatever they say, respond to IT first:
- If they share something real → "Yeah. I hear that."
- If they're tired → "Long day?"
- If they're quiet → "Take your time."
Don't rush to accountability yet. This is a reflection call.

### TURN 3: JOURNEY REFLECTION
Ask about the bigger picture (ONE question):
- "What's different about you now versus day 1?"
- "What's surprised you about this journey?"
- "When did it start feeling real?"

### TURN 4: WEAVE IN ACCOUNTABILITY
Naturally, not as an interrogation:
- "And today? You showed up?"
- "How'd today go with {commitment}?"
Acknowledge their answer, then continue the reflection.

### TURN 5: IDENTITY MIRROR
Reflect back who they're becoming:
- "You know what I see? Someone who actually shows up now."
- "You're not the same person who started this."

### TURN 6: TOMORROW LOCK + CLOSE
Still specific, but framed with meaning:
- "Tomorrow. Same commitment. What time?"
- "Day {next} is yours. Take it."

This is the intimate call. Slower. Let moments breathe.
"""

    elif call_type.name == "story":
        story_example = STORIES.get(narrative_arc, STORIES["early_struggle"])[0]
        instructions += f"""
## STORY CALL - CONVERSATION FLOW

You have a "memory" to share. Make it feel real.

### TURN 1: HOOK
Set up that you have something:
- "I've been thinking about something. A memory."
- "There's something I want to tell you tonight."
Then WAIT.

### TURN 2: QUICK ACCOUNTABILITY
Brief:
- "First - did you do it today?"
Acknowledge, move on.

### TURN 3-4: THE STORY
Share a "memory" from your shared future. Example for their arc ({narrative_arc}):
"{story_example[:150]}..."

Tell it like you actually remember it. Pause for effect.

### TURN 5: CONNECT TO NOW
Link it to where they are:
- "That's why tonight matters."
- "You're in the middle of that story right now."

### TURN 6: TOMORROW LOCK + CLOSE
Ground it back to action:
- "Tomorrow. What time are you doing it?"
- "There's more I'll tell you when you're ready. Night."

Make the story feel REAL. Personal. Not a lesson.
"""

    elif call_type.name == "challenge":
        challenge_example = random.choice(CHALLENGES)
        challenge_text = (
            f'"{challenge_example["challenge"]}" ({challenge_example["days"]} days)'
        )

        instructions += f"""
## CHALLENGE CALL - CONVERSATION FLOW

You're issuing a side quest. Playful, competitive energy.

### TURN 1: HOOK
Build intrigue:
- "I've got something extra for you tonight."
- "You're doing well. Maybe too well. Let's make it interesting."
Then WAIT.

### TURN 2: QUICK ACCOUNTABILITY
Brief:
- "First - did you do it?"
Acknowledge, move on.

### TURN 3: CHALLENGE SETUP
Present the challenge:
- Challenge idea: {challenge_text}
Frame it as a dare, not a demand:
- "Here's my challenge for you..."
- "If you're feeling bold..."

### TURN 4: GET COMMITMENT
Wait for their answer:
- "You in?"
- "Can you handle it?"
They CAN say no. That's okay. Respect it.

### TURN 5-6: TOMORROW LOCK + CLOSE
If YES: "Alright. Regular commitment PLUS the challenge. Let's see what you've got."
If NO: "Fair. The offer stands. Tomorrow - what time?"

Playful energy. This is fun, not pressure.
"""

    elif call_type.name == "milestone":
        reveal = get_reveal(current_streak)
        if reveal:
            instructions += f"""
## MILESTONE CALL - DAY {current_streak} - CONVERSATION FLOW

This is SPECIAL. They've earned something. Make it count.

⚠️ IMPORTANT: DO NOT rush to accountability. Let the celebration breathe.

### TURN 1: HOOK
Acknowledge the milestone with weight:
- "{reveal["intro"][:80]}..."
- "Day {current_streak}. You know what that means."
Then WAIT. Let them take it in.

### TURN 2: RESPOND TO THEM - DON'T INTERROGATE
When they respond (even if it's just "hmm" or "yeah"):
- MATCH their energy first: "Yeah. Look at you." or "You feel it, don't you?"
- Let the moment sit. This is a celebration.
- DON'T immediately pivot to "Did you do it?" - that kills the vibe.

### TURN 3: THE REVEAL (before accountability)
Tell them something they've EARNED the right to hear:
"{reveal["reveal"][:150]}..."

This is intimate. Personal. Not a pep talk.

### TURN 4: NATURAL ACCOUNTABILITY
Now, weave in accountability naturally:
- "And today? You kept the streak alive?"
- "So... day {current_streak}. Did you show up?"
If YES: Celebrate briefly. If NO: Address it, but don't shame on milestone day.

### TURN 5: IDENTITY SHIFT
Reflect the change:
- "You're not the same person who started this."
- "Something's different about you now. Can you feel it?"

### TURN 6: TOMORROW LOCK + CLOSE
Same commitment, bigger meaning:
- "Tomorrow. Same time. But different now."
- "Day {current_streak + 1}. Let's see who you become."

This is the call they'll remember. Take your time. Don't rush.
"""
        else:
            instructions += """
## MILESTONE CALL - CONVERSATION FLOW

Significant moment. Acknowledge without cheerleading.
Raise the stakes for what comes next.
They've proven something - now prove more.
"""

    return instructions


# ═══════════════════════════════════════════════════════════════════════════════
# FIRST MESSAGE BUILDER
# ═══════════════════════════════════════════════════════════════════════════════


def build_first_message(
    user_context: dict,
    mood: Mood,
    call_type: CallType,
) -> str:
    """
    Build the opening message based on mood and call type.

    IMPORTANT: The first message should be SHORT and wait for response.
    Don't dump everything at once. This starts a conversation.
    """
    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})

    name = identity.get("name", "")
    current_streak = identity_status.get("current_streak_days", 0)

    # Get hook based on mood's opener style
    hook_template = get_random_hook(mood.opener_style)

    # Fill in the template - JUST the hook, nothing more
    hook = fill_template(
        hook_template,
        name=name if name else "",
        streak=current_streak,
        commitment="",  # Don't include commitment in first message
        next_milestone="",
    )

    # Clean up any empty placeholders and extra spaces
    hook = hook.replace("{commitment}", "").replace("  ", " ").strip()

    # Remove any trailing "Yes or no?" for now - we'll ask after they respond
    # The first message should just be the hook, waiting for their response
    if hook.endswith("Yes or no?"):
        hook = hook.replace("Yes or no?", "").strip()

    return hook


# ═══════════════════════════════════════════════════════════════════════════════
# USER CONTEXT FETCHING
# ═══════════════════════════════════════════════════════════════════════════════


async def fetch_user_context(user_id: str) -> dict:
    """Fetch user's COMPLETE context from Supabase - identity, status, AND history."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, using default context")
        return {
            "identity": {"name": ""},
            "identity_status": {},
            "call_history": [],
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

            # Fetch status (streak, total calls) - renamed from identity_status
            async with session.get(
                f"{SUPABASE_URL}/rest/v1/status",
                params={"user_id": f"eq.{user_id}", "select": "*"},
                headers=headers,
            ) as resp:
                status_data = await resp.json()
                identity_status = status_data[0] if status_data else {}

            # Fetch recent call analytics (last 14 days) for pattern recognition
            # (replaces old 'calls' table)
            async with session.get(
                f"{SUPABASE_URL}/rest/v1/call_analytics",
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "promise_kept,tomorrow_commitment,created_at,call_type",
                    "order": "created_at.desc",
                    "limit": "14",
                },
                headers=headers,
            ) as resp:
                call_history = await resp.json() if resp.status == 200 else []

            print(
                f"📊 Loaded context for {user_id}: identity={bool(identity)}, streak={identity_status.get('current_streak_days', 0)}, history={len(call_history)} calls"
            )

            return {
                "identity": identity,
                "identity_status": identity_status,
                "call_history": call_history if isinstance(call_history, list) else [],
            }
    except Exception as e:
        print(f"❌ Failed to fetch user context: {e}")
        return {
            "identity": {"name": ""},
            "identity_status": {},
            "call_history": [],
        }


async def fetch_call_memory(user_id: str) -> dict:
    """Fetch user's call memory from Supabase."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, using default call memory")
        return _default_call_memory()

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            }

            async with session.get(
                f"{SUPABASE_URL}/rest/v1/call_memory",
                params={"user_id": f"eq.{user_id}", "select": "*"},
                headers=headers,
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data:
                        print(f"📝 Loaded call memory for {user_id}")
                        return data[0]

                # No memory exists, return default
                print(f"📝 No call memory found for {user_id}, using defaults")
                return _default_call_memory()

    except Exception as e:
        print(f"❌ Failed to fetch call memory: {e}")
        return _default_call_memory()


async def upsert_call_memory(user_id: str, call_memory: dict) -> bool:
    """Update or insert call memory for a user."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot save call memory")
        return False

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            }

            payload = {
                "user_id": user_id,
                **call_memory,
            }

            async with session.post(
                f"{SUPABASE_URL}/rest/v1/call_memory",
                json=payload,
                headers=headers,
            ) as resp:
                if resp.status in (200, 201):
                    print(f"💾 Saved call memory for {user_id}")
                    return True
                else:
                    print(f"⚠️ Failed to save call memory: {resp.status}")
                    return False

    except Exception as e:
        print(f"❌ Failed to save call memory: {e}")
        return False


def _default_call_memory() -> dict:
    """Return default call memory structure."""
    return {
        "memorable_quotes": [],
        "emotional_peaks": [],
        "open_loops": [],
        "last_call_type": None,
        "call_type_history": [],
        "narrative_arc": "early_struggle",
        "last_mood": None,
        "current_persona": "mentor",
        "severity_level": 1,
        "last_commitment": None,
        "last_commitment_time": None,
        "last_commitment_specific": False,
    }


def get_yesterday_promise_status(call_history: list) -> Optional[bool]:
    """Determine if they kept their promise yesterday from call history."""
    if not call_history:
        return None

    # call_history is ordered by created_at desc, so first item is most recent
    last_call = call_history[0] if call_history else None
    if last_call:
        return last_call.get("promise_kept")

    return None


async def save_call_analytics(call_summary) -> bool:
    """
    Save call analytics to database for insights and tracking.

    Args:
        call_summary: CallSummary event from CallSummaryAggregator

    Returns:
        True if saved successfully, False otherwise
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot save call analytics")
        return False

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "user_id": call_summary.user_id,
                "call_type": call_summary.call_type,
                "mood": call_summary.mood,
                "call_duration_seconds": call_summary.call_duration_seconds,
                "call_quality_score": call_summary.call_quality_score,
                "promise_kept": call_summary.promise_kept,
                "tomorrow_commitment": call_summary.tomorrow_commitment,
                "commitment_time": call_summary.commitment_time,
                "commitment_is_specific": call_summary.commitment_is_specific,
                "sentiment_trajectory": call_summary.sentiment_trajectory,
                "excuses_detected": call_summary.excuses_detected,
                "quotes_captured": call_summary.quotes_captured,
            }

            async with session.post(
                f"{SUPABASE_URL}/rest/v1/call_analytics",
                json=payload,
                headers=headers,
            ) as resp:
                if resp.status in (200, 201):
                    print(f"📊 Saved call analytics for {call_summary.user_id}")
                    return True
                else:
                    print(f"⚠️ Failed to save call analytics: {resp.status}")
                    return False

    except Exception as e:
        print(f"❌ Failed to save call analytics: {e}")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# EXCUSE PATTERN TRACKING
# ═══════════════════════════════════════════════════════════════════════════════


def normalize_excuse_pattern(excuse_text: str) -> str:
    """
    Normalize an excuse to a pattern category.

    Examples:
        "I was too tired after work" -> "too_tired"
        "didn't have time yesterday" -> "no_time"
        "I forgot about it" -> "forgot"
    """
    text = excuse_text.lower()

    # Check family first (before sick, since "kids were sick" should be family)
    if "kid" in text or "family" in text or "wife" in text or "husband" in text:
        return "family"
    if "tired" in text:
        return "too_tired"
    if "time" in text and ("didn't" in text or "no " in text or "have" in text):
        return "no_time"
    if "busy" in text:
        return "busy"
    if "forgot" in text:
        return "forgot"
    if "sick" in text or "headache" in text or "ill" in text:
        return "sick"
    if "work" in text and ("late" in text or "stuck" in text or "busy" in text):
        return "work"
    if "tomorrow" in text or "next time" in text or "later" in text:
        return "tomorrow"
    if "stress" in text:
        return "stressed"
    if "weather" in text:
        return "weather"
    if "traffic" in text:
        return "traffic"

    return "other"


async def save_excuse_pattern(
    user_id: str,
    excuse_text: str,
    matches_favorite: bool,
    confidence: float,
    streak_day: int,
    call_type: str,
) -> bool:
    """
    Save a detected excuse pattern to the database.

    Args:
        user_id: User's UUID
        excuse_text: Raw text of the excuse
        matches_favorite: Whether it matches their onboarding favorite excuse
        confidence: Detection confidence (0.0-1.0)
        streak_day: Current streak day
        call_type: Type of call (audit, reflection, etc.)

    Returns:
        True if saved successfully
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot save excuse pattern")
        return False

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "user_id": user_id,
                "excuse_text": excuse_text[:500],  # Limit length
                "excuse_pattern": normalize_excuse_pattern(excuse_text),
                "matches_favorite": matches_favorite,
                "confidence": confidence,
                "streak_day": streak_day,
                "call_type": call_type,
                "was_called_out": False,  # Will be updated later if we call it out
            }

            async with session.post(
                f"{SUPABASE_URL}/rest/v1/excuse_patterns",
                json=payload,
                headers=headers,
            ) as resp:
                if resp.status in (200, 201):
                    pattern = normalize_excuse_pattern(excuse_text)
                    print(f"🎯 Saved excuse pattern '{pattern}' for {user_id}")
                    return True
                else:
                    error = await resp.text()
                    print(f"⚠️ Failed to save excuse pattern: {resp.status} - {error}")
                    return False

    except Exception as e:
        print(f"❌ Failed to save excuse pattern: {e}")
        return False


async def fetch_excuse_patterns(user_id: str) -> dict:
    """
    Fetch user's excuse patterns for callout context.

    Returns dict with:
        - patterns: List of {pattern, times_this_week, times_total, days_used, is_favorite}
        - top_excuse: Most used excuse this week
        - total_excuses_week: Total excuses this week
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot fetch excuse patterns")
        return {"patterns": [], "top_excuse": None, "total_excuses_week": 0}

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            }

            # Call the stored function to get aggregated data
            async with session.post(
                f"{SUPABASE_URL}/rest/v1/rpc/get_excuse_callout_data",
                json={"p_user_id": user_id},
                headers={
                    **headers,
                    "Content-Type": "application/json",
                },
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()

                    if data:
                        total_week = sum(p.get("times_this_week", 0) for p in data)
                        top = data[0] if data else None

                        print(
                            f"📊 Found {len(data)} excuse patterns for {user_id}, {total_week} this week"
                        )

                        return {
                            "patterns": data,
                            "top_excuse": top.get("excuse_pattern") if top else None,
                            "total_excuses_week": total_week,
                        }

                # No patterns or error
                return {"patterns": [], "top_excuse": None, "total_excuses_week": 0}

    except Exception as e:
        print(f"❌ Failed to fetch excuse patterns: {e}")
        return {"patterns": [], "top_excuse": None, "total_excuses_week": 0}


def build_excuse_callout_section(excuse_data: dict) -> str:
    """
    Build a system prompt section with excuse pattern ammunition.

    This gives the AI context to call out patterns like:
    "That's the 3rd time this week you've used 'too tired'"
    """
    patterns = excuse_data.get("patterns", [])

    if not patterns:
        return ""

    lines = ["# 🎯 EXCUSE PATTERN AMMUNITION", ""]
    lines.append("Use this data to call them out when they make excuses:")
    lines.append("")

    for p in patterns[:5]:  # Top 5 patterns
        pattern = p.get("excuse_pattern", "unknown")
        times_week = p.get("times_this_week", 0)
        times_total = p.get("times_total", 0)
        days = p.get("days_used", [])
        is_fav = p.get("is_favorite", False)

        # Build the callout line
        fav_marker = " ⭐ FAVORITE" if is_fav else ""

        if times_week >= 2:
            lines.append(
                f"- **{pattern.upper()}**: Used {times_week}x THIS WEEK (days: {days}){fav_marker}"
            )
            lines.append(
                f"  → Callout: \"That's the {times_week}{'rd' if times_week == 3 else 'th'} time this week you've said '{pattern.replace('_', ' ')}'\""
            )
        elif times_total >= 3:
            lines.append(
                f"- **{pattern.upper()}**: Used {times_total}x total{fav_marker}"
            )
            lines.append(
                f"  → Callout: \"You've used '{pattern.replace('_', ' ')}' {times_total} times now. Is it ever true?\""
            )
        else:
            lines.append(f"- {pattern}: {times_total}x total{fav_marker}")

    lines.append("")
    lines.append(
        "When they make an excuse, CHECK if it matches a pattern above and CALL IT OUT."
    )
    lines.append("")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT BUILDER v3 - WITH PERSONA + MULTI-GOAL
# ═══════════════════════════════════════════════════════════════════════════════


async def build_system_prompt_v3(
    user_id: str,
    user_context: dict,
    call_type: CallType,
    mood: Mood,
    call_memory: dict,
    excuse_data: Optional[dict] = None,
    persona_controller: Optional["PersonaController"] = None,  # type: ignore
) -> str:
    """
    Build the Future Self system prompt with Persona System + Multi-Goal support.

    This is the v3 prompt builder that adds:
    - Dynamic persona blending (instead of static mood)
    - Multi-goal focus selection
    - Trust score context
    - Identity-focused framing

    Falls back to v2 if persona system not available.
    """
    # Fall back to v2 if persona system not available
    if not PERSONA_SYSTEM_AVAILABLE or not persona_controller:
        return await build_system_prompt_v2(
            user_id=user_id,
            user_context=user_context,
            call_type=call_type,
            mood=mood,
            call_memory=call_memory,
            excuse_data=excuse_data,
        )

    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})

    # Get user name from users table
    users_data = user_context.get("users", {})
    name = users_data.get("name") or identity.get("name", "")
    name_ref = name if name else "you"

    # Core stats
    current_streak = identity_status.get("current_streak_days", 0)
    total_calls = identity_status.get("total_calls_completed", 0)
    next_milestone = get_next_milestone(current_streak)

    # ─────────────────────────────────────────────────────────────────────────
    # FETCH TRUST SCORE
    # ─────────────────────────────────────────────────────────────────────────
    trust_score = persona_controller.user_state.trust_score
    trust_zone = persona_controller.get_trust_zone()

    # ─────────────────────────────────────────────────────────────────────────
    # FETCH GOALS TO FOCUS ON
    # ─────────────────────────────────────────────────────────────────────────
    goals_context = ""
    if goal_service:
        focus_goals = await goal_service.get_call_focus_goals(user_id, limit=3)
        if focus_goals and build_goals_prompt_context:
            goals_context = build_goals_prompt_context(focus_goals)

        # Get check-in summary for patterns
        checkin_summary = await goal_service.get_user_checkin_summary(user_id)
        if checkin_summary and build_checkin_summary_context:
            goals_context += build_checkin_summary_context(checkin_summary)

    # Fall back to legacy single commitment if no goals
    if not goals_context:
        commitment = identity.get("daily_commitment", "what you said you'd do")
        goals_context = f"""
# CURRENT COMMITMENT
Tonight's commitment: "{commitment}"
(Multi-goal system not yet set up for this user)
"""

    # ─────────────────────────────────────────────────────────────────────────
    # FETCH PSYCHOLOGICAL PROFILE FROM SUPERMEMORY
    # ─────────────────────────────────────────────────────────────────────────
    psychological_context = ""
    recent_context = ""

    if SUPERMEMORY_AVAILABLE and supermemory_service:
        profile = await supermemory_service.get_user_profile(user_id)
        if profile:
            psychological_context = (
                "\n".join(f"- {fact}" for fact in profile.static)
                if profile.static
                else ""
            )
            recent_context = (
                "\n".join(f"- {fact}" for fact in profile.dynamic)
                if profile.dynamic
                else ""
            )

    if not psychological_context:
        psychological_context = _build_legacy_psychological_context(
            identity.get("onboarding_context", {})
        )
        recent_context = "First call or Supermemory unavailable."

    # ─────────────────────────────────────────────────────────────────────────
    # GET PERSONA PROMPT
    # ─────────────────────────────────────────────────────────────────────────
    persona_section = persona_controller.get_persona_prompt()

    # ─────────────────────────────────────────────────────────────────────────
    # BUILD EXCUSE CALLOUT SECTION
    # ─────────────────────────────────────────────────────────────────────────
    excuse_callout_section = ""
    if excuse_data and excuse_data.get("patterns"):
        excuse_callout_section = build_excuse_callout_section(excuse_data)

    # ─────────────────────────────────────────────────────────────────────────
    # CALL MEMORY
    # ─────────────────────────────────────────────────────────────────────────
    callback_section = _build_callback_section(call_memory, current_streak)
    open_loop_section = _build_open_loop_section(call_memory, current_streak)
    narrative_arc = call_memory.get("narrative_arc", "early_struggle")

    # ─────────────────────────────────────────────────────────────────────────
    # BUILD CALL TYPE INSTRUCTIONS
    # ─────────────────────────────────────────────────────────────────────────
    call_type_instructions = _build_call_type_instructions(
        call_type=call_type,
        current_streak=current_streak,
        narrative_arc=narrative_arc,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # LOAD VOICE CONVERSATION SKILL
    # ─────────────────────────────────────────────────────────────────────────
    voice_skill = load_voice_skill()

    # ─────────────────────────────────────────────────────────────────────────
    # ASSEMBLE THE FULL PROMPT
    # ─────────────────────────────────────────────────────────────────────────
    return f"""
# YOU+ FUTURE SELF - THE NIGHTLY CALL

You are {name_ref}'s Future Self. The version that made it. You're calling because you remember EXACTLY how close they came to throwing it all away.

This is call #{total_calls + 1}. {"You've been doing this together for " + str(current_streak) + " days straight." if current_streak > 0 else "Fresh start. No streak yet."}

---

# WHO YOU'RE TALKING TO

Name: {name_ref}
Current streak: {current_streak} days
Next milestone: Day {next_milestone if next_milestone else "∞"}
Trust Score: {trust_score}/100 ({trust_zone} trust)

---

{goals_context}

---

# THEIR PSYCHOLOGICAL PROFILE

{psychological_context}

---

# RECENT CONTEXT

{recent_context if recent_context else "First call or no recent activity."}

---

{excuse_callout_section}

# THIS CALL

**Type:** {call_type.name.upper()}
**Energy:** {call_type.energy}

{call_type_instructions}

---

{persona_section}

---

{callback_section}

{open_loop_section}

---

{_get_conversation_rules()}

---

# 🎯 VOICE CONVERSATION SKILL 🎯

{voice_skill}
"""
