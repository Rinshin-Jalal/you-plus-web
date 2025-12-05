"""
Goal Service - Check-ins and Focus
===================================

Check-in recording and call focus goal selection.
"""

from typing import Optional, List, Dict, Any
import logging

from services.goals.models import Task, GoalFocus, CheckinResult
from services.goals.crud import get_supabase_client, task_from_row

logger = logging.getLogger(__name__)


async def get_call_focus_goals(user_id: str, limit: int = 3) -> List[GoalFocus]:
    """
    Get goals to focus on for this call.

    Uses the database function get_call_focus_goals() which prioritizes:
    1. Goals needing attention (low trust, not checked recently)
    2. Goals with broken streaks
    3. Then by priority
    """
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = client.rpc(
            "get_call_focus_goals", {"p_user_id": user_id, "p_limit": limit}
        ).execute()

        if not result.data:
            return []

        focus_goals = []
        for row in result.data:
            tasks = await get_tasks_to_check(row["goal_id"])

            focus_goals.append(
                GoalFocus(
                    goal_id=row["goal_id"],
                    goal_text=row["goal_text"],
                    goal_category=row.get("goal_category"),
                    priority=row.get("priority", 50),
                    trust_score=row.get("trust_score", 50),
                    days_since_checked=row.get("days_since_checked", 999),
                    active_task_count=row.get("active_task_count", 0),
                    needs_attention=row.get("needs_attention", False),
                    tasks=tasks,
                )
            )

        return focus_goals

    except Exception as e:
        logger.error(f"Failed to get call focus goals: {e}")
        return []


async def get_tasks_to_check(goal_id: str) -> List[Task]:
    """Get tasks that should be checked for a goal today."""
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = client.rpc("get_goal_tasks_to_check", {"p_goal_id": goal_id}).execute()

        if not result.data:
            return []

        return [
            Task(
                id=row["task_id"],
                goal_id=goal_id,
                user_id="",
                task_text=row["task_text"],
                frequency=row.get("frequency", "daily"),
                preferred_time=row.get("preferred_time"),
                consecutive_kept=row.get("consecutive_kept", 0),
                consecutive_broken=row.get("consecutive_broken", 0),
                last_checked_at=row.get("last_checked_at"),
            )
            for row in result.data
            if row.get("should_check_today", True)
        ]

    except Exception as e:
        logger.error(f"Failed to get tasks to check: {e}")
        return []


async def record_checkin(
    task_id: str,
    user_id: str,
    kept: bool,
    excuse_text: Optional[str] = None,
    excuse_pattern: Optional[str] = None,
    call_id: Optional[str] = None,
) -> Optional[CheckinResult]:
    """
    Record a task check-in.

    Uses the database function record_task_checkin() which:
    - Creates the check-in record
    - Updates task streaks
    - Updates goal trust score
    - Updates overall trust score
    """
    client = get_supabase_client()
    if not client:
        return None

    try:
        result = client.rpc(
            "record_task_checkin",
            {
                "p_task_id": task_id,
                "p_user_id": user_id,
                "p_kept": kept,
                "p_excuse_text": excuse_text,
                "p_excuse_pattern": excuse_pattern,
                "p_call_id": call_id,
            },
        ).execute()

        if not result.data:
            return None

        row = result.data[0]
        new_kept = row.get("new_consecutive_kept", 0)

        streak_milestone = None
        if kept and new_kept in [7, 14, 30, 100]:
            streak_milestone = new_kept

        return CheckinResult(
            checkin_id=row["checkin_id"],
            new_consecutive_kept=new_kept,
            new_consecutive_broken=row.get("new_consecutive_broken", 0),
            trust_delta=row.get("trust_delta", 0),
            streak_milestone=streak_milestone,
        )

    except Exception as e:
        logger.error(f"Failed to record checkin: {e}")
        return None


async def get_user_checkin_summary(user_id: str, days: int = 7) -> Dict[str, Any]:
    """Get check-in summary for prompt context."""
    client = get_supabase_client()
    if not client:
        return {}

    try:
        result = client.rpc(
            "get_user_checkin_summary", {"p_user_id": user_id, "p_days": days}
        ).execute()

        if result.data:
            return result.data[0]
        return {}
    except Exception as e:
        logger.error(f"Failed to get checkin summary: {e}")
        return {}


__all__ = [
    "get_call_focus_goals",
    "get_tasks_to_check",
    "record_checkin",
    "get_user_checkin_summary",
]
