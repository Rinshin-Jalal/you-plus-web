"""
Context Handler
===============

Fetches user context, call memory, and other data needed for a session.
"""

from typing import Optional

from loguru import logger

from services.user_context import (
    fetch_user_context,
    fetch_call_memory,
    get_yesterday_promise_status,
)
from services.excuse_patterns import fetch_excuse_patterns
from conversation.call_types import select_call_type
from conversation.mood import select_mood


async def fetch_session_context(user_id: str) -> Optional[dict]:
    """
    Fetch all context needed for a voice session.

    Args:
        user_id: The user's ID

    Returns:
        Dict with user_context, call_memory, call_type, mood, etc.
        None if user should be rejected.
    """
    # Fetch user's context from database
    user_context = await fetch_user_context(user_id)
    future_self = user_context.get("future_self", {})
    status = user_context.get("status", {})

    # Reject if user doesn't exist
    if not future_self or not future_self.get("user_id"):
        logger.warning(f"User {user_id} not found in future_self table")
        return None

    # Reject if subscription expired
    subscription_status = status.get("subscription_status")
    if subscription_status == "expired":
        logger.warning(f"User {user_id} subscription expired")
        return None

    # Reject if user paused calls
    if status.get("calls_paused"):
        logger.warning(f"User {user_id} has paused calls")
        return None

    # Fetch call memory
    call_memory = await fetch_call_memory(user_id)

    # Fetch excuse patterns
    excuse_data = await fetch_excuse_patterns(user_id)

    # Determine yesterday's promise status
    call_history = user_context.get("call_history", [])
    yesterday_promise_kept = get_yesterday_promise_status(call_history)

    # Select call type
    current_streak = status.get("current_streak_days", 0)
    call_type = select_call_type(
        user_context=user_context,
        call_memory=call_memory,
        current_streak=current_streak,
    )
    logger.info(f"📞 Selected call type: {call_type.name} ({call_type.energy})")

    # Select mood
    mood = select_mood(
        user_context=user_context,
        call_memory=call_memory,
        call_type=call_type.name,
        kept_promise_yesterday=yesterday_promise_kept,
    )
    logger.info(f"🎭 Selected mood: {mood.name}")

    return {
        "user_context": user_context,
        "call_memory": call_memory,
        "excuse_data": excuse_data,
        "call_type": call_type,
        "mood": mood,
        "yesterday_promise_kept": yesterday_promise_kept,
    }


__all__ = ["fetch_session_context"]
