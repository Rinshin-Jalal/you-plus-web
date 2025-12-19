"""
Stages Package
==============

Call Stages - State machine for conversation flow.

Each stage has:
- A focused prompt (what to do in THIS stage)
- Transition rules (AI decides when to move on)
- Max turns (safety valve - don't get stuck)
- Mood modifiers (different moods affect pacing)

Stages:
1. HOOK - Open with one line, wait for response
2. ACKNOWLEDGE - Respond to what they said, connect
3. ACCOUNTABILITY - Ask "did you do it?" get YES/NO
4. DIG_DEEPER - Follow up based on their answer
5. PEAK - One emotional moment that lands
6. TOMORROW_LOCK - Get specific commitment (time + action)
7. CLOSE - End with anticipation
"""

# Models
from .models import (
    CallStage,
    MoodModifiers,
    StageConfig,
)

# Config
from .config import (
    MOOD_STAGE_MODIFIERS,
    STAGE_PROMPTS,
    TRANSITION_DETECTOR_PROMPT,
)

# Transitions & helpers
from .transitions import (
    get_stage_prompt,
    get_stage_config,
    get_next_stage,
    get_stage_max_turns,
    get_mood_extra_prompt,
    get_mood_transition_speed,
    get_stage_prompt_with_mood,
    build_transition_check_prompt,
    should_advance_stage,
)

__all__ = [
    # Models
    "CallStage",
    "MoodModifiers",
    "StageConfig",
    # Config
    "MOOD_STAGE_MODIFIERS",
    "STAGE_PROMPTS",
    "TRANSITION_DETECTOR_PROMPT",
    # Transitions & helpers
    "get_stage_prompt",
    "get_stage_config",
    "get_next_stage",
    "get_stage_max_turns",
    "get_mood_extra_prompt",
    "get_mood_transition_speed",
    "get_stage_prompt_with_mood",
    "build_transition_check_prompt",
    "should_advance_stage",
]
