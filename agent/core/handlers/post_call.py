"""
Post-Call Processing
=====================

End-of-call analytics, memory updates, trust scores, and Supermemory sync.
"""

import sys
from pathlib import Path

AGENT_DIR = Path(__file__).parent.parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from loguru import logger

from core.config import (
    upsert_call_memory,
    save_call_analytics,
    save_excuse_pattern,
)
from services.supermemory import supermemory_service

# Persona system integration
try:
    from services.trust_score import trust_score_service

    PERSONA_AVAILABLE = True
except ImportError:
    trust_score_service = None
    PERSONA_AVAILABLE = False


async def handle_call_end(
    user_id: str,
    user_context: dict,
    call_memory: dict,
    call_type,
    mood,
    current_streak: int,
    conversation_node,
    call_aggregator,
    persona_controller,
):
    """Handle all end-of-call processing."""
    call_summary = call_aggregator.finalize()
    logger.info(
        f"📊 Call Summary: quality={call_summary.call_quality_score:.0%}, "
        f"promise_kept={call_summary.promise_kept}, "
        f"commitment={'specific' if call_summary.commitment_is_specific else 'vague' if call_summary.tomorrow_commitment else 'none'}"
    )

    await conversation_node.report_call_result()

    updated_memory = conversation_node.get_updated_call_memory()
    updated_memory["last_call_type"] = call_type.name
    updated_memory["last_mood"] = mood.name
    updated_memory["last_call_quality"] = call_summary.call_quality_score

    if call_summary.tomorrow_commitment:
        updated_memory["last_commitment"] = call_summary.tomorrow_commitment
        updated_memory["last_commitment_time"] = call_summary.commitment_time
        updated_memory["last_commitment_specific"] = call_summary.commitment_is_specific

    call_type_history = call_memory.get("call_type_history", [])
    call_type_history.append(call_type.name)
    updated_memory["call_type_history"] = call_type_history[-10:]

    await upsert_call_memory(user_id, updated_memory)
    await save_call_analytics(call_summary)

    await _update_trust_scores(
        user_id,
        user_context,
        current_streak,
        call_summary,
        persona_controller,
        updated_memory,
    )

    await _save_excuse_patterns(
        user_id, user_context, current_streak, call_type, call_aggregator
    )

    await _save_to_supermemory(
        user_id,
        user_context,
        current_streak,
        call_type,
        mood,
        conversation_node,
        call_summary,
    )


async def _update_trust_scores(
    user_id: str,
    user_context: dict,
    current_streak: int,
    call_summary,
    persona_controller,
    updated_memory: dict,
):
    """Update trust scores based on call outcome."""
    if not PERSONA_AVAILABLE or not trust_score_service:
        return

    if call_summary.promise_kept is None:
        return

    identity = user_context.get("identity", {})
    onboarding = identity.get("onboarding_context", {})
    favorite_excuse = onboarding.get("favorite_excuse", "")
    used_favorite = (
        any(
            favorite_excuse.lower() in excuse.lower()
            for excuse in call_summary.excuses_detected
        )
        if favorite_excuse and call_summary.excuses_detected
        else False
    )

    trust_result = await trust_score_service.apply_checkin_result(
        user_id=user_id,
        task_id="legacy_commitment",
        goal_id="",
        kept=call_summary.promise_kept,
        used_favorite_excuse=used_favorite,
        streak_count=current_streak,
    )

    logger.info(
        f"📈 Trust updated: {trust_result['old_trust']} -> {trust_result['new_trust']} "
        f"({trust_result['reason']})"
    )

    if persona_controller:
        updated_memory["severity_level"] = persona_controller.user_state.severity_level
        updated_memory["current_persona"] = (
            persona_controller.get_primary_persona().value
        )


async def _save_excuse_patterns(
    user_id: str,
    user_context: dict,
    current_streak: int,
    call_type,
    call_aggregator,
):
    """Save detected excuse patterns."""
    if not call_aggregator.excuses:
        return

    logger.info(f"💾 Saving {len(call_aggregator.excuses)} excuse patterns...")

    identity = user_context.get("identity", {})
    onboarding = identity.get("onboarding_context", {})
    favorite_excuse = onboarding.get("favorite_excuse", "")

    for excuse_event in call_aggregator.excuses:
        matches_favorite = (
            favorite_excuse.lower() in excuse_event.excuse_text.lower()
            if favorite_excuse
            else False
        )

        await save_excuse_pattern(
            user_id=user_id,
            excuse_text=excuse_event.excuse_text,
            matches_favorite=matches_favorite,
            confidence=excuse_event.confidence,
            streak_day=current_streak,
            call_type=call_type.name,
        )


async def _save_to_supermemory(
    user_id: str,
    user_context: dict,
    current_streak: int,
    call_type,
    mood,
    conversation_node,
    call_summary,
):
    """Save call transcript to Supermemory."""
    if not supermemory_service.enabled:
        return

    logger.info("📝 Sending call transcript to Supermemory...")

    transcript = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in conversation_node.messages
        if msg["role"] in ("user", "assistant")
    ]

    call_history = user_context.get("call_history", [])
    call_number = len(call_history) + 1

    outcomes = {
        "promise_kept": call_summary.promise_kept,
        "tomorrow_commitment": call_summary.tomorrow_commitment,
        "commitment_time": call_summary.commitment_time,
        "commitment_specific": call_summary.commitment_is_specific,
        "excuses": call_summary.excuses_detected,
        "key_quote": call_summary.quotes_captured[0]
        if call_summary.quotes_captured
        else "",
        "emotional_peak": call_summary.sentiment_trajectory[-1]
        if call_summary.sentiment_trajectory
        else "neutral",
        "call_quality_score": call_summary.call_quality_score,
    }

    success = await supermemory_service.add_call_transcript(
        user_id=user_id,
        call_number=call_number,
        streak_day=current_streak,
        call_type=call_type.name,
        mood=mood.name,
        transcript=transcript,
        outcomes=outcomes,
    )

    if success:
        logger.info(f"✅ Call #{call_number} saved to Supermemory")
    else:
        logger.warning("⚠️ Failed to save call transcript to Supermemory")


__all__ = ["handle_call_end"]
