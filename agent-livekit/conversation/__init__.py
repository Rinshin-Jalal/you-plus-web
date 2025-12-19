"""Conversation flow modules for the YOU+ Future Self Agent."""

from .call_types import CallType, select_call_type
from .mood import Mood, select_mood
from .stages import CallStage, StageConfig, get_stage_prompt, get_next_stage
from .persona import (
    Persona,
    PersonaConfig,
    PersonaController,
    UserState,
)
from .identity_questions import (
    # Original question functions
    get_accountability_question,
    get_followup_question,
    get_identity_statement,
    get_challenge_statement,
    get_task_question,
    get_multi_goal_transition,
    get_compound_win_celebration,
    get_mixed_results_statement,
    get_streak_celebration,
    # Pillar-based accountability (5 Pillars System)
    get_pillar_accountability_question,
    get_pillar_win_statement,
    get_pillar_broken_statement,
    get_pillar_transition,
    get_all_pillars_win_statement,
    get_pillar_focus_intro,
)
from .future_self import (
    Pillar,
    PillarConfig,
    PillarState,
    FutureSelf,
    ACTIONABLE_PILLARS,
    PILLAR_CONFIGS,
    LanguageMode,
    get_language_mode,
    get_pillar_question,
    get_pillar_identity_statement,
    get_compound_win_statement,
    get_dark_fuel_prompt,
)

__all__ = [
    # Call types
    "CallType",
    "select_call_type",
    # Mood
    "Mood",
    "select_mood",
    # Stages
    "CallStage",
    "StageConfig",
    "get_stage_prompt",
    "get_next_stage",
    # Persona system
    "Persona",
    "PersonaConfig",
    "PersonaController",
    "UserState",
    # Identity questions (original)
    "get_accountability_question",
    "get_followup_question",
    "get_identity_statement",
    "get_challenge_statement",
    "get_task_question",
    "get_multi_goal_transition",
    "get_compound_win_celebration",
    "get_mixed_results_statement",
    "get_streak_celebration",
    # Pillar-based accountability (5 Pillars System)
    "get_pillar_accountability_question",
    "get_pillar_win_statement",
    "get_pillar_broken_statement",
    "get_pillar_transition",
    "get_all_pillars_win_statement",
    "get_pillar_focus_intro",
    # Future self / 5 Pillars
    "Pillar",
    "PillarConfig",
    "PillarState",
    "FutureSelf",
    "ACTIONABLE_PILLARS",
    "PILLAR_CONFIGS",
    "LanguageMode",
    "get_language_mode",
    "get_pillar_question",
    "get_pillar_identity_statement",
    "get_compound_win_statement",
    "get_dark_fuel_prompt",
]
