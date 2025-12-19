"""
Session Handler
===============

Handles LiveKit voice sessions, setting up the VoiceAssistant pipeline
and managing the conversation flow.
"""

import os
import asyncio
from typing import Optional

from loguru import logger
from livekit import rtc
from livekit.agents import JobContext, AgentSession
from livekit.plugins import silero, deepgram, cartesia

from core.agent import FutureYouAgent
from core.handlers.context import fetch_session_context
from core.handlers.post_session import handle_session_end
from core.config import (
    build_system_prompt_v2,
    build_system_prompt_v3,
    build_first_message,
)
from core.llm_adapter import BedrockLLMAdapter
from agents.analyzers import run_background_analysis
from agents.aggregator import CallSummaryAggregator

# Persona system integration
try:
    from conversation.persona import PersonaController
    from services.trust_score import trust_score_service

    PERSONA_AVAILABLE = True
except ImportError:
    PersonaController = None
    trust_score_service = None
    PERSONA_AVAILABLE = False

# Default voice (fallback if user has no clone)
DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091"


async def handle_session(ctx: JobContext, participant: rtc.RemoteParticipant):
    """
    Handle a voice session with a participant.

    This sets up the VoiceAssistant pipeline and manages the conversation.

    Args:
        ctx: LiveKit job context
        participant: The remote participant (user)
    """
    # Extract user_id from participant metadata or identity
    metadata = _parse_participant_metadata(participant)
    user_id = metadata.get("user_id", participant.identity)

    if not user_id or user_id == "unknown":
        logger.warning("No user_id provided, rejecting session")
        return

    logger.info(f"Starting session for user: {user_id}")

    # Fetch user context
    session_context = await fetch_session_context(user_id)
    if not session_context:
        logger.warning(f"Could not fetch context for user {user_id}")
        return

    user_context = session_context["user_context"]
    call_memory = session_context["call_memory"]
    excuse_data = session_context["excuse_data"]
    call_type = session_context["call_type"]
    mood = session_context["mood"]
    yesterday_promise_kept = session_context["yesterday_promise_kept"]

    status = user_context.get("status", {})
    current_streak = status.get("current_streak_days", 0)

    logger.info(f"📞 Call type: {call_type.name} | 🎭 Mood: {mood.name}")

    # Initialize persona controller
    persona_controller = await _init_persona(
        user_id, user_context, call_memory, yesterday_promise_kept
    )

    # Build system prompt
    system_prompt = await _build_prompt(
        user_id,
        user_context,
        call_type,
        mood,
        call_memory,
        excuse_data,
        persona_controller,
    )

    # Create the agent
    agent = FutureYouAgent(
        system_prompt=system_prompt,
        user_id=user_id,
        user_context=user_context,
        call_type=call_type,
        mood=mood,
        call_memory=call_memory,
        persona_controller=persona_controller,
    )

    # Setup aggregator
    call_aggregator = CallSummaryAggregator(user_id, call_type.name, mood.name)
    call_aggregator.start()

    # Get voice configuration
    future_self = user_context.get("future_self", {})
    voice_id = future_self.get("cartesia_voice_id") or DEFAULT_VOICE_ID

    # Initialize components
    vad = ctx.proc.userdata.get("vad") or silero.VAD.load()
    stt = deepgram.STT(
        model="nova-2",
        language="en",
    )
    tts = cartesia.TTS(
        voice=voice_id,
        model="sonic-english",
        speed=_get_speed_for_mood(mood),
    )

    # For now, use direct agent response generation
    # TODO: Implement proper AgentSession integration with BedrockLLMAdapter
    logger.info("Agent session started with custom LLM")

    # Manual session loop (simplified for now)
    # This is a temporary implementation until we fully refactor for v1.3.9
    logger.warning("Using simplified session handling - full v1.3.9 refactor needed")

    logger.info("Session setup complete")

    # Wait for session to end
    # The session ends when the participant disconnects or we detect call end
    try:
        while not agent.call_ended:
            # Check if participant is still connected
            if participant.sid not in [p.sid for p in ctx.room.remote_participants.values()]:
                logger.info("Participant disconnected")
                break
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Session cancelled")

    # End of session processing
    await handle_session_end(
        user_id=user_id,
        user_context=user_context,
        call_memory=call_memory,
        call_type=call_type,
        mood=mood,
        current_streak=current_streak,
        agent=agent,
        aggregator=call_aggregator,
        persona_controller=persona_controller,
    )

    logger.info(f"Session ended for user: {user_id}")


def _parse_participant_metadata(participant: rtc.RemoteParticipant) -> dict:
    """Parse participant metadata to extract user info."""
    import json

    metadata = {}
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
        except json.JSONDecodeError:
            logger.warning(f"Could not parse participant metadata: {participant.metadata}")
    return metadata


async def _init_persona(user_id, user_context, call_memory, yesterday_promise_kept):
    """Initialize PersonaController if available."""
    if not PERSONA_AVAILABLE or not PersonaController or not trust_score_service:
        return None

    trust_score = await trust_score_service.get_overall_trust(user_id)
    controller = PersonaController(trust_score, yesterday_promise_kept)
    controller.set_severity_level(call_memory.get("severity_level", 1))
    logger.info(f"🎭 Persona: {controller.get_primary_persona().value}")
    return controller


async def _build_prompt(
    user_id, user_context, call_type, mood, call_memory, excuse_data, persona_controller
):
    """Build personalized system prompt."""
    if persona_controller:
        return await build_system_prompt_v3(
            user_id,
            user_context,
            call_type,
            mood,
            call_memory,
            excuse_data,
            persona_controller,
        )
    return await build_system_prompt_v2(
        user_id, user_context, call_type, mood, call_memory, excuse_data
    )


def _get_speed_for_mood(mood) -> float:
    """Get TTS speed based on mood."""
    if hasattr(mood, "speed_ratio"):
        return mood.speed_ratio
    return 1.0


def _feed_aggregator(aggregator: CallSummaryAggregator, insight):
    """Feed an insight to the aggregator."""
    from agents.events import (
        SentimentAnalysis,
        ExcuseDetected,
        PromiseResponse,
        CommitmentIdentified,
        MemorableQuoteDetected,
        PatternAlert,
    )

    if isinstance(insight, SentimentAnalysis):
        aggregator.add_sentiment(insight)
    elif isinstance(insight, ExcuseDetected):
        aggregator.add_excuse(insight)
    elif isinstance(insight, PromiseResponse):
        aggregator.add_promise(insight)
    elif isinstance(insight, CommitmentIdentified):
        aggregator.add_commitment(insight)
    elif isinstance(insight, MemorableQuoteDetected):
        aggregator.add_quote(insight)
    elif isinstance(insight, PatternAlert):
        aggregator.add_pattern(insight)


__all__ = ["handle_session"]
