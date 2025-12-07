"""
User context fetching and call memory management.
"""

import os
import aiohttp
from typing import Optional

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


async def fetch_user_context(user_id: str) -> dict:
    """Fetch user's COMPLETE context from Supabase - future_self, pillars, status, AND history."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, using default context")
        return {
            "identity": {"name": ""},
            "future_self": {},
            "pillars": [],
            "status": {},
            "call_history": [],
            "users": {},
        }

    try:
        async with aiohttp.ClientSession() as session:
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

            # Build backwards-compatible identity object from future_self data
            # This maintains compatibility with code that uses user_context.get("identity")
            identity = _build_legacy_identity(future_self, pillars, users, status)

            print(
                f"📊 Loaded context for {user_id}: future_self={bool(future_self)}, pillars={len(pillars)}, streak={status.get('current_streak_days', 0)}, history={len(call_history)} calls"
            )

            return {
                "identity": identity,  # Backwards compatible
                "future_self": future_self,  # New system
                "pillars": pillars,  # New system
                "status": status,
                "call_history": call_history if isinstance(call_history, list) else [],
                "users": users,
            }
    except Exception as e:
        print(f"❌ Failed to fetch user context: {e}")
        return {
            "identity": {"name": ""},
            "future_self": {},
            "pillars": [],
            "status": {},
            "call_history": [],
            "users": {},
        }


def _build_legacy_identity(
    future_self: dict, pillars: list, users: dict, status: dict
) -> dict:
    """
    Build a backwards-compatible identity object from future_self data.
    This allows existing code that reads from identity to continue working.
    """
    # Find primary pillar for daily_commitment
    primary_pillar_name = future_self.get("primary_pillar", "body")
    primary_pillar = next(
        (p for p in pillars if p.get("pillar") == primary_pillar_name),
        pillars[0] if pillars else {},
    )

    daily_commitment = primary_pillar.get(
        "non_negotiable", future_self.get("core_identity", "")
    )

    # Build onboarding_context from future_self fields
    onboarding_context = {
        "core_identity": future_self.get("core_identity", ""),
        "primary_pillar": future_self.get("primary_pillar", ""),
        "the_why": future_self.get("the_why", ""),
        "dark_future": future_self.get("dark_future", ""),
        "quit_pattern": future_self.get("quit_pattern", ""),
        "favorite_excuse": future_self.get("favorite_excuse", ""),
        "who_disappointed": future_self.get("who_disappointed", []),
        "fears": future_self.get("fears", []),
    }

    return {
        "name": users.get("name", ""),
        "daily_commitment": daily_commitment,
        "call_time": users.get("call_time", "09:00:00"),
        "onboarding_context": onboarding_context,
        "supermemory_container_id": future_self.get("supermemory_container_id", ""),
    }


async def fetch_call_memory(user_id: str) -> dict:
    """Fetch user's call memory from Supabase."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, using default call memory")
        return _default_call_memory()

    try:
        async with aiohttp.ClientSession() as session:
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

    except Exception as e:
        print(f"❌ Failed to fetch call memory: {e}")
        return _default_call_memory()


async def upsert_call_memory(user_id: str, call_memory: dict) -> bool:
    """Update or insert call memory for a user."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot save call memory")
        return False

    try:
        async with aiohttp.ClientSession() as session:
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

    except Exception as e:
        print(f"❌ Failed to save call memory: {e}")
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
