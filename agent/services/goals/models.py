"""
Goal Models
============

Data classes for goals, tasks, and check-ins.
"""

from typing import Optional, List
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Goal:
    """A user goal with structured data from Supabase."""

    id: str
    user_id: str
    goal_text: str
    goal_category: Optional[str] = None
    goal_deadline: Optional[str] = None
    priority: int = 50
    trust_score: int = 50
    status: str = "active"
    supermemory_synced: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class Task:
    """A task/action toward a goal."""

    id: str
    goal_id: str
    user_id: str
    task_text: str
    frequency: str = "daily"
    specific_days: Optional[List[int]] = None
    preferred_time: Optional[str] = None
    consecutive_kept: int = 0
    consecutive_broken: int = 0
    total_kept: int = 0
    total_checked: int = 0
    last_checked_at: Optional[datetime] = None
    status: str = "active"


@dataclass
class GoalFocus:
    """A goal selected for focus in a call."""

    goal_id: str
    goal_text: str
    goal_category: Optional[str]
    priority: int
    trust_score: int
    days_since_checked: int
    active_task_count: int
    needs_attention: bool
    tasks: List[Task] = field(default_factory=list)


@dataclass
class CheckinResult:
    """Result of recording a task check-in."""

    checkin_id: str
    new_consecutive_kept: int
    new_consecutive_broken: int
    trust_delta: int
    streak_milestone: Optional[int] = None  # 7, 14, 30, 100


__all__ = [
    "Goal",
    "Task",
    "GoalFocus",
    "CheckinResult",
]
