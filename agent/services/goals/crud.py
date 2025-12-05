"""
Goal Service - Core CRUD Operations
=====================================

Goal and Task CRUD operations with Supabase.
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

from services.goals.models import Goal, Task

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


def goal_from_row(row: Dict[str, Any]) -> Goal:
    """Convert database row to Goal object."""
    return Goal(
        id=row["id"],
        user_id=row["user_id"],
        goal_text=row["goal_text"],
        goal_category=row.get("goal_category"),
        goal_deadline=row.get("goal_deadline"),
        priority=row.get("priority", 50),
        trust_score=row.get("trust_score", 50),
        status=row.get("status", "active"),
        supermemory_synced=row.get("supermemory_synced", False),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


def task_from_row(row: Dict[str, Any]) -> Task:
    """Convert database row to Task object."""
    return Task(
        id=row["id"],
        goal_id=row["goal_id"],
        user_id=row["user_id"],
        task_text=row["task_text"],
        frequency=row.get("frequency", "daily"),
        specific_days=row.get("specific_days"),
        preferred_time=row.get("preferred_time"),
        consecutive_kept=row.get("consecutive_kept", 0),
        consecutive_broken=row.get("consecutive_broken", 0),
        total_kept=row.get("total_kept", 0),
        total_checked=row.get("total_checked", 0),
        last_checked_at=row.get("last_checked_at"),
        status=row.get("status", "active"),
    )


async def create_goal(
    user_id: str,
    goal_text: str,
    category: Optional[str] = None,
    deadline: Optional[str] = None,
    priority: int = 50,
) -> Optional[Goal]:
    """Create a new goal in Supabase."""
    client = get_supabase_client()
    if not client:
        logger.error("No Supabase client available")
        return None

    try:
        result = (
            client.table("goals")
            .insert(
                {
                    "user_id": user_id,
                    "goal_text": goal_text,
                    "goal_category": category,
                    "goal_deadline": deadline,
                    "priority": priority,
                    "trust_score": 50,
                    "status": "active",
                    "supermemory_synced": False,
                }
            )
            .execute()
        )

        if not result.data:
            return None

        return goal_from_row(result.data[0])

    except Exception as e:
        logger.error(f"Failed to create goal: {e}")
        return None


async def get_goal(goal_id: str) -> Optional[Goal]:
    """Get a goal by ID."""
    client = get_supabase_client()
    if not client:
        return None

    try:
        result = client.table("goals").select("*").eq("id", goal_id).single().execute()
        if result.data:
            return goal_from_row(result.data)
        return None
    except Exception as e:
        logger.error(f"Failed to get goal: {e}")
        return None


async def get_user_goals(user_id: str, status: str = "active") -> List[Goal]:
    """Get all goals for a user."""
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = (
            client.table("goals")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", status)
            .order("priority", desc=True)
            .execute()
        )

        if result.data:
            return [goal_from_row(row) for row in result.data]
        return []
    except Exception as e:
        logger.error(f"Failed to get user goals: {e}")
        return []


async def update_goal_priority(goal_id: str, priority: int) -> bool:
    """Update a goal's AI-managed priority."""
    client = get_supabase_client()
    if not client:
        return False

    try:
        client.table("goals").update(
            {
                "priority": max(0, min(100, priority)),
                "updated_at": datetime.now().isoformat(),
            }
        ).eq("id", goal_id).execute()
        return True
    except Exception as e:
        logger.error(f"Failed to update goal priority: {e}")
        return False


async def mark_goal_synced(goal_id: str) -> bool:
    """Mark goal as synced to Supermemory."""
    client = get_supabase_client()
    if not client:
        return False

    try:
        client.table("goals").update({"supermemory_synced": True}).eq(
            "id", goal_id
        ).execute()
        return True
    except Exception as e:
        logger.error(f"Failed to mark goal synced: {e}")
        return False


async def create_task(
    goal_id: str,
    user_id: str,
    task_text: str,
    frequency: str = "daily",
    specific_days: Optional[List[int]] = None,
    preferred_time: Optional[str] = None,
) -> Optional[Task]:
    """Create a task for a goal."""
    client = get_supabase_client()
    if not client:
        return None

    try:
        result = (
            client.table("tasks")
            .insert(
                {
                    "goal_id": goal_id,
                    "user_id": user_id,
                    "task_text": task_text,
                    "frequency": frequency,
                    "specific_days": specific_days,
                    "preferred_time": preferred_time,
                    "status": "active",
                }
            )
            .execute()
        )

        if result.data:
            return task_from_row(result.data[0])
        return None
    except Exception as e:
        logger.error(f"Failed to create task: {e}")
        return None


async def get_goal_tasks(goal_id: str, active_only: bool = True) -> List[Task]:
    """Get all tasks for a goal."""
    client = get_supabase_client()
    if not client:
        return []

    try:
        query = client.table("tasks").select("*").eq("goal_id", goal_id)
        if active_only:
            query = query.eq("status", "active")
        result = query.execute()

        if result.data:
            return [task_from_row(row) for row in result.data]
        return []
    except Exception as e:
        logger.error(f"Failed to get goal tasks: {e}")
        return []


__all__ = [
    "get_supabase_client",
    "goal_from_row",
    "task_from_row",
    "create_goal",
    "get_goal",
    "get_user_goals",
    "update_goal_priority",
    "mark_goal_synced",
    "create_task",
    "get_goal_tasks",
]
