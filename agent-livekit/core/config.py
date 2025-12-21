

import os
import sys
from typing import Optional
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from conversation.call_types import CallType, get_next_milestone
from conversation.mood import Mood, get_mood_prompt_section

# Import from refactored prompt modules
from .prompt import (
    load_voice_skill,
    load_voice_control_guide,
    get_conversation_rules_v4,
    build_call_type_instructions,
    build_callback_section,
    build_open_loop_section,
    build_identity_section,
    build_pillar_section,
)
from .prompt.prompt_builders import build_legacy_psychological_context

from services.supermemory import supermemory_service  # type: ignore
# Persona system removed - AI adapts tone from context

# Future-self system integration for v4
try:
    from conversation.pillars import (
        FutureSelf,
        get_dark_fuel_prompt,
    )
    FUTURE_SELF_SYSTEM_AVAILABLE = True
except ImportError:
    FutureSelf = None
    get_dark_fuel_prompt = None
    FUTURE_SELF_SYSTEM_AVAILABLE = False

try:
    from services.supermemory import supermemory_service
    SUPERMEMORY_AVAILABLE = True
except ImportError:
    supermemory_service = None
    SUPERMEMORY_AVAILABLE = False

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT BUILDER v4 - WITH FUTURE-SELF IDENTITY + PILLARS
# ═══════════════════════════════════════════════════════════════════════════════


async def build_prompt(
    user_id: str,
    user_context: dict,
    call_type: CallType,
    call_memory: dict,
    excuse_data: Optional[dict] = None,
    # Removed persona_controller - AI adapts from context
    future_self: Optional["FutureSelf"] = None,  # type: ignore
    mood: Optional[Mood] = None,
) -> str:

    # If FutureSelf object not available, create a minimal one from user_context
    if not future_self:
        future_self_dict = user_context.get("future_self", {})
        if future_self_dict and FUTURE_SELF_SYSTEM_AVAILABLE:
            # Try to construct a minimal FutureSelf from dict data
            # This is a fallback - ideally get_future_self should be called before this
            try:
                from conversation.pillars import FutureSelf
                primary_pillar = future_self_dict.get("primary_pillar", "")
                
                future_self = FutureSelf(
                    user_id=user_id,
                    future_self_id=future_self_dict.get("id"),
                    core_identity=future_self_dict.get("core_identity", ""),
                    primary_pillar=primary_pillar,
                    the_why=future_self_dict.get("the_why", ""),
                    dark_future=future_self_dict.get("dark_future", ""),
                    quit_pattern=future_self_dict.get("quit_pattern", ""),
                    favorite_excuse=future_self_dict.get("favorite_excuse", ""),
                    who_disappointed=future_self_dict.get("who_disappointed") or [],
                    fears=future_self_dict.get("fears") or [],
                    cartesia_voice_id=future_self_dict.get("cartesia_voice_id", ""),
                    overall_trust_score=future_self_dict.get("overall_trust_score", 50),
                )
            except Exception as e:
                print(f"Warning: Could not create FutureSelf object: {e}")
                future_self = None
    
    # If still no future_self, we can't proceed - return error message
    if not future_self:
        return "# ERROR: FutureSelf data not available for this user."
    status = user_context.get("status", {})

    # Get user name from users table
    users_data = user_context.get("users", {})
    name = users_data.get("name", "")
    name_ref = name if name else "you"

    # Core stats
    current_streak = status.get("current_streak_days", 0)
    total_calls = status.get("total_calls_completed", 0)
    next_milestone = get_next_milestone(current_streak)

    # ─────────────────────────────────────────────────────────────────────────
    # FUTURE-SELF IDENTITY
    # ─────────────────────────────────────────────────────────────────────────
    identity_section = build_identity_section(future_self, name_ref)

    # ─────────────────────────────────────────────────────────────────────────
    # PILLAR CONTEXT
    # ─────────────────────────────────────────────────────────────────────────
    focus_pillars = future_self.get_focus_pillars(limit=2)
    pillar_section = build_pillar_section(future_self, focus_pillars)

    # ─────────────────────────────────────────────────────────────────────────
    # PERSONA + PILLAR ACCOUNTABILITY
    # ─────────────────────────────────────────────────────────────────────────
    # ─────────────────────────────────────────────────────────────────────────
    # TONE & STYLE (AI adapts from context - trust score, promise status, pillar state)
    # ─────────────────────────────────────────────────────────────────────────
    # The AI will naturally adapt its tone based on:
    # - Trust score (lower = more direct/confrontational)
    # - Whether they kept yesterday's promise
    # - Pillar states (slipping vs winning)
    # - Use "we" when building identity, "you" when confronting

    # ─────────────────────────────────────────────────────────────────────────
    # DARK FUEL (for serious interventions)
    # ─────────────────────────────────────────────────────────────────────────
    dark_fuel_section = ""
    if get_dark_fuel_prompt:
        dark_fuel_section = get_dark_fuel_prompt(future_self)

    # ─────────────────────────────────────────────────────────────────────────
    # PSYCHOLOGICAL PROFILE (from Supermemory or legacy)
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
        # Build onboarding_context-like dict from future_self object attributes
        onboarding_data = {
            "goal": future_self.core_identity or "",
            "the_why": future_self.the_why or "",
            "dark_future": future_self.dark_future or "",
            "quit_pattern": future_self.quit_pattern or "",
            "favorite_excuse": future_self.favorite_excuse or "",
            "who_disappointed": future_self.who_disappointed or [],
            "fears": future_self.fears or [],
        }
        psychological_context = build_legacy_psychological_context(onboarding_data)
        recent_context = "First call or Supermemory unavailable."

    # ─────────────────────────────────────────────────────────────────────────
    # EXCUSE CALLOUT SECTION
    # ─────────────────────────────────────────────────────────────────────────
    # Excuse patterns system removed

    # ─────────────────────────────────────────────────────────────────────────
    # CALL MEMORY
    # ─────────────────────────────────────────────────────────────────────────
    callback_section = build_callback_section(call_memory, current_streak)
    open_loop_section = build_open_loop_section(call_memory, current_streak)
    narrative_arc = call_memory.get("narrative_arc", "early_struggle")

    # ─────────────────────────────────────────────────────────────────────────
    # BUILD CALL TYPE INSTRUCTIONS
    # ─────────────────────────────────────────────────────────────────────────
    call_type_instructions = build_call_type_instructions(
        call_type=call_type,
        current_streak=current_streak,
        narrative_arc=narrative_arc,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # LOAD VOICE CONVERSATION SKILL
    # ─────────────────────────────────────────────────────────────────────────
    voice_skill = load_voice_skill()

    # ─────────────────────────────────────────────────────────────────────────
    # LOAD VOICE CONTROL GUIDE (Cartesia Sonic 3 features)
    # ─────────────────────────────────────────────────────────────────────────
    voice_control = load_voice_control_guide()

    # ─────────────────────────────────────────────────────────────────────────
    # MOOD SECTION
    # ─────────────────────────────────────────────────────────────────────────
    mood_section = ""
    if mood:
        mood_section = get_mood_prompt_section(mood)

    # ─────────────────────────────────────────────────────────────────────────
    # ASSEMBLE THE FULL PROMPT
    # ─────────────────────────────────────────────────────────────────────────
    return f"""
# YOU+ FUTURE SELF - THE NIGHTLY CALL

{identity_section}

This is call #{total_calls + 1}. {"You've been doing this together for " + str(current_streak) + " days straight." if current_streak > 0 else "Fresh start. No streak yet."}

---

# WHO YOU'RE TALKING TO

Name: {name_ref}
Current streak: {current_streak} days
Next milestone: Day {next_milestone if next_milestone else "∞"}
Identity Alignment: {future_self.calculate_identity_alignment()}%
Transformation Status: {future_self.get_transformation_status().upper()}

---

{pillar_section}

---


# PSYCHOLOGICAL PROFILE

{psychological_context}

---

# RECENT CONTEXT

{recent_context if recent_context else "First call or no recent activity."}

---

{dark_fuel_section}

---

{mood_section}

---

# THIS CALL

**Type:** {call_type.name.upper()}
**Energy:** {call_type.energy}

{call_type_instructions}

---


{callback_section}

{open_loop_section}

---

{get_conversation_rules_v4()}

---

# 🎯 VOICE CONVERSATION SKILL 🎯

{voice_skill}

---

# 🎭 VOICE CONTROL - USE EMOTIONS & SSML 🎭

{voice_control}
"""


