"""
Pre-Call Handler
=================

Handles call validation, user context fetching, call type/mood selection,
and TTS configuration before a call is accepted.
"""

import sys
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from loguru import logger

from line import CallRequest, PreCallResult

from core.config import (
    fetch_user_context,
    fetch_call_memory,
    get_yesterday_promise_status,
    fetch_excuse_patterns,
)
from conversation.call_types import select_call_type
from conversation.mood import select_mood, Mood

# Default voice (fallback if user has no clone)
DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091"


async def handle_call_request(call_request: CallRequest):
    """
    Pre-call handler: validate user, fetch context, select call type/mood, configure TTS.

    Returns:
        PreCallResult if call is accepted, None if rejected
    """
    logger.info(f"Handling call request: {call_request}")

    metadata = call_request.metadata or {}
    user_id = metadata.get("user_id")

    # === CALL REJECTION LOGIC ===

    # Reject if no user_id provided
    if not user_id or user_id == "unknown":
        logger.warning("Rejecting call: no user_id provided")
        return None

    # Fetch user's context from database
    user_context = await fetch_user_context(user_id)
    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})

    # Reject if user doesn't exist
    if not identity:
        logger.warning(f"Rejecting call: user {user_id} not found")
        return None

    # Reject if subscription expired
    subscription_status = identity_status.get("subscription_status")
    if subscription_status == "expired":
        logger.warning(f"Rejecting call: user {user_id} subscription expired")
        return None

    # Reject if user paused calls
    if identity_status.get("calls_paused"):
        logger.warning(f"Rejecting call: user {user_id} has paused calls")
        return None

    # === FETCH CALL MEMORY ===
    call_memory = await fetch_call_memory(user_id)

    # === FETCH EXCUSE PATTERNS ===
    excuse_data = await fetch_excuse_patterns(user_id)

    # === DETERMINE YESTERDAY'S PROMISE STATUS ===
    call_history = user_context.get("call_history", [])
    yesterday_promise_kept = get_yesterday_promise_status(call_history)

    # === SELECT CALL TYPE ===
    current_streak = identity_status.get("current_streak_days", 0)
    call_type = select_call_type(
        user_context=user_context,
        call_memory=call_memory,
        current_streak=current_streak,
    )
    logger.info(f"📞 Selected call type: {call_type.name} ({call_type.energy})")

    # === SELECT MOOD ===
    mood = select_mood(
        user_context=user_context,
        call_memory=call_memory,
        call_type=call_type.name,
        kept_promise_yesterday=yesterday_promise_kept,
    )
    logger.info(f"🎭 Selected mood: {mood.name}")

    # === CONFIGURE CALL ===

    # Get user's cloned voice ID
    voice_id = identity.get("cartesia_voice_id") or DEFAULT_VOICE_ID

    # Get user's preferred language (default to English)
    # Cartesia supports: en, es, fr, de, it, pt, pl, zh, ja, hi, ko
    preferred_language = identity.get("preferred_language", "en")

    # Build experimental voice controls based on mood
    # See: https://docs.cartesia.ai/line/agent-patterns/experimental-emotion
    experimental_controls = {
        "speed": _get_speed_control(mood.speed_ratio),
        "emotion": _get_emotion_controls(mood.emotion_tag),
    }

    logger.info(
        f"Pre-call approved for user {user_id}, voice: {voice_id}, "
        f"language: {preferred_language}, controls: {experimental_controls}"
    )

    # Return PreCallResult with voice config, user_context, call_memory, and selections
    return PreCallResult(
        metadata={
            "user_id": user_id,
            "user_context": user_context,
            "call_memory": call_memory,
            "excuse_data": excuse_data,  # Historical excuse patterns for callouts
            "call_type": call_type.name,  # Serialize to string for metadata
            "mood": mood.name,  # Serialize to string for metadata
            "yesterday_promise_kept": yesterday_promise_kept,
        },
        config={
            "tts": {
                "voice": voice_id,
                "language": preferred_language,
                "__experimental_controls": experimental_controls,
            }
        },
    )


def _get_speed_control(speed_ratio: float) -> str:
    """Map speed_ratio to Cartesia speed control string."""
    if speed_ratio <= 0.8:
        return "slowest"
    elif speed_ratio <= 0.9:
        return "slow"
    elif speed_ratio <= 1.05:
        return "normal"
    elif speed_ratio <= 1.15:
        return "fast"
    else:
        return "fastest"


def _get_emotion_controls(emotion_tag: str) -> list[str]:
    """
    Map emotion_tag to Cartesia emotion controls.

    Cartesia supports: positivity, negativity, anger, sadness, curiosity
    Each with :lowest, :low, :normal, :high, :highest
    """
    # Map our mood emotion tags to Cartesia controls
    EMOTION_MAP = {
        "neutral": [],  # No specific emotion
        "contemplative": ["curiosity:low"],
        "excited": ["positivity:high"],
        "content": ["positivity:low"],
        "sad": ["sadness:high", "positivity:lowest"],
        "proud": ["positivity:high"],
    }
    return EMOTION_MAP.get(emotion_tag, [])


__all__ = [
    "handle_call_request",
    "DEFAULT_VOICE_ID",
]
