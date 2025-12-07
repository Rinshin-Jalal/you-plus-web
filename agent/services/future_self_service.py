"""
Future Self Service - Database Operations
==========================================

Service for managing future_self, future_self_pillars, and pillar_checkins.
Integrates with Supermemory for rich narrative context.
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

from conversation.future_self import (
    Pillar,
    PillarState,
    FutureSelf,
    ACTIONABLE_PILLARS,
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
    pillar_type = Pillar(row["pillar"])

    last_checked = None
    if row.get("last_checked_at"):
        try:
            last_checked = datetime.fromisoformat(
                row["last_checked_at"].replace("Z", "+00:00")
            )
        except (ValueError, AttributeError):
            pass

    return PillarState(
        pillar=pillar_type,
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
        pillars[state.pillar] = state

    primary = Pillar.BODY
    if fs_row.get("primary_pillar"):
        try:
            primary = Pillar(fs_row["primary_pillar"])
        except ValueError:
            pass

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
# FUTURE SELF CRUD
# ═══════════════════════════════════════════════════════════════════════════════


async def create_future_self(
    user_id: str,
    core_identity: str,
    primary_pillar: Pillar,
    the_why: str,
    dark_future: Optional[str] = None,
    quit_pattern: Optional[str] = None,
    favorite_excuse: Optional[str] = None,
    who_disappointed: Optional[List[str]] = None,
    fears: Optional[List[str]] = None,
) -> Optional[FutureSelf]:
    """Create a new future_self record."""
    client = get_supabase_client()
    if not client:
        logger.error("No Supabase client available")
        return None

    try:
        result = (
            client.table("future_self")
            .insert(
                {
                    "user_id": user_id,
                    "core_identity": core_identity,
                    "primary_pillar": primary_pillar.value,
                    "the_why": the_why,
                    "dark_future": dark_future,
                    "quit_pattern": quit_pattern,
                    "favorite_excuse": favorite_excuse,
                    "who_disappointed": who_disappointed or [],
                    "fears": fears or [],
                    "overall_trust_score": 50,
                }
            )
            .execute()
        )

        if not result.data:
            return None

        fs_row = result.data[0]
        return FutureSelf(
            user_id=user_id,
            future_self_id=fs_row["id"],
            core_identity=core_identity,
            primary_pillar=primary_pillar,
            the_why=the_why,
            dark_future=dark_future or "",
            quit_pattern=quit_pattern or "",
            favorite_excuse=favorite_excuse or "",
            who_disappointed=who_disappointed or [],
            fears=fears or [],
            overall_trust_score=50,
            pillars={},
        )

    except Exception as e:
        logger.error(f"Failed to create future_self: {e}")
        return None


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


async def update_future_self(user_id: str, updates: Dict[str, Any]) -> bool:
    """Update a future_self record."""
    client = get_supabase_client()
    if not client:
        return False

    try:
        # Convert Pillar enum to string if present
        if "primary_pillar" in updates and isinstance(
            updates["primary_pillar"], Pillar
        ):
            updates["primary_pillar"] = updates["primary_pillar"].value

        updates["updated_at"] = datetime.now().isoformat()

        client.table("future_self").update(updates).eq("user_id", user_id).execute()
        return True

    except Exception as e:
        logger.error(f"Failed to update future_self: {e}")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR CRUD
# ═══════════════════════════════════════════════════════════════════════════════


async def create_pillar(
    user_id: str,
    future_self_id: str,
    pillar: Pillar,
    current_state: str,
    future_state: str,
    identity_statement: str,
    non_negotiable: str,
    priority: int = 50,
) -> Optional[PillarState]:
    """Create a pillar for a user's future_self."""
    client = get_supabase_client()
    if not client:
        return None

    try:
        result = (
            client.table("future_self_pillars")
            .insert(
                {
                    "user_id": user_id,
                    "future_self_id": future_self_id,
                    "pillar": pillar.value,
                    "current_state": current_state,
                    "future_state": future_state,
                    "identity_statement": identity_statement,
                    "non_negotiable": non_negotiable,
                    "priority": priority,
                    "trust_score": 50,
                    "status": "active",
                }
            )
            .execute()
        )

        if result.data:
            return pillar_from_row(result.data[0])
        return None

    except Exception as e:
        logger.error(f"Failed to create pillar: {e}")
        return None


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


async def update_pillar_trust(pillar_id: str, trust_score: int) -> bool:
    """Update a pillar's trust score."""
    client = get_supabase_client()
    if not client:
        return False

    try:
        client.table("future_self_pillars").update(
            {
                "trust_score": max(0, min(100, trust_score)),
                "updated_at": datetime.now().isoformat(),
            }
        ).eq("id", pillar_id).execute()
        return True

    except Exception as e:
        logger.error(f"Failed to update pillar trust: {e}")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR CHECK-INS
# ═══════════════════════════════════════════════════════════════════════════════


async def record_pillar_checkin(
    pillar_id: str,
    user_id: str,
    showed_up: bool,
    what_happened: Optional[str] = None,
    excuse_used: Optional[str] = None,
    matched_pattern: bool = False,
    identity_vote: Optional[str] = None,
    call_id: Optional[str] = None,
) -> Optional[str]:
    """
    Record a pillar check-in and update pillar stats.

    Returns the check-in ID if successful.
    """
    client = get_supabase_client()
    if not client:
        return None

    try:
        # Use the database function for atomic update
        result = client.rpc(
            "record_pillar_checkin",
            {
                "p_pillar_id": pillar_id,
                "p_user_id": user_id,
                "p_showed_up": showed_up,
                "p_what_happened": what_happened,
                "p_excuse_used": excuse_used,
                "p_matched_pattern": matched_pattern,
                "p_identity_vote": identity_vote,
                "p_call_id": call_id,
            },
        ).execute()

        if result.data:
            return result.data
        return None

    except Exception as e:
        logger.error(f"Failed to record pillar check-in: {e}")

        # Fallback to manual insert if RPC fails
        try:
            insert_result = (
                client.table("pillar_checkins")
                .insert(
                    {
                        "pillar_id": pillar_id,
                        "user_id": user_id,
                        "showed_up": showed_up,
                        "what_happened": what_happened,
                        "excuse_used": excuse_used,
                        "matched_pattern": matched_pattern,
                        "identity_vote": identity_vote,
                        "call_id": call_id,
                    }
                )
                .execute()
            )

            if insert_result.data:
                return insert_result.data[0]["id"]
        except Exception as e2:
            logger.error(f"Fallback insert also failed: {e2}")

        return None


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
            pillar_type = Pillar(row["pillar"])
            state = PillarState(
                pillar=pillar_type,
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
# ONBOARDING HELPERS
# ═══════════════════════════════════════════════════════════════════════════════


async def create_complete_future_self(
    user_id: str,
    core_identity: str,
    primary_pillar: Pillar,
    the_why: str,
    pillars_data: List[Dict[str, Any]],
    dark_future: Optional[str] = None,
    quit_pattern: Optional[str] = None,
    favorite_excuse: Optional[str] = None,
    who_disappointed: Optional[List[str]] = None,
    fears: Optional[List[str]] = None,
    voice_urls: Optional[Dict[str, str]] = None,
) -> Optional[FutureSelf]:
    """
    Create a complete future_self with all pillars in one operation.
    Used during onboarding.

    Args:
        pillars_data: List of dicts with keys:
            - pillar: Pillar enum
            - current_state: str
            - future_state: str
            - identity_statement: str
            - non_negotiable: str
            - priority: int (optional)
    """
    # Create the future_self record
    future_self = await create_future_self(
        user_id=user_id,
        core_identity=core_identity,
        primary_pillar=primary_pillar,
        the_why=the_why,
        dark_future=dark_future,
        quit_pattern=quit_pattern,
        favorite_excuse=favorite_excuse,
        who_disappointed=who_disappointed,
        fears=fears,
    )

    if not future_self or not future_self.future_self_id:
        return None

    # Update voice URLs if provided
    if voice_urls:
        await update_future_self(
            user_id,
            {
                "future_self_intro_url": voice_urls.get("intro", ""),
                "why_recording_url": voice_urls.get("why", ""),
                "pledge_recording_url": voice_urls.get("pledge", ""),
            },
        )

    # Create all pillars
    for pdata in pillars_data:
        pillar = pdata.get("pillar")
        if not pillar or pillar not in ACTIONABLE_PILLARS:
            continue

        pillar_state = await create_pillar(
            user_id=user_id,
            future_self_id=future_self.future_self_id,
            pillar=pillar,
            current_state=pdata.get("current_state", ""),
            future_state=pdata.get("future_state", ""),
            identity_statement=pdata.get("identity_statement", ""),
            non_negotiable=pdata.get("non_negotiable", ""),
            priority=pdata.get("priority", 50),
        )

        if pillar_state:
            future_self.pillars[pillar] = pillar_state

    return future_self


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

    PILLAR_EMOJIS = {
        Pillar.BODY: "💪",
        Pillar.MISSION: "🎯",
        Pillar.STACK: "💰",
        Pillar.TRIBE: "👥",
        Pillar.WHY: "🧭",
    }

    lines = [
        "# TODAY'S FOCUS PILLARS",
        "Check in on these pillars during the call:",
        "",
    ]

    for p in pillars:
        emoji = PILLAR_EMOJIS.get(p.pillar, "📍")
        status = "🔴 NEEDS ATTENTION" if p.needs_attention else "🟢"

        lines.append(f"## {emoji} {p.pillar.value.upper()} {status}")

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
    "create_future_self",
    "get_future_self",
    "update_future_self",
    "create_pillar",
    "get_user_pillars",
    "get_pillar",
    "update_pillar_trust",
    "record_pillar_checkin",
    "get_pillar_checkins",
    "get_call_focus_pillars",
    "get_identity_alignment",
    "get_pillar_summary",
    "create_complete_future_self",
    "get_user_checkin_summary",
    "build_pillars_prompt_context",
    "build_pillar_checkin_summary_context",
]
