"""
Goals Service - Multi-Goal Management with Supabase + Supermemory
=================================================================

Manages user goals and tasks across two data stores:
- Supabase: Structured data (goals, tasks, check-ins, trust scores)
- Supermemory: Psychological context (why goals matter, fears, patterns)

Goals are added through conversations, not app UI.
AI determines priority and which goals to focus on each call.
"""

import os
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime, date
import logging

try:
    from supabase import create_client

    HAS_SUPABASE = True
except ImportError:
    create_client = None  # type: ignore
    HAS_SUPABASE = False

from .supermemory import supermemory_service

logger = logging.getLogger(__name__)


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


# ═══════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ═══════════════════════════════════════════════════════════════════════════════


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


# ═══════════════════════════════════════════════════════════════════════════════
# GOALS SERVICE
# ═══════════════════════════════════════════════════════════════════════════════


class GoalService:
    """
    Service for managing goals across Supabase + Supermemory.

    Usage:
        service = GoalService()

        # Get goals to focus on for a call
        focus_goals = await service.get_call_focus_goals(user_id, limit=3)

        # Create a new goal (from conversation)
        goal = await service.create_goal(
            user_id=user_id,
            goal_text="Get to 150lbs",
            category="health",
            why_it_matters="I want to be healthy for my kids"
        )

        # Record a check-in
        result = await service.record_checkin(
            task_id=task_id,
            user_id=user_id,
            kept=True
        )
    """

    def __init__(self):
        self._client: Any = None

    def _get_client(self) -> Any:
        """Get or create Supabase client."""
        if self._client is None:
            if SUPABASE_URL and SUPABASE_SERVICE_KEY and create_client:
                try:
                    self._client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
                except Exception as e:
                    logger.error(f"Failed to create Supabase client: {e}")
        return self._client

    # ─────────────────────────────────────────────────────────────────────────
    # GOAL CRUD
    # ─────────────────────────────────────────────────────────────────────────

    async def create_goal(
        self,
        user_id: str,
        goal_text: str,
        category: Optional[str] = None,
        deadline: Optional[str] = None,
        priority: int = 50,
        why_it_matters: Optional[str] = None,
        biggest_obstacle: Optional[str] = None,
    ) -> Optional[Goal]:
        """
        Create a new goal from conversation.

        Stores structured data in Supabase, psychological context in Supermemory.

        Args:
            user_id: User's ID
            goal_text: The goal (e.g., "Get to 150lbs")
            category: health, career, relationships, finance, personal, learning, other
            deadline: Free text deadline (e.g., "by March 2025")
            priority: Initial priority 0-100 (AI will adjust)
            why_it_matters: Emotional reason (stored in Supermemory)
            biggest_obstacle: What's blocked them (stored in Supermemory)
        """
        client = self._get_client()
        if not client:
            logger.error("No Supabase client available")
            return None

        try:
            # Insert into Supabase
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

            goal_data = result.data[0]
            goal_id = goal_data["id"]

            # Store psychological context in Supermemory
            if why_it_matters or biggest_obstacle:
                await self._sync_goal_to_supermemory(
                    user_id=user_id,
                    goal_id=goal_id,
                    goal_text=goal_text,
                    category=category,
                    why_it_matters=why_it_matters,
                    biggest_obstacle=biggest_obstacle,
                )

                # Mark as synced
                client.table("goals").update({"supermemory_synced": True}).eq(
                    "id", goal_id
                ).execute()

            return Goal(
                id=goal_id,
                user_id=user_id,
                goal_text=goal_text,
                goal_category=category,
                goal_deadline=deadline,
                priority=priority,
                trust_score=50,
                status="active",
            )

        except Exception as e:
            logger.error(f"Failed to create goal: {e}")
            return None

    async def get_goal(self, goal_id: str) -> Optional[Goal]:
        """Get a goal by ID."""
        client = self._get_client()
        if not client:
            return None

        try:
            result = (
                client.table("goals").select("*").eq("id", goal_id).single().execute()
            )
            if result.data:
                return self._goal_from_row(result.data)
            return None
        except Exception as e:
            logger.error(f"Failed to get goal: {e}")
            return None

    async def get_user_goals(self, user_id: str, status: str = "active") -> List[Goal]:
        """Get all goals for a user."""
        client = self._get_client()
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
                return [self._goal_from_row(row) for row in result.data]
            return []
        except Exception as e:
            logger.error(f"Failed to get user goals: {e}")
            return []

    async def update_goal_priority(self, goal_id: str, priority: int) -> bool:
        """Update a goal's AI-managed priority."""
        client = self._get_client()
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

    # ─────────────────────────────────────────────────────────────────────────
    # TASK CRUD
    # ─────────────────────────────────────────────────────────────────────────

    async def create_task(
        self,
        goal_id: str,
        user_id: str,
        task_text: str,
        frequency: str = "daily",
        specific_days: Optional[List[int]] = None,
        preferred_time: Optional[str] = None,
    ) -> Optional[Task]:
        """
        Create a task for a goal.

        Args:
            goal_id: Parent goal ID
            user_id: User's ID
            task_text: The task (e.g., "Work out for 30 minutes")
            frequency: daily, weekly, specific_days, as_needed
            specific_days: [1,3,5] for Mon/Wed/Fri (1=Mon, 7=Sun)
            preferred_time: When they plan to do it
        """
        client = self._get_client()
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
                return self._task_from_row(result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            return None

    async def get_goal_tasks(
        self, goal_id: str, active_only: bool = True
    ) -> List[Task]:
        """Get all tasks for a goal."""
        client = self._get_client()
        if not client:
            return []

        try:
            query = client.table("tasks").select("*").eq("goal_id", goal_id)
            if active_only:
                query = query.eq("status", "active")
            result = query.execute()

            if result.data:
                return [self._task_from_row(row) for row in result.data]
            return []
        except Exception as e:
            logger.error(f"Failed to get goal tasks: {e}")
            return []

    # ─────────────────────────────────────────────────────────────────────────
    # CALL FOCUS - Which goals to discuss this call
    # ─────────────────────────────────────────────────────────────────────────

    async def get_call_focus_goals(
        self, user_id: str, limit: int = 3
    ) -> List[GoalFocus]:
        """
        Get goals to focus on for this call.

        Uses the database function get_call_focus_goals() which prioritizes:
        1. Goals needing attention (low trust, not checked recently)
        2. Goals with broken streaks
        3. Then by priority

        Returns GoalFocus objects with their tasks attached.
        """
        client = self._get_client()
        if not client:
            return []

        try:
            # Call the database function
            result = client.rpc(
                "get_call_focus_goals", {"p_user_id": user_id, "p_limit": limit}
            ).execute()

            if not result.data:
                return []

            focus_goals = []
            for row in result.data:
                # Get tasks for this goal
                tasks = await self.get_tasks_to_check(row["goal_id"])

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

    async def get_tasks_to_check(self, goal_id: str) -> List[Task]:
        """
        Get tasks that should be checked for a goal today.

        Uses the database function get_goal_tasks_to_check().
        """
        client = self._get_client()
        if not client:
            return []

        try:
            result = client.rpc(
                "get_goal_tasks_to_check", {"p_goal_id": goal_id}
            ).execute()

            if not result.data:
                return []

            return [
                Task(
                    id=row["task_id"],
                    goal_id=goal_id,
                    user_id="",  # Not returned by function
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

    # ─────────────────────────────────────────────────────────────────────────
    # CHECK-INS
    # ─────────────────────────────────────────────────────────────────────────

    async def record_checkin(
        self,
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

        Args:
            task_id: Task being checked
            user_id: User's ID
            kept: Whether they completed the task
            excuse_text: Raw excuse text if not kept
            excuse_pattern: Normalized pattern (too_tired, no_time, etc.)
            call_id: Optional call ID for tracking

        Returns:
            CheckinResult with streak info and trust delta
        """
        client = self._get_client()
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

            # Check for streak milestones
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

    async def get_user_checkin_summary(
        self, user_id: str, days: int = 7
    ) -> Dict[str, Any]:
        """
        Get check-in summary for prompt context.

        Returns stats like total check-ins, keep rate, top excuse pattern.
        """
        client = self._get_client()
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

    # ─────────────────────────────────────────────────────────────────────────
    # SUPERMEMORY INTEGRATION
    # ─────────────────────────────────────────────────────────────────────────

    async def _sync_goal_to_supermemory(
        self,
        user_id: str,
        goal_id: str,
        goal_text: str,
        category: Optional[str],
        why_it_matters: Optional[str],
        biggest_obstacle: Optional[str],
    ) -> bool:
        """
        Store goal's psychological context in Supermemory.

        This allows the AI to understand WHY the goal matters,
        not just what it is.
        """
        content = f"""
NEW GOAL ADDED
==============
Goal: {goal_text}
Category: {category or "Not specified"}
Goal ID: {goal_id}

PSYCHOLOGICAL CONTEXT
---------------------
Why This Matters to Them:
{why_it_matters or "Not shared yet - explore in conversation"}

Biggest Obstacle They've Faced:
{biggest_obstacle or "Not shared yet - explore in conversation"}

---
This goal was added through conversation. The AI should:
1. Reference this goal's emotional significance when they need motivation
2. Anticipate the obstacle patterns if they start making excuses
3. Celebrate wins in context of WHY this goal matters to them
"""

        return (
            await supermemory_service.add_memory(
                container_tag=user_id,
                content=content,
                metadata={
                    "type": "goal_context",
                    "goal_id": goal_id,
                    "goal_text": goal_text,
                    "category": category,
                    "timestamp": datetime.now().isoformat(),
                },
            )
            is not None
        )

    async def get_goal_context_from_supermemory(
        self, user_id: str, goal_text: str
    ) -> Optional[str]:
        """
        Search Supermemory for context about a specific goal.

        Useful for getting the "why it matters" during a call.
        """
        profile, results = await supermemory_service.get_profile_with_search(
            user_id=user_id, query=f"goal: {goal_text}"
        )

        if results:
            return results[0].get("content", "")
        return None

    # ─────────────────────────────────────────────────────────────────────────
    # HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    def _goal_from_row(self, row: Dict[str, Any]) -> Goal:
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

    def _task_from_row(self, row: Dict[str, Any]) -> Task:
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


# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT CONTEXT BUILDERS
# ═══════════════════════════════════════════════════════════════════════════════


def build_goals_prompt_context(focus_goals: List[GoalFocus]) -> str:
    """
    Build prompt context section for goals to focus on.

    Used in system prompt to tell the AI what to check on.
    """
    if not focus_goals:
        return """
# GOALS TO DISCUSS
No active goals found. Ask them what they're working toward.
"""

    lines = ["# GOALS TO FOCUS ON THIS CALL\n"]

    for i, goal in enumerate(focus_goals, 1):
        attention_flag = " (NEEDS ATTENTION)" if goal.needs_attention else ""
        lines.append(f"## Goal {i}: {goal.goal_text}{attention_flag}")
        lines.append(f"Category: {goal.goal_category or 'General'}")
        lines.append(f"Trust Score: {goal.trust_score}/100")
        lines.append(f"Days Since Checked: {goal.days_since_checked}")

        if goal.tasks:
            lines.append("\nTasks to check:")
            for task in goal.tasks:
                streak_info = ""
                if task.consecutive_kept > 0:
                    streak_info = f" ({task.consecutive_kept} day streak)"
                elif task.consecutive_broken > 0:
                    streak_info = f" (broken {task.consecutive_broken} days)"
                lines.append(f"- {task.task_text}{streak_info}")

        lines.append("")

    return "\n".join(lines)


def build_checkin_summary_context(summary: Dict[str, Any]) -> str:
    """
    Build prompt context for check-in summary.

    Shows recent patterns for the AI to reference.
    """
    if not summary:
        return ""

    total = summary.get("total_checkins", 0)
    if total == 0:
        return ""

    kept = summary.get("total_kept", 0)
    broken = summary.get("total_broken", 0)
    rate = summary.get("keep_rate", 0)
    top_excuse = summary.get("top_excuse_pattern", "")
    excuse_count = summary.get("top_excuse_count", 0)
    low_trust_goals = summary.get("goals_with_low_trust", 0)

    lines = [
        "\n# RECENT PATTERNS (Last 7 Days)",
        f"Check-ins: {total} total, {kept} kept, {broken} broken",
        f"Keep Rate: {rate}%",
    ]

    if top_excuse and excuse_count >= 2:
        lines.append(f'Favorite Excuse: "{top_excuse}" (used {excuse_count}x)')

    if low_trust_goals > 0:
        lines.append(f"Goals Needing Attention: {low_trust_goals}")

    return "\n".join(lines)


# Singleton instance
goal_service = GoalService()
