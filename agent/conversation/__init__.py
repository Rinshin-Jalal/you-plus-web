"""Conversation flow modules for the YOU+ Future Self Agent."""

from .call_types import CallType, select_call_type
from .mood import Mood, select_mood
from .stages import CallStage, StageConfig, get_stage_prompt, get_next_stage
from .persona import (
    PersonaType,
    PersonaConfig,
    PersonaController,
    PersonaEvent,
    ExcuseDetected,
    SentimentShift,
    PromiseKept,
    PromiseBroken,
    PatternAlert,
)
from .identity_questions import get_identity_question

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
    "PersonaType",
    "PersonaConfig",
    "PersonaController",
    "PersonaEvent",
    "ExcuseDetected",
    "SentimentShift",
    "PromiseKept",
    "PromiseBroken",
    "PatternAlert",
    # Identity questions
    "get_identity_question",
]
