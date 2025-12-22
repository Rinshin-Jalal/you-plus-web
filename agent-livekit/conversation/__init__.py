"""
Conversation flow modules for the YOU+ Future Self Agent.

v5 Architecture - Behavioral Addiction Engine:
- personality.py - Multi-dimensional personality state
- behavioral_hooks.py - Open loops, callbacks, pattern-calling, identity stakes
- call_types.py - Call type context (objectives, not scripts)
"""

from .call_types import CallType, select_call_type

# v5: Personality System
from .personality import (
    PersonalityState,
    calculate_personality_state,
    build_personality_prompt,
    get_relationship_phase,
    EMOTIONAL_WEATHERS,
    RELATIONSHIP_PHASES,
)

# v5: Behavioral Hooks (addiction engine)
from .behavioral_hooks import (
    build_behavioral_hooks_section,
    select_open_loop,
    build_callback_prompt_section,
    build_pattern_prompt_section,
    build_identity_stakes_section,
    get_prophecy,
)

# Future self / Dynamic Pillars
from .pillars import (
    PillarState,
    FutureSelf,
    LanguageMode,
    get_dark_fuel_prompt,
)

__all__ = [
    # Call types
    "CallType",
    "select_call_type",
    # v5: Personality System
    "PersonalityState",
    "calculate_personality_state",
    "build_personality_prompt",
    "get_relationship_phase",
    "EMOTIONAL_WEATHERS",
    "RELATIONSHIP_PHASES",
    # v5: Behavioral Hooks
    "build_behavioral_hooks_section",
    "select_open_loop",
    "build_callback_prompt_section",
    "build_pattern_prompt_section",
    "build_identity_stakes_section",
    "get_prophecy",
    # Future self / Dynamic Pillars
    "PillarState",
    "FutureSelf",
    "LanguageMode",
    "get_dark_fuel_prompt",
]
