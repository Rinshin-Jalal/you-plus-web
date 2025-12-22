"""
Core Configuration - System Prompt Builder
===========================================

v5 Architecture - Behavioral Addiction Engine:
- Personality system (replaces simple moods)
- Behavioral hooks (open loops, callbacks, pattern-calling)
- Conversation objectives (replaces rigid turn-based scripts)
- Identity stakes (making promises matter emotionally)

The goal: Users CRAVE the daily call because it's UNPREDICTABLE and PERSONAL.
"""

import os
import sys
from typing import Optional, Any
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from conversation.call_types import CallType, get_next_milestone, update_narrative_arc

# v5: Personality System
from conversation.personality import (
    calculate_personality_state,
    build_personality_prompt,
    PersonalityState,
)

# v5: Behavioral Hooks
from conversation.behavioral_hooks import (
    build_behavioral_hooks_section,
)

# Import from refactored prompt modules
from .prompt import (
    load_voice_skill,
    load_voice_control_guide,
    get_conversation_rules_v4,
    get_output_formatting_rules,
    get_goals_section,
    get_tools_section,
    build_conversation_objectives,
    build_anti_patterns,
    build_callback_section,
    build_open_loop_section,
    build_identity_section,
    build_pillar_section,
)
from .prompt.prompt_builders import build_legacy_psychological_context

from services.supermemory import supermemory_service  # type: ignore

# Future-self system integration
try:
    from conversation.pillars import (
        FutureSelf,
        PillarState,
        get_dark_fuel_prompt,
    )

    FUTURE_SELF_SYSTEM_AVAILABLE = True
except ImportError:
    FutureSelf = None
    PillarState = None
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
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════


def _convert_pillars_to_dict(pillars_list: list) -> dict:
    """
    Convert a list of pillar dicts from user_context to a Dict[str, PillarState].

    Args:
        pillars_list: List of pillar dictionaries from the database

    Returns:
        Dictionary keyed by pillar ID string, values are PillarState objects
    """
    if not pillars_list or not FUTURE_SELF_SYSTEM_AVAILABLE:
        return {}

    from datetime import datetime

    pillars_dict = {}
    for pillar_data in pillars_list:
        pillar_id = pillar_data.get("pillar", "")
        if not pillar_id:
            continue

        # Parse last_checked_at timestamp
        last_checked = None
        if pillar_data.get("last_checked_at"):
            try:
                last_checked_str = pillar_data["last_checked_at"]
                if isinstance(last_checked_str, str):
                    last_checked = datetime.fromisoformat(
                        last_checked_str.replace("Z", "+00:00")
                    )
                elif isinstance(last_checked_str, datetime):
                    last_checked = last_checked_str
            except (ValueError, AttributeError):
                pass

        # Create PillarState object
        if not PillarState:
            continue
        pillar_state = PillarState(
            pillar=pillar_id,
            pillar_id=pillar_data.get("id"),
            current_state=pillar_data.get("current_state", ""),
            future_state=pillar_data.get("future_state", ""),
            identity_statement=pillar_data.get("identity_statement", ""),
            non_negotiable=pillar_data.get("non_negotiable", ""),
            trust_score=pillar_data.get("trust_score", 50),
            priority=pillar_data.get("priority", 50),
            last_checked_at=last_checked,
            consecutive_kept=pillar_data.get("consecutive_kept", 0),
            consecutive_broken=pillar_data.get("consecutive_broken", 0),
            total_kept=pillar_data.get("total_kept", 0),
            total_checked=pillar_data.get("total_checked", 0),
            status=pillar_data.get("status", "active"),
        )

        pillars_dict[pillar_id] = pillar_state

    return pillars_dict


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT BUILDER v5 - BEHAVIORAL ADDICTION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════


async def build_prompt(
    user_id: str,
    user_context: dict,
    call_type: CallType,
    call_memory: dict,
    future_self: Optional[Any] = None,
    kept_promise_yesterday: Optional[bool] = None,
    recent_promises: Optional[list[dict]] = None,
) -> str:
    """
    Build simple, clean prompt that eliminates hallucinations.
    Uses SIMPLE_PROMPT.md for reliable behavior.
    """
    # Load the simple prompt from file
    simple_prompt_path = Path(__file__).parent / "SIMPLE_PROMPT.md"

    if simple_prompt_path.exists():
        return simple_prompt_path.read_text()

    # Fallback to basic prompt if simple one doesn't exist
    return """
# YOU+ FUTURE SELF - THE NIGHTLY CALL

You are the user's Future Self. Call them to check in on their progress and hold them accountable.
Be supportive but firm. Ask about their promises and progress.
"""
    """
    v5 Prompt Builder - Behavioral Addiction Engine

    Key differences from v4:
    - Personality state (multi-dimensional) instead of simple mood
    - Behavioral hooks (open loops, callbacks, pattern-calling)
    - Conversation objectives (not turn-based scripts)
    - Identity stakes (emotional weight to promises)
    """
    # Build FutureSelf from context if not provided
    if not future_self:
        future_self_dict = user_context.get("future_self", {})
        if future_self_dict and FUTURE_SELF_SYSTEM_AVAILABLE:
            try:
                from conversation.pillars import FutureSelf

                # Convert pillars list from user_context to Dict[str, PillarState]
                pillars_list = user_context.get("pillars", [])
                pillars_dict = _convert_pillars_to_dict(pillars_list)

                future_self = FutureSelf(
                    user_id=user_id,
                    future_self_id=future_self_dict.get("id"),
                    core_identity=future_self_dict.get("core_identity", ""),
                    primary_pillar=future_self_dict.get("primary_pillar", ""),
                    the_why=future_self_dict.get("the_why", ""),
                    dark_future=future_self_dict.get("dark_future", ""),
                    quit_pattern=future_self_dict.get("quit_pattern", ""),
                    favorite_excuse=future_self_dict.get("favorite_excuse", ""),
                    who_disappointed=future_self_dict.get("who_disappointed") or [],
                    fears=future_self_dict.get("fears") or [],
                    cartesia_voice_id=future_self_dict.get("cartesia_voice_id", ""),
                    overall_trust_score=future_self_dict.get("overall_trust_score", 50),
                    pillars=pillars_dict,  # ✅ Now loading pillars!
                )

                print(
                    f"✅ Loaded FutureSelf with {len(pillars_dict)} pillars for {user_id}"
                )
            except Exception as e:
                print(f"Warning: Could not create FutureSelf object: {e}")

    if not future_self:
        return "# ERROR: FutureSelf data not available for this user."

    status = user_context.get("status", {})
    users_data = user_context.get("users", {})
    name = users_data.get("name", "")
    name_ref = name if name else "you"

    # Core stats
    current_streak = status.get("current_streak_days", 0)
    total_calls = status.get("total_calls_completed", 0)
    next_milestone = get_next_milestone(current_streak)
    narrative_arc = update_narrative_arc(current_streak, call_memory)

    # ─────────────────────────────────────────────────────────────────────────
    # v5: CALCULATE PERSONALITY STATE (replaces simple mood)
    # ─────────────────────────────────────────────────────────────────────────
    personality = calculate_personality_state(
        user_context=user_context,
        call_memory=call_memory,
        kept_promise_yesterday=kept_promise_yesterday,
        recent_promises=recent_promises or [],
    )
    personality_section = build_personality_prompt(personality)

    # ─────────────────────────────────────────────────────────────────────────
    # v5: BEHAVIORAL HOOKS (open loops, callbacks, identity stakes)
    # ─────────────────────────────────────────────────────────────────────────
    behavioral_hooks = build_behavioral_hooks_section(
        call_memory=call_memory,
        current_streak=current_streak,
        next_milestone=next_milestone,
        narrative_arc=narrative_arc,
        relationship_phase=personality.relationship_phase,
        kept_promise_yesterday=kept_promise_yesterday,
        frustration=personality.frustration,
        respect=personality.respect,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # v5: CONVERSATION OBJECTIVES (not turn-based scripts)
    # ─────────────────────────────────────────────────────────────────────────
    conversation_objectives = build_conversation_objectives(
        call_type=call_type.name,
        current_streak=current_streak,
        kept_promise_yesterday=kept_promise_yesterday,
        is_quit_zone=personality.is_in_quit_zone,
        relationship_phase=personality.relationship_phase,
    )
    anti_patterns = build_anti_patterns()

    # ─────────────────────────────────────────────────────────────────────────
    # IDENTITY + PILLARS (unchanged from v4)
    # ─────────────────────────────────────────────────────────────────────────
    identity_section = build_identity_section(future_self, name_ref)
    focus_pillars = future_self.get_focus_pillars(limit=2)
    pillar_section = build_pillar_section(future_self, focus_pillars)

    # ─────────────────────────────────────────────────────────────────────────
    # DARK FUEL (for serious interventions)
    # ─────────────────────────────────────────────────────────────────────────
    dark_fuel_section = ""
    if get_dark_fuel_prompt:
        dark_fuel_section = get_dark_fuel_prompt(future_self)

    # ─────────────────────────────────────────────────────────────────────────
    # PSYCHOLOGICAL PROFILE
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
    # VOICE CONTROL
    # ─────────────────────────────────────────────────────────────────────────
    voice_skill = load_voice_skill()
    voice_control = load_voice_control_guide()

    # ─────────────────────────────────────────────────────────────────────────
    # ASSEMBLE THE v5 PROMPT
    # ─────────────────────────────────────────────────────────────────────────
    return f"""
# YOU+ FUTURE SELF - THE NIGHTLY CALL

{identity_section}

---

{get_goals_section()}

---

# User Information

Name: {name_ref}
Current streak: Day {current_streak}
Next milestone: Day {next_milestone if next_milestone else "∞"}
Identity Alignment: {future_self.calculate_identity_alignment()}%
Transformation Status: {future_self.get_transformation_status().upper()}
Relationship Phase: {personality.relationship_phase.upper().replace("_", " ")}
This is call #{total_calls + 1}.

{"⚠️ Yesterday's promise: BROKEN" if kept_promise_yesterday == False else "✅ Yesterday's promise: KEPT" if kept_promise_yesterday == True else "First call or no promise tracked."}

{pillar_section}

# Psychological Profile

{psychological_context}

# Recent Context

{recent_context if recent_context else "First call or no recent activity."}

{dark_fuel_section}

---

{get_output_formatting_rules()}

---

{get_tools_section()}

---

{personality_section}

---

{behavioral_hooks}

---

{conversation_objectives}

{anti_patterns}

---

# 🎭 VOICE CONTROL

{voice_control}
{voice_skill if voice_skill else ""}
"""
