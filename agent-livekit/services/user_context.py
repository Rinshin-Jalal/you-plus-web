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
        print(f"❌ CRITICAL: Supabase not configured! Cannot fetch real data for user: {user_id}")
        raise Exception(f"Supabase not configured - cannot fetch user context for {user_id}")

    try:
        result = await with_retry(
            lambda: _fetch_user_context_impl(user_id),
            f"fetch_user_context({user_id})",
        )
        
        # Validate we got actual data, not empty defaults
        if not result or (not result.get("future_self") and not result.get("pillars") and not result.get("users")):
            print(f"❌ CRITICAL: Database returned empty/insufficient data for user: {user_id}")
            # Raise exception so caller knows database fetch failed
            raise Exception(f"Database returned empty context for user {user_id} - user may not exist or data is missing")
        
        return result
    except Exception as e:
        print(f"❌ CRITICAL: Failed to fetch user context from database after retries for {user_id}: {e}")
        # Re-raise so caller knows database fetch failed - NEVER return demo/default data
        raise


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
    """Internal implementation of fetch_user_context using Supabase function."""
    timeout = aiohttp.ClientTimeout(total=10)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
        }

        # Call the Supabase function to get all context in one request
        async with session.post(
            f"{SUPABASE_URL}/rest/v1/rpc/get_user_context_for_call",
            json={"p_user_id": user_id},
            headers=headers,
        ) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                raise Exception(f"Supabase function call failed: {resp.status} - {error_text}")
            
            result = await resp.json()
            
            # Supabase RPC functions return the result directly (not wrapped in array for jsonb)
            # Handle both cases: direct dict or wrapped in array
            if isinstance(result, list):
                # If wrapped in array, take first element
                context = result[0] if result else {}
            elif isinstance(result, dict):
                # Direct JSONB object
                context = result
            else:
                # Unexpected format, return default
                print(f"⚠️ Unexpected result format from get_user_context: {type(result)}")
                return _default_user_context()
            
            # Ensure all expected keys exist with proper defaults
            future_self = context.get("future_self") or {}
            pillars = context.get("pillars") or []
            status = context.get("status") or {}
            call_history = context.get("call_history") or []
            users = context.get("users") or {}
            
            # Ensure pillars and call_history are lists
            if not isinstance(pillars, list):
                pillars = []
            if not isinstance(call_history, list):
                call_history = []
            
            print(
                f"📊 Loaded context for {user_id}: future_self={bool(future_self)}, pillars={len(pillars)}, streak={status.get('current_streak_days', 0)}, history={len(call_history)} calls"
            )

            return {
                "future_self": future_self,
                "pillars": pillars,
                "status": status,
                "call_history": call_history,
                "users": users,
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
