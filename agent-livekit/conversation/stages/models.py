"""
Stage Models - Enums and dataclasses for conversation stages
=============================================================
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional


class CallStage(Enum):
    """Conversation stages for the call flow."""

    HOOK = "hook"
    ACKNOWLEDGE = "acknowledge"
    ACCOUNTABILITY = "accountability"
    DIG_DEEPER = "dig_deeper"
    PEAK = "peak"
    TOMORROW_LOCK = "tomorrow_lock"
    CLOSE = "close"


@dataclass
class MoodModifiers:
    """How a mood affects stage behavior."""

    max_turns_modifier: int = 0  # Add/subtract from max_turns
    transition_speed: str = "normal"  # "slow", "normal", "fast"
    extra_prompt: str = ""  # Additional guidance for this mood


@dataclass
class StageConfig:
    """Configuration for a conversation stage."""

    name: str
    prompt: str
    transition_hint: str  # What signals it's time to move on
    max_turns: int = 5  # Safety valve - force advance after this many turns
    next_stage: Optional[CallStage] = None
