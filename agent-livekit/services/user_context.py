"""
User context fetching and call memory management.
"""

import os
import asyncio
import aiohttp
from typing import Optional, Callable, Any

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 0.5


async def with_retry(
    operation: Callable[[], Any],
    operation_name: str,
    max_retries: int = MAX_RETRIES,
    delay: float = RETRY_DELAY_SECONDS,
) -> Any:
    """
    Execute an async operation with retry logic.
    
    Args:
        operation: Async callable to execute
        operation_name: Name for logging
        max_retries: Maximum number of retry attempts
        delay: Delay between retries in seconds (doubles each retry)
    
    Returns:
        Result of the operation
    
    Raises:
        Last exception if all retries fail
    """
    last_error = None
    current_delay = delay
    
    for attempt in range(max_retries):
        try:
            return await operation()
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            last_error = e
            if attempt < max_retries - 1:
                print(f"⚠️ {operation_name} failed (attempt {attempt + 1}/{max_retries}): {e}")
                await asyncio.sleep(current_delay)
                current_delay *= 2  # Exponential backoff
            else:
                print(f"❌ {operation_name} failed after {max_retries} attempts: {e}")
    
    raise last_error


async def fetch_user_context(user_id: str) -> dict:
    """Fetch user's COMPLETE context from Supabase - future_self, pillars, status, AND history."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, using default context")
        return _default_user_context()

    try:
        return await with_retry(
            lambda: _fetch_user_context_impl(user_id),
            f"fetch_user_context({user_id})",
        )
    except Exception as e:
        print(f"❌ Failed to fetch user context after retries: {e}")
        return _default_user_context()


def _default_user_context() -> dict:
    """Return default user context structure."""
    return {
        "future_self": {},
        "pillars": [],
        "status": {},
        "call_history": [],
        "users": {},
    }


async def _fetch_user_context_impl(user_id: str) -> dict:
    """Internal implementation of fetch_user_context."""
    timeout = aiohttp.ClientTimeout(total=10)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        }

        # Fetch users table for name and call_time
        async with session.get(
            f"{SUPABASE_URL}/rest/v1/users",
            params={"id": f"eq.{user_id}", "select": "id,name,timezone,call_time"},
            headers=headers,
        ) as resp:
            users_data = await resp.json()
            users = users_data[0] if users_data else {}

        # Fetch future_self (replaces identity table)
        async with session.get(
            f"{SUPABASE_URL}/rest/v1/future_self",
            params={"user_id": f"eq.{user_id}", "select": "*"},
            headers=headers,
        ) as resp:
            future_self_data = await resp.json()
            future_self = future_self_data[0] if future_self_data else {}

        # Fetch future_self_pillars
        async with session.get(
            f"{SUPABASE_URL}/rest/v1/future_self_pillars",
            params={"user_id": f"eq.{user_id}", "select": "*"},
            headers=headers,
        ) as resp:
            pillars_data = await resp.json()
            pillars = pillars_data if isinstance(pillars_data, list) else []

        # Fetch status (streak, total calls)
        async with session.get(
            f"{SUPABASE_URL}/rest/v1/status",
            params={"user_id": f"eq.{user_id}", "select": "*"},
            headers=headers,
        ) as resp:
            status_data = await resp.json()
            status = status_data[0] if status_data else {}

        # Fetch recent call analytics (last 14 days) for pattern recognition
        async with session.get(
            f"{SUPABASE_URL}/rest/v1/call_analytics",
            params={
                "user_id": f"eq.{user_id}",
                "select": "promise_kept,tomorrow_commitment,created_at,call_type",
                "order": "created_at.desc",
                "limit": "14",
            },
            headers=headers,
        ) as resp:
            call_history = await resp.json() if resp.status == 200 else []

        print(
            f"📊 Loaded context for {user_id}: future_self={bool(future_self)}, pillars={len(pillars)}, streak={status.get('current_streak_days', 0)}, history={len(call_history)} calls"
        )

        return {
            "future_self": future_self,
            "pillars": pillars,
            "status": status,
            "call_history": call_history if isinstance(call_history, list) else [],
            "users": users,
        }


async def fetch_call_memory(user_id: str) -> dict:
    """Fetch user's call memory from Supabase."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, using default call memory")
        return _default_call_memory()

    try:
        return await with_retry(
            lambda: _fetch_call_memory_impl(user_id),
            f"fetch_call_memory({user_id})",
        )
    except Exception as e:
        print(f"❌ Failed to fetch call memory after retries: {e}")
        return _default_call_memory()


async def _fetch_call_memory_impl(user_id: str) -> dict:
    """Internal implementation of fetch_call_memory."""
    timeout = aiohttp.ClientTimeout(total=10)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        }

        async with session.get(
            f"{SUPABASE_URL}/rest/v1/call_memory",
            params={"user_id": f"eq.{user_id}", "select": "*"},
            headers=headers,
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                if data:
                    print(f"📝 Loaded call memory for {user_id}")
                    return data[0]

            # No memory exists, return default
            print(f"📝 No call memory found for {user_id}, using defaults")
            return _default_call_memory()


async def upsert_call_memory(user_id: str, call_memory: dict) -> bool:
    """Update or insert call memory for a user."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot save call memory")
        return False

    try:
        return await with_retry(
            lambda: _upsert_call_memory_impl(user_id, call_memory),
            f"upsert_call_memory({user_id})",
        )
    except Exception as e:
        print(f"❌ Failed to save call memory after retries: {e}")
        return False


async def _upsert_call_memory_impl(user_id: str, call_memory: dict) -> bool:
    """Internal implementation of upsert_call_memory."""
    timeout = aiohttp.ClientTimeout(total=10)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }

        payload = {
            "user_id": user_id,
            **call_memory,
        }

        async with session.post(
            f"{SUPABASE_URL}/rest/v1/call_memory",
            json=payload,
            headers=headers,
        ) as resp:
            if resp.status in (200, 201):
                print(f"💾 Saved call memory for {user_id}")
                return True
            else:
                print(f"⚠️ Failed to save call memory: {resp.status}")
                return False


def _default_call_memory() -> dict:
    """Return default call memory structure."""
    return {
        "memorable_quotes": [],
        "emotional_peaks": [],
        "open_loops": [],
        "last_call_type": None,
        "call_type_history": [],
        "narrative_arc": "early_struggle",
        "last_mood": None,
        "current_persona": "mentor",
        "severity_level": 1,
        "last_commitment": None,
        "last_commitment_time": None,
        "last_commitment_specific": False,
    }


def get_yesterday_promise_status(call_history: list) -> Optional[bool]:
    """Determine if they kept their promise yesterday from call history."""
    if not call_history:
        return None

    # call_history is ordered by created_at desc, so first item is most recent
    last_call = call_history[0] if call_history else None
    if last_call:
        return last_call.get("promise_kept")

    return None
