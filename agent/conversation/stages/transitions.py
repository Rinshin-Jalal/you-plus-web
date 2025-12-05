"""
Stage Transitions - Helper functions for stage flow
====================================================
"""

from typing import Optional

from conversation.stages.models import CallStage, StageConfig
from conversation.stages.config import (
    STAGE_PROMPTS,
    MOOD_STAGE_MODIFIERS,
    TRANSITION_DETECTOR_PROMPT,
)


def get_stage_prompt(stage: CallStage) -> str:
    """Get the focused prompt for a specific stage."""
    config = STAGE_PROMPTS.get(stage)
    if config:
        return config.prompt
    return ""


def get_stage_config(stage: CallStage) -> Optional[StageConfig]:
    """Get the full config for a stage."""
    return STAGE_PROMPTS.get(stage)


def get_next_stage(current_stage: CallStage) -> Optional[CallStage]:
    """Get the next stage in the conversation flow."""
    config = STAGE_PROMPTS.get(current_stage)
    if config:
        return config.next_stage
    return None


def get_stage_max_turns(stage: CallStage, mood_name: Optional[str] = None) -> int:
    """
    Get max turns for a stage before auto-advancing.

    Args:
        stage: The current stage
        mood_name: Optional mood name to apply modifiers

    Returns:
        Adjusted max_turns based on mood
    """
    config = STAGE_PROMPTS.get(stage)
    if not config:
        return 3

    base_turns = config.max_turns

    # Apply mood modifier if present
    if mood_name and mood_name in MOOD_STAGE_MODIFIERS:
        mood_modifiers = MOOD_STAGE_MODIFIERS[mood_name]
        if stage in mood_modifiers:
            modifier = mood_modifiers[stage]
            base_turns += modifier.max_turns_modifier
            # Ensure at least 1 turn
            base_turns = max(1, base_turns)

    return base_turns


def get_mood_extra_prompt(stage: CallStage, mood_name: str) -> str:
    """
    Get any extra prompt guidance for this mood + stage combination.

    Args:
        stage: The current stage
        mood_name: The current mood name

    Returns:
        Extra prompt text (empty string if none)
    """
    if mood_name not in MOOD_STAGE_MODIFIERS:
        return ""

    mood_modifiers = MOOD_STAGE_MODIFIERS[mood_name]
    if stage not in mood_modifiers:
        return ""

    return mood_modifiers[stage].extra_prompt


def get_mood_transition_speed(stage: CallStage, mood_name: str) -> str:
    """
    Get transition speed for this mood + stage combination.

    Args:
        stage: The current stage
        mood_name: The current mood name

    Returns:
        "slow", "normal", or "fast"
    """
    if mood_name not in MOOD_STAGE_MODIFIERS:
        return "normal"

    mood_modifiers = MOOD_STAGE_MODIFIERS[mood_name]
    if stage not in mood_modifiers:
        return "normal"

    return mood_modifiers[stage].transition_speed


def get_stage_prompt_with_mood(
    stage: CallStage, mood_name: Optional[str] = None
) -> str:
    """
    Get the full stage prompt with mood-specific additions.

    Args:
        stage: The current stage
        mood_name: Optional mood name for extra guidance

    Returns:
        Combined prompt with stage + mood guidance
    """
    base_prompt = get_stage_prompt(stage)

    if not mood_name:
        return base_prompt

    extra = get_mood_extra_prompt(stage, mood_name)
    if not extra:
        return base_prompt

    # Add mood guidance to the prompt
    return f"""{base_prompt}

MOOD GUIDANCE ({mood_name.upper().replace("_", " ")}):
{extra}
"""


def build_transition_check_prompt(
    current_stage: CallStage,
    recent_messages: list[dict],
) -> str:
    """Build the prompt for the AI transition detector."""
    config = STAGE_PROMPTS.get(current_stage)
    if not config or not config.next_stage:
        return ""

    # Format recent conversation (last 4 messages max)
    recent = recent_messages[-4:] if len(recent_messages) > 4 else recent_messages
    conversation_text = ""
    for msg in recent:
        role = msg.get("role", "")
        if role == "model":
            role = "Agent"
        elif role == "user":
            role = "User"

        # Prefer Gemini-style parts but fall back to OpenAI-style content
        content_parts = msg.get("parts")
        if not content_parts:
            raw_content = msg.get("content")
            if isinstance(raw_content, list):
                content_parts = [
                    {"text": part.get("text", "")} for part in raw_content if part is not None
                ]
            else:
                content_parts = [{"text": str(raw_content or "")}]

        if isinstance(content_parts, list) and content_parts:
            text = content_parts[0].get("text", "")
            # Remove stage context from display
            if "[CURRENT STAGE:" in text:
                text = text.split("[CURRENT STAGE:")[0].strip()
        else:
            text = str(content_parts)

        if text:
            conversation_text += f"{role}: {text}\n"

    return TRANSITION_DETECTOR_PROMPT.format(
        current_stage=current_stage.value.upper(),
        next_stage=config.next_stage.value.upper(),
        transition_hint=config.transition_hint,
        recent_conversation=conversation_text.strip(),
    )


def should_advance_stage(
    current_stage: CallStage,
    turns_in_stage: int,
    promise_answered: bool = False,
    commitment_locked: bool = False,
    mood_name: Optional[str] = None,
) -> bool:
    """
    SAFETY VALVE ONLY - Use AI transition detector instead.

    This only triggers if we've hit max turns (conversation stuck).

    Args:
        current_stage: Current conversation stage
        turns_in_stage: Number of turns spent in current stage
        promise_answered: Whether user answered yes/no to accountability
        commitment_locked: Whether tomorrow's commitment is locked
        mood_name: Optional mood name for adjusted max_turns
    """
    max_turns = get_stage_max_turns(current_stage, mood_name)

    # Only advance if we've hit max turns (safety valve)
    if turns_in_stage >= max_turns:
        return True

    # Special cases that are always automatic
    if current_stage == CallStage.HOOK:
        return True  # Always advance after hook

    if current_stage == CallStage.CLOSE:
        return True  # Always end after close

    # For everything else, let the AI decide
    return False
