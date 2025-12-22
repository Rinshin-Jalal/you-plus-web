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
from conversation.call_types import select_call_type
from conversation.personality import calculate_personality_state, PersonalityState


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
        if (
            user_id.startswith("identity-")
            or user_id.startswith("test-")
            or user_id == "demo"
        ):
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

    # Calculate personality state (V5)
    recent_promises = []  # TODO: Extract from call_history if needed
    personality = calculate_personality_state(
        user_context=user_context,
        call_memory=call_memory,
        kept_promise_yesterday=yesterday_promise_kept,
        recent_promises=recent_promises,
    )
    logger.info(
        f"🎭 Personality: {personality.emotional_weather} ({personality.relationship_phase})"
    )
    logger.info(
        f"   Frustration: {personality.frustration:.1f} | Respect: {personality.respect:.1f} | Intimacy: {personality.intimacy:.1f}"
    )

    return {
        "user_context": user_context,
        "call_memory": call_memory,
        "excuse_data": {},  # Removed excuse patterns system
        "call_type": call_type,
        "personality": personality,  # V5: personality instead of mood
        "yesterday_promise_kept": yesterday_promise_kept,
    }


def _create_demo_context(user_id: str) -> dict:
    """
    Create mock context for demo/test users from LiveKit Playground.

    Args:
        user_id: The test user's ID (e.g., identity-KlCq)

    Returns:
        Dict with mock user_context, call_memory, call_type, personality, etc.
    """
    from conversation.call_types import CALL_TYPES

    logger.info(f"📋 Creating demo context for test user: {user_id}")
    logger.info(f"🎯 Demo context will include 2 sample pillars: health, career")

    # Create basic demo context
    demo_user_context = {
        "future_self": {
            "user_id": user_id,
            "name": "Demo User",
            "cartesia_voice_id": None,  # Will use default voice
            "overall_trust_score": 50,
            "quit_pattern": "",
            "core_identity": "Building a future version of myself",
            "primary_pillar": "health",
            "the_why": "To prove to myself I can do hard things and become who I say I'll be",
        },
        "pillars": [
            {
                "id": "demo-pillar-health",
                "pillar": "health",
                "user_id": user_id,
                "current_state": "Inconsistent with exercise, tired often",
                "future_state": "Energetic, strong, consistent with movement",
                "identity_statement": "I am someone who moves their body daily",
                "non_negotiable": "I move my body every single day",
                "trust_score": 50,
                "priority": 80,
                "last_checked_at": None,
                "consecutive_kept": 0,
                "consecutive_broken": 0,
                "total_kept": 0,
                "total_checked": 0,
                "status": "active",
            },
            {
                "id": "demo-pillar-career",
                "pillar": "career",
                "user_id": user_id,
                "current_state": "Procrastinating on important work",
                "future_state": "Shipping consistently, making progress daily",
                "identity_statement": "I am a builder who ships",
                "non_negotiable": "I do at least 2 hours of focused deep work daily",
                "trust_score": 45,
                "priority": 90,
                "last_checked_at": None,
                "consecutive_kept": 0,
                "consecutive_broken": 0,
                "total_kept": 0,
                "total_checked": 0,
                "status": "active",
            },
        ],
        "status": {
            "subscription_status": "active",
            "current_streak_days": 0,
            "calls_paused": False,
        },
        "call_history": [],
    }

    demo_call_memory = {}

    # Calculate demo personality
    demo_personality = calculate_personality_state(
        user_context=demo_user_context,
        call_memory=demo_call_memory,
        kept_promise_yesterday=None,
        recent_promises=[],
    )

    return {
        "user_context": demo_user_context,
        "call_memory": demo_call_memory,
        "excuse_data": {},  # Removed excuse patterns system
        "call_type": CALL_TYPES["audit"],
        "personality": demo_personality,  # V5: personality instead of mood
        "yesterday_promise_kept": None,
    }


__all__ = ["fetch_session_context"]
