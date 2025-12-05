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
    get_accountability_question,
    get_followup_question,
    get_identity_statement,
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
    # Identity questions
    "get_accountability_question",
    "get_followup_question",
    "get_identity_statement",
]
