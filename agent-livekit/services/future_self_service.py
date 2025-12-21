"""
Future Self Service - READ ONLY
==================================

Agent only reads data for prompts. Backend handles all writes.
Provides functions to fetch future_self, pillars, and check-in data.
"""

import os
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

try:
    from supabase import create_client

    HAS_SUPABASE = True
except ImportError:
    create_client = None  # type: ignore
    HAS_SUPABASE = False

from conversation.pillars import (
    PillarState,
    FutureSelf,
)

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Shared client instance
_supabase_client: Any = None


def get_supabase_client() -> Any:
    """Get or create Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        if SUPABASE_URL and SUPABASE_SERVICE_KEY and create_client:
            try:
                _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            except Exception as e:
                logger.error(f"Failed to create Supabase client: {e}")
    return _supabase_client


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR STATE CONVERSION
# ═══════════════════════════════════════════════════════════════════════════════


def pillar_from_row(row: Dict[str, Any]) -> PillarState:
    """Convert database row to PillarState object."""
    pillar_id = row["pillar"]  # Now a string, not an enum

    last_checked = None
    if row.get("last_checked_at"):
        try:
            last_checked = datetime.fromisoformat(
                row["last_checked_at"].replace("Z", "+00:00")
            )
        except (ValueError, AttributeError):
            pass

    return PillarState(
        pillar=pillar_id,
        pillar_id=row["id"],
        current_state=row.get("current_state", ""),
        future_state=row.get("future_state", ""),
        identity_statement=row.get("identity_statement", ""),
        non_negotiable=row.get("non_negotiable", ""),
        trust_score=row.get("trust_score", 50),
        priority=row.get("priority", 50),
        last_checked_at=last_checked,
        consecutive_kept=row.get("consecutive_kept", 0),
        consecutive_broken=row.get("consecutive_broken", 0),
        total_kept=row.get("total_kept", 0),
        total_checked=row.get("total_checked", 0),
        status=row.get("status", "active"),
    )


def future_self_from_rows(
    fs_row: Dict[str, Any], pillar_rows: List[Dict[str, Any]]
) -> FutureSelf:
    """Convert database rows to FutureSelf object."""
    pillars = {}
    for row in pillar_rows:
        state = pillar_from_row(row)
        pillars[state.pillar] = state  # Key by pillar ID string

    primary = fs_row.get("primary_pillar", "")  # Now a string

    return FutureSelf(
        user_id=fs_row["user_id"],
        future_self_id=fs_row["id"],
        core_identity=fs_row.get("core_identity", ""),
        primary_pillar=primary,
        the_why=fs_row.get("the_why", ""),
        dark_future=fs_row.get("dark_future", ""),
        quit_pattern=fs_row.get("quit_pattern", ""),
        favorite_excuse=fs_row.get("favorite_excuse", ""),
        who_disappointed=fs_row.get("who_disappointed") or [],
        fears=fs_row.get("fears") or [],
        future_self_intro_url=fs_row.get("future_self_intro_url", ""),
        why_recording_url=fs_row.get("why_recording_url", ""),
        pledge_recording_url=fs_row.get("pledge_recording_url", ""),
        cartesia_voice_id=fs_row.get("cartesia_voice_id", ""),
        overall_trust_score=fs_row.get("overall_trust_score", 50),
        pillars=pillars,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# FUTURE SELF READS (Agent only reads - backend handles writes)
# ═══════════════════════════════════════════════════════════════════════════════


async def get_future_self(user_id: str) -> Optional[FutureSelf]:
    """Get a user's complete future_self with all pillars."""
    client = get_supabase_client()
    if not client:
        return None

    try:
        # Get future_self record
        fs_result = (
            client.table("future_self")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        if not fs_result.data:
            return None

        fs_row = fs_result.data

        # Get all pillars
        pillars_result = (
            client.table("future_self_pillars")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "active")
            .execute()
        )

        pillar_rows = pillars_result.data if pillars_result.data else []

        return future_self_from_rows(fs_row, pillar_rows)

    except Exception as e:
        logger.error(f"Failed to get future_self: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR READS (Agent only reads - backend handles writes)
# ═══════════════════════════════════════════════════════════════════════════════


async def get_user_pillars(user_id: str, active_only: bool = True) -> List[PillarState]:
    """Get all pillars for a user."""
    client = get_supabase_client()
    if not client:
        return []

    try:
        query = client.table("future_self_pillars").select("*").eq("user_id", user_id)

        if active_only:
            query = query.eq("status", "active")

        result = query.order("priority", desc=True).execute()

        if result.data:
            return [pillar_from_row(row) for row in result.data]
        return []

    except Exception as e:
        logger.error(f"Failed to get user pillars: {e}")
        return []


async def get_pillar(pillar_id: str) -> Optional[PillarState]:
    """Get a specific pillar by ID."""
    client = get_supabase_client()
    if not client:
        return None

    try:
        result = (
            client.table("future_self_pillars")
            .select("*")
            .eq("id", pillar_id)
            .single()
            .execute()
        )

        if result.data:
            return pillar_from_row(result.data)
        return None

    except Exception as e:
        logger.error(f"Failed to get pillar: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR CHECK-INS READS (Agent only reads - backend handles writes)
# ═══════════════════════════════════════════════════════════════════════════════


async def get_pillar_checkins(pillar_id: str, days: int = 7) -> List[Dict[str, Any]]:
    """Get recent check-ins for a pillar."""
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = (
            client.table("pillar_checkins")
            .select("*")
            .eq("pillar_id", pillar_id)
            .gte("checked_at", f"now() - interval '{days} days'")
            .order("checked_at", desc=True)
            .execute()
        )

        return result.data if result.data else []

    except Exception as e:
        logger.error(f"Failed to get pillar check-ins: {e}")
        return []


# ═══════════════════════════════════════════════════════════════════════════════
# CALL FOCUS SELECTION
# ═══════════════════════════════════════════════════════════════════════════════


async def get_call_focus_pillars(user_id: str, limit: int = 2) -> List[PillarState]:
    """
    Get the pillars to focus on for a call.
    Uses the database function for consistent logic.
    """
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = client.rpc(
            "get_call_focus_pillars", {"p_user_id": user_id, "p_limit": limit}
        ).execute()

        if not result.data:
            return []

        # Convert RPC results to PillarState objects
        pillars = []
        for row in result.data:
            pillar_id = row["pillar"]  # Now a string
            state = PillarState(
                pillar=pillar_id,
                pillar_id=row["pillar_id"],
                identity_statement=row.get("identity_statement", ""),
                non_negotiable=row.get("non_negotiable", ""),
                trust_score=row.get("trust_score", 50),
                priority=row.get("priority", 50),
                consecutive_broken=row.get("consecutive_broken", 0),
            )
            pillars.append(state)

        return pillars

    except Exception as e:
        logger.error(f"Failed to get call focus pillars: {e}")

        # Fallback to simple query
        try:
            return await get_user_pillars(user_id, active_only=True)
        except Exception:
            return []


# ═══════════════════════════════════════════════════════════════════════════════
# IDENTITY ALIGNMENT
# ═══════════════════════════════════════════════════════════════════════════════


async def get_identity_alignment(user_id: str) -> Dict[str, Any]:
    """
    Get the user's identity alignment data.
    Uses the database function for consistent calculation.
    """
    client = get_supabase_client()
    if not client:
        return {
            "overall_alignment": 50,
            "pillar_alignments": [],
            "transformation_status": "unknown",
        }

    try:
        result = client.rpc("get_identity_alignment", {"p_user_id": user_id}).execute()

        if result.data and len(result.data) > 0:
            row = result.data[0]
            return {
                "overall_alignment": row.get("overall_alignment", 50),
                "pillar_alignments": row.get("pillar_alignments", []),
                "transformation_status": row.get("transformation_status", "unknown"),
            }

        return {
            "overall_alignment": 50,
            "pillar_alignments": [],
            "transformation_status": "unknown",
        }

    except Exception as e:
        logger.error(f"Failed to get identity alignment: {e}")
        return {
            "overall_alignment": 50,
            "pillar_alignments": [],
            "transformation_status": "unknown",
        }


async def get_pillar_summary(user_id: str) -> List[Dict[str, Any]]:
    """Get a summary of all pillars for display."""
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = client.rpc("get_pillar_summary", {"p_user_id": user_id}).execute()

        return result.data if result.data else []

    except Exception as e:
        logger.error(f"Failed to get pillar summary: {e}")
        return []


# ═══════════════════════════════════════════════════════════════════════════════
# CHECKIN SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════


async def get_user_checkin_summary(user_id: str, days: int = 7) -> Dict[str, Any]:
    """
    Get check-in summary for prompt context.
    Returns aggregated data across all pillars.
    """
    client = get_supabase_client()
    if not client:
        return {}

    try:
        # Get recent checkins across all pillars
        result = (
            client.table("pillar_checkins")
            .select("showed_up, excuse_used, pillar_id")
            .eq("user_id", user_id)
            .gte("checked_at", f"now() - interval '{days} days'")
            .execute()
        )

        if not result.data:
            return {}

        checkins = result.data
        total = len(checkins)
        kept = sum(1 for c in checkins if c.get("showed_up"))
        broken = total - kept

        # Count excuse patterns
        excuses: Dict[str, int] = {}
        for c in checkins:
            excuse = c.get("excuse_used")
            if excuse:
                excuses[excuse] = excuses.get(excuse, 0) + 1

        most_common_excuse = None
        if excuses:
            most_common_excuse = max(excuses.items(), key=lambda x: x[1])[0]

        return {
            "total_checkins": total,
            "kept": kept,
            "broken": broken,
            "kept_rate": round(kept / total * 100) if total > 0 else 0,
            "most_common_excuse": most_common_excuse,
            "excuse_count": len(excuses),
        }

    except Exception as e:
        logger.error(f"Failed to get checkin summary: {e}")
        return {}


# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT CONTEXT BUILDERS
# ═══════════════════════════════════════════════════════════════════════════════


def build_pillars_prompt_context(pillars: List[PillarState]) -> str:
    """
    Build prompt context for focus pillars.
    Used in system prompt to tell the agent what to check on.
    """
    if not pillars:
        return ""

    # Generic emoji - could be made configurable per pillar type
    DEFAULT_EMOJI = "📍"

    lines = [
        "# TODAY'S FOCUS PILLARS",
        "Check in on these pillars during the call:",
        "",
    ]

    for p in pillars:
        emoji = DEFAULT_EMOJI  # Could lookup from pillar config if needed
        status = "🔴 NEEDS ATTENTION" if p.needs_attention else "🟢"

        lines.append(f"## {emoji} {p.pillar.upper()} {status}")

        if p.identity_statement:
            lines.append(f'Identity: "{p.identity_statement}"')

        if p.non_negotiable:
            lines.append(f'Non-negotiable: "{p.non_negotiable}"')

        lines.append(f"Trust Score: {p.trust_score}/100")

        if p.consecutive_broken > 0:
            lines.append(f"⚠️ Broken streak: {p.consecutive_broken} days")
        elif p.consecutive_kept > 0:
            lines.append(f"✅ Kept streak: {p.consecutive_kept} days")

        lines.append("")

    lines.append("ASK about each pillar. Get a clear YES or NO. Then hold accountable.")

    return "\n".join(lines)


def build_pillar_checkin_summary_context(summary: Dict[str, Any]) -> str:
    """
    Build prompt context from check-in summary.
    Shows patterns in their behavior.
    """
    if not summary:
        return ""

    lines = ["\n# RECENT PATTERNS (Last 7 days)", ""]

    total = summary.get("total_checkins", 0)
    if total == 0:
        lines.append("No check-ins recorded yet.")
        return "\n".join(lines)

    kept_rate = summary.get("kept_rate", 0)
    kept = summary.get("kept", 0)
    broken = summary.get("broken", 0)

    lines.append(f"Check-ins: {total} total ({kept} kept, {broken} broken)")
    lines.append(f"Success rate: {kept_rate}%")

    if kept_rate >= 80:
        lines.append("→ Strong momentum. Celebrate and reinforce identity.")
    elif kept_rate >= 60:
        lines.append("→ Progressing but not consistent. Find the blockers.")
    elif kept_rate >= 40:
        lines.append("→ Struggling. Need to reconnect to WHY.")
    else:
        lines.append("→ In danger of giving up. Deploy dark fuel if needed.")

    excuse = summary.get("most_common_excuse")
    if excuse:
        lines.append(f'\nMost common excuse: "{excuse}"')
        lines.append("→ Call this out before they even say it.")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    "get_supabase_client",
    "pillar_from_row",
    "future_self_from_rows",
    "get_future_self",
    "get_user_pillars",
    "get_pillar",
    "get_pillar_checkins",
    "get_call_focus_pillars",
    "get_identity_alignment",
    "get_pillar_summary",
    "get_user_checkin_summary",
    "build_pillars_prompt_context",
    "build_pillar_checkin_summary_context",
]
