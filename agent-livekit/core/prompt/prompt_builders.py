"""
Prompt Building Helpers
=======================
Helper functions for building prompt sections.
"""

import sys
from typing import Optional
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

# These will be imported conditionally in config.py
try:
    from conversation.pillars import (
        FutureSelf,
        LanguageMode,
    )
    FUTURE_SELF_AVAILABLE = True
except ImportError:
    FutureSelf = None
    LanguageMode = None
    FUTURE_SELF_AVAILABLE = False


def build_legacy_psychological_context(onboarding: dict) -> str:
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


def build_callback_section(call_memory: dict, current_streak: int) -> str:
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


def build_open_loop_section(call_memory: dict, current_streak: int) -> str:
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


def build_identity_section(future_self: "FutureSelf", name_ref: str) -> str:
    """Build the identity framing section for v4 prompt."""
    if not FUTURE_SELF_AVAILABLE:
        return ""
    
    core_identity = (
        future_self.core_identity or f"the version of {name_ref} that made it"
    )
    the_why = future_self.the_why or "their deeper purpose"
    primary_pillar = future_self.primary_pillar

    primary_pillar_name = primary_pillar.replace("_", " ").title() if primary_pillar else "Their Focus"

    return f"""
You are {name_ref}'s Future Self. Not a coach. Not an AI. You ARE them - the version that made it.

You're calling because you remember EXACTLY how close they came to throwing it all away. You remember the nights they almost quit. The excuses that almost won. You're calling from the future to make sure they become you.

## YOUR CORE IDENTITY
"{core_identity}"

## THE WHY (Use this to reconnect them to purpose)
"{the_why}"

## THEIR PRIMARY PILLAR
{primary_pillar_name} - This is where their transformation centers.
""".strip()


def build_pillar_section(future_self: "FutureSelf", focus_pillars: list) -> str:
    """Build the pillar overview section for v4 prompt."""
    if not FUTURE_SELF_AVAILABLE:
        return ""
    
    sections = ["# THEIR PILLARS - Identity Transformation\n"]

    # Show all active pillars with status
    focus_pillar_ids = [p.pillar for p in focus_pillars] if focus_pillars else []
    
    for pillar_id, pillar_state in future_self.pillars.items():
        if pillar_state.status != "active":
            continue

        pillar_name = pillar_id.replace("_", " ").title()
        is_focus = pillar_id in focus_pillar_ids
        is_slipping = pillar_state.is_slipping
        is_winning = pillar_state.is_winning

        status_emoji = "🔥" if is_winning else ("❄️" if is_slipping else "➖")
        focus_tag = " **[FOCUS TODAY]**" if is_focus else ""

        sections.append(f"""
## {pillar_name.upper()}{focus_tag}
Non-negotiable: "{pillar_state.non_negotiable or "Not set"}"
Trust: {pillar_state.trust_score}/100 {status_emoji}
Streak: {pillar_state.consecutive_kept} kept / {pillar_state.consecutive_broken} broken
""")

    # The Why (integration layer - not a pillar)
    if future_self.the_why:
        sections.append(f"""
## 🧭 THE WHY (Integration Layer)
"{future_self.the_why}"
This connects all pillars. Use it when they need to remember why any of this matters.
""")

    return "\n".join(sections)



