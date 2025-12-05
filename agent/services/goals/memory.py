"""
Goal Service - Supermemory Integration
=======================================

Sync goal psychological context with Supermemory.
"""

from typing import Optional
from datetime import datetime
import logging

from services.supermemory import supermemory_service
from services.goals.crud import mark_goal_synced

logger = logging.getLogger(__name__)


async def sync_goal_to_supermemory(
    user_id: str,
    goal_id: str,
    goal_text: str,
    category: Optional[str],
    why_it_matters: Optional[str],
    biggest_obstacle: Optional[str],
) -> bool:
    """
    Store goal's psychological context in Supermemory.

    This allows the AI to understand WHY the goal matters.
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

    success = (
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

    if success:
        await mark_goal_synced(goal_id)

    return success


async def get_goal_context_from_supermemory(
    user_id: str, goal_text: str
) -> Optional[str]:
    """Search Supermemory for context about a specific goal."""
    _, results = await supermemory_service.get_profile_with_search(
        user_id=user_id, query=f"goal: {goal_text}"
    )

    if results:
        return results[0].get("content", "")
    return None


__all__ = [
    "sync_goal_to_supermemory",
    "get_goal_context_from_supermemory",
]
