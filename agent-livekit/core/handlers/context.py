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
# Excuse patterns removed - not needed anymore
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

    # Handle demo/test users (e.g., from LiveKit Playground)
    if not future_self or not future_self.get("user_id"):
        # Check if this is a demo/test user
        if user_id.startswith("identity-") or user_id.startswith("test-") or user_id == "demo":
            logger.info(f"🧪 Creating demo context for test user: {user_id}")
            return _create_demo_context(user_id)

        # Real user not found - reject
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
        "excuse_data": {},  # Removed excuse patterns system
        "call_type": call_type,
        "mood": mood,
        "yesterday_promise_kept": yesterday_promise_kept,
    }


def _create_demo_context(user_id: str) -> dict:
    """
    Create mock context for demo/test users from LiveKit Playground.

    Args:
        user_id: The test user's ID (e.g., identity-KlCq)

    Returns:
        Dict with mock user_context, call_memory, call_type, mood, etc.
    """
    from conversation.call_types import CALL_TYPES
    from conversation.mood import MOODS

    logger.info(f"📋 Creating demo context for test user: {user_id}")

    return {
        "user_context": {
            "future_self": {
                "user_id": user_id,
                "name": "Demo User",
                "cartesia_voice_id": None,  # Will use default voice
            },
            "status": {
                "subscription_status": "active",
                "current_streak_days": 0,
                "calls_paused": False,
            },
            "call_history": [],
        },
        "call_memory": {},
        "excuse_data": {},  # Removed excuse patterns system
        "call_type": CALL_TYPES["audit"],
        "mood": MOODS["warm_direct"],
        "yesterday_promise_kept": None,
    }


__all__ = ["fetch_session_context"]
