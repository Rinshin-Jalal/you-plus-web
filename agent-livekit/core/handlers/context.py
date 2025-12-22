"""
Context Handler - Simplified
==========================

Fetches user context, call memory, and other data needed for a session.
"""

from typing import Optional

from loguru import logger

from services.user_context import (
    fetch_user_context,
    get_yesterday_promise_status,
)


def _get_demo_user_context() -> dict:
    """Return fake demo data for testing purposes. Matches real database schema."""
    return {
        "future_self": {
            "id": "demo-future-self-id",
            "user_id": "identity-demo",
            "core_identity": "I am becoming a disciplined builder who ships products and moves my body daily",
            "primary_pillar": "career",
            "the_why": "To build something meaningful and be healthy enough to enjoy it",
            "dark_future": "Still talking about building, still overweight, still making excuses",
            "quit_pattern": "Week 2 when novelty wears off",
            "favorite_excuse": "Too tired",
            "who_disappointed": ["myself", "my future self"],
            "fears": ["being seen as a fraud", "dying early"],
            "future_self_intro_url": None,
            "why_recording_url": None,
            "pledge_recording_url": None,
            "cartesia_voice_id": "demo-voice-id",
            "overall_trust_score": 75,
            "supermemory_container_id": None,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-15T00:00:00Z",
        },
        "pillars": [
            {
                "id": "demo-pillar-1",
                "user_id": "identity-demo",
                "future_self_id": "demo-future-self-id",
                "pillar": "career",
                "current_state": "Talking about building, not actually building",
                "future_state": "Shipping products regularly, building real value",
                "identity_statement": "I am a builder",
                "non_negotiable": "I ship code or build something every single day",
                "trust_score": 70,
                "priority": 100,
                "last_checked_at": "2024-01-15T09:00:00Z",
                "consecutive_kept": 3,
                "consecutive_broken": 0,
                "total_kept": 15,
                "total_checked": 20,
                "status": "active",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-15T00:00:00Z",
            },
            {
                "id": "demo-pillar-2",
                "user_id": "identity-demo",
                "future_self_id": "demo-future-self-id",
                "pillar": "health",
                "current_state": "Overweight, tired, avoiding mirrors",
                "future_state": "150lbs, energetic, proud of my body",
                "identity_statement": "I am an athlete",
                "non_negotiable": "I move my body every single day",
                "trust_score": 65,
                "priority": 80,
                "last_checked_at": "2024-01-14T09:00:00Z",
                "consecutive_kept": 2,
                "consecutive_broken": 0,
                "total_kept": 12,
                "total_checked": 18,
                "status": "active",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-14T00:00:00Z",
            },
            {
                "id": "demo-pillar-3",
                "user_id": "identity-demo",
                "future_self_id": "demo-future-self-id",
                "pillar": "relationships",
                "current_state": "Isolated, not prioritizing connections",
                "future_state": "Nurturing meaningful relationships with family and friends",
                "identity_statement": "I am a connector",
                "non_negotiable": "I reach out to someone important every single day",
                "trust_score": 60,
                "priority": 60,
                "last_checked_at": "2024-01-13T09:00:00Z",
                "consecutive_kept": 1,
                "consecutive_broken": 0,
                "total_kept": 8,
                "total_checked": 15,
                "status": "active",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-13T00:00:00Z",
            },
        ],
        "status": {
            "user_id": "identity-demo",
            "current_streak_days": 7,
            "longest_streak_days": 12,
            "total_calls_completed": 25,
            "trust_score": 85,
            "last_call_date": "2024-01-15",
        },
        "call_history": [
            {
                "promise_kept": True,
                "tomorrow_commitment": "Complete the project proposal and submit it",
                "created_at": "2024-01-15T09:00:00Z",
                "call_type": "daily_checkin",
            },
            {
                "promise_kept": True,
                "tomorrow_commitment": "Go for a 30-minute run in the morning",
                "created_at": "2024-01-14T09:00:00Z",
                "call_type": "daily_checkin",
            },
        ],
        "users": {
            "id": "identity-demo",
            "name": "Demo User",
            "timezone": "America/New_York",
            "call_time": "09:00:00",
        },
    }


async def fetch_session_context(user_id: str) -> Optional[dict]:
    """
    Fetch all context needed for a voice session.

    Args:
        user_id: The user's ID

    Returns:
        Dict with user context, call memory, and other session data
    """
    try:
        logger.info(f"🔍 Fetching session context for user: {user_id}")

        # ONLY use demo data for explicit test users (identity-* prefix)
        # ALL real users MUST fetch from database
        if user_id.startswith("identity-"):
            logger.warning(f"🧪 TEST MODE: Using demo data for test user: {user_id}")
            user_context = _get_demo_user_context()
        else:
            # REAL USER: Fetch from database - NEVER use demo data
            logger.info(f"📊 REAL USER: Fetching from database for user: {user_id}")
            user_context = await fetch_user_context(user_id)
            
            # Validate we got real data
            if not user_context:
                logger.error(f"❌ No user context returned from database for user: {user_id}")
                return None
            
            # Check if we got empty/default data (database fetch failed silently)
            future_self = user_context.get("future_self") or {}
            pillars = user_context.get("pillars") or []
            users = user_context.get("users") or {}
            
            # If all data is empty, database fetch likely failed
            if not future_self and not pillars and not users:
                logger.error(f"❌ Database returned empty context for user: {user_id} - this is likely a database error")
                return None
            
            logger.info(f"✅ Successfully loaded real user data: future_self={bool(future_self)}, pillars={len(pillars)}, user={bool(users)}")

        # Determine yesterday's promise status
        call_history = user_context.get("call_history", [])
        yesterday_promise_kept = get_yesterday_promise_status(call_history)

        # Simple call type selection
        call_type = "daily_checkin"
        logger.info(f"📞 Using call type: {call_type}")

        return {
            "user_context": user_context,
            "call_type": call_type,
            "yesterday_promise_kept": yesterday_promise_kept,
        }

    except Exception as e:
        logger.error(f"❌ Error fetching session context for user {user_id}: {e}", exc_info=True)
        return None


async def fetch_session_context_simple(user_id: str) -> Optional[dict]:
    """
    Very simple context fetch for basic operation.
    """
    try:
        # ONLY use demo data for explicit test users (identity-* prefix)
        # ALL real users MUST fetch from database
        if user_id.startswith("identity-"):
            logger.warning(f"🧪 TEST MODE: Using demo data for test user: {user_id}")
            user_context = _get_demo_user_context()
        else:
            # REAL USER: Fetch from database - NEVER use demo data
            logger.info(f"📊 REAL USER: Fetching from database for user: {user_id}")
            user_context = await fetch_user_context(user_id)
            
            if not user_context:
                logger.error(f"❌ No user context returned from database for user: {user_id}")
                return None
            
            # Validate we got real data
            future_self = user_context.get("future_self") or {}
            pillars = user_context.get("pillars") or []
            users = user_context.get("users") or {}
            
            if not future_self and not pillars and not users:
                logger.error(f"❌ Database returned empty context for user: {user_id} - this is likely a database error")
                return None

        return {
            "user_context": user_context,
        }

    except Exception as e:
        logger.error(f"❌ Error fetching simple context for user {user_id}: {e}", exc_info=True)
        return None
