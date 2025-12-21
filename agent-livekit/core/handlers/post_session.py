"""
Post-Session Handler
====================

Handles end-of-session processing: saving analytics, updating memory, etc.
"""

from typing import Optional

from loguru import logger

from core.agent import FutureYouNode
from agents.aggregator import CallSummaryAggregator
from services.user_context import upsert_call_memory

# Import config functions for saving analytics
try:
    from core.config import save_call_analytics

    ANALYTICS_AVAILABLE = True
except ImportError:
    save_call_analytics = None
    ANALYTICS_AVAILABLE = False


async def handle_session_end(
    user_id: str,
    user_context: dict,
    call_memory: dict,
    call_type,
    mood,
    current_streak: int,
    agent: FutureYouNode,
    aggregator: CallSummaryAggregator,
    # Removed persona_controller
):
    """
    Handle end of session processing.

    - Save call analytics
    - Update call memory
    - Report call result
    - Update trust score
    """
    logger.info(f"Processing end of session for user: {user_id}")

    # Finalize aggregator
    call_duration = agent.get_call_duration_seconds()
    call_summary = aggregator.finalize(call_duration)

    # Save call analytics
    if ANALYTICS_AVAILABLE and save_call_analytics:
        await save_call_analytics(call_summary)

    # Update call memory
    updated_memory = agent.get_updated_call_memory()
    updated_memory["last_call_type"] = call_type.name
    updated_memory["last_mood"] = mood.name

    if agent.tomorrow_commitment:
        updated_memory["last_commitment"] = agent.tomorrow_commitment
        updated_memory["last_commitment_specific"] = agent.commitment_is_specific

    # Update call type history
    call_type_history = updated_memory.get("call_type_history", [])
    call_type_history.append(call_type.name)
    updated_memory["call_type_history"] = call_type_history[-14:]  # Keep last 14

    # Save updated call memory
    await upsert_call_memory(user_id, updated_memory)

    # Report call result to backend
    await agent.report_call_result()

    # Update persona severity if needed
    # Severity tracking (for future use if needed)
    if agent.kept_promise is False:
        severity = updated_memory.get("severity_level", 1)
        updated_memory["severity_level"] = min(severity + 1, 5)
    elif agent.kept_promise is True:
        severity = updated_memory.get("severity_level", 1)
        updated_memory["severity_level"] = max(severity - 1, 1)

    logger.info(
        f"Session complete: duration={call_duration}s, "
        f"promise_kept={agent.kept_promise}, "
        f"commitment={agent.tomorrow_commitment}"
    )


__all__ = ["handle_session_end"]
