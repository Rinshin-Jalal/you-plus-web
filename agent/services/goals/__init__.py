"""
Goals Package
==============

Multi-Goal Management with Supabase + Supermemory.
"""

from services.goals.models import (
    Goal,
    Task,
    GoalFocus,
    CheckinResult,
)

from services.goals.crud import (
    create_goal,
    get_goal,
    get_user_goals,
    update_goal_priority,
    create_task,
    get_goal_tasks,
)

from services.goals.checkins import (
    get_call_focus_goals,
    get_tasks_to_check,
    record_checkin,
    get_user_checkin_summary,
)

from services.goals.memory import (
    sync_goal_to_supermemory,
    get_goal_context_from_supermemory,
)

__all__ = [
    # Models
    "Goal",
    "Task",
    "GoalFocus",
    "CheckinResult",
    # CRUD
    "create_goal",
    "get_goal",
    "get_user_goals",
    "update_goal_priority",
    "create_task",
    "get_goal_tasks",
    # Check-ins
    "get_call_focus_goals",
    "get_tasks_to_check",
    "record_checkin",
    "get_user_checkin_summary",
    # Memory
    "sync_goal_to_supermemory",
    "get_goal_context_from_supermemory",
]
