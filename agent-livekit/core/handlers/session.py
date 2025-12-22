"""
Session Handler
===============

Handles LiveKit voice sessions, setting up the VoiceAssistant pipeline
and managing the conversation flow.
"""

import asyncio
import json
from typing import Optional

from loguru import logger
import os
from livekit import rtc
from livekit.agents import JobContext, AgentSession
from livekit.plugins import silero, cartesia, aws

from core.agent import FutureYouNode
from core.models import FutureYouSessionData
from core.handlers.context import fetch_session_context
from core.config import build_prompt
from services.future_self_service import get_future_self

# Default voice (fallback if user has no clone)
DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091"


async def handle_session(ctx: JobContext, participant: rtc.RemoteParticipant) -> None:
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
    personality = session_context["personality"]  # V5: personality instead of mood
    yesterday_promise_kept = session_context["yesterday_promise_kept"]

    logger.info(f"📞 Call type: {call_type.name} | 🎭 Personality: {personality.emotional_weather} ({personality.relationship_phase})")

    # Build system prompt (V5)
    system_prompt = await _build_prompt(
        user_id=user_id,
        user_context=user_context,
        call_type=call_type,
        call_memory=call_memory,
        yesterday_promise_kept=yesterday_promise_kept,
    )

    # Initialize shared session data
    userdata = FutureYouSessionData(user_id=user_id, current_station="hook")

    # Initialize components
    vad = ctx.proc.userdata.get("vad") or silero.VAD.load()
    stt = cartesia.STT(model="ink-whisper", language="en")
    
    # Use official LiveKit AWS Bedrock plugin
    bedrock_model = os.getenv("BEDROCK_MODEL", "qwen.qwen3-next-80b-a3b")
    bedrock_region = os.getenv("BEDROCK_REGION", "us-west-2")
    llm = aws.LLM(
        model=bedrock_model,
        region=bedrock_region,
        temperature=0.7,
    )

    future_self = user_context.get("future_self", {})
    voice_id = future_self.get("cartesia_voice_id") or DEFAULT_VOICE_ID
    tts = cartesia.TTS(
        voice=voice_id,
        model="sonic-3",  # Use sonic-3 for speed/emotion support
        speed=_get_speed_for_personality(personality),
    )

    # Create the initial agent station
    initial_agent = FutureYouNode(
        system_prompt=system_prompt,
        user_id=user_id,
        user_context=user_context,
        call_type=call_type,
        personality=personality,  # V5: personality instead of mood
        call_memory=call_memory,
    )

    # Create the multi-agent session with components
    session = AgentSession(
        stt=stt,
        llm=llm,
        tts=tts,
        vad=vad,
    )

    # Set userdata BEFORE starting session (on_enter needs it)
    session.userdata = userdata

    # Start the session with room, agent
    await session.start(
        room=ctx.room,
        agent=initial_agent,
    )

    logger.info("Voice session started successfully")


def _parse_participant_metadata(participant: rtc.RemoteParticipant) -> dict:
    """Parse participant metadata to extract user info."""
    metadata = {}
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
        except json.JSONDecodeError:
            logger.warning(
                f"Could not parse participant metadata: {participant.metadata}"
            )
    return metadata


async def _build_prompt(
    user_id: str,
    user_context: dict,
    call_type,
    call_memory: dict,
    yesterday_promise_kept: Optional[bool],
) -> str:
    """Build personalized system prompt using V5 behavioral engine."""
    # Fetch FutureSelf object for V5
    future_self_obj = await get_future_self(user_id)

    return await build_prompt(
        user_id=user_id,
        user_context=user_context,
        call_type=call_type,
        call_memory=call_memory,
        future_self=future_self_obj,
        kept_promise_yesterday=yesterday_promise_kept,
        recent_promises=[],  # TODO: Extract from call_history if needed
    )


def _get_speed_for_personality(personality) -> float:
    """
    Get TTS speed based on personality emotional state.

    V5: Varies speed based on emotional weather and urgency.
    - High urgency/frustration = faster (1.1-1.2x)
    - Reflective/vulnerable = slower (0.9-0.95x)
    - Default = normal (1.0x)
    """
    weather = personality.emotional_weather
    urgency = personality.urgency

    # Fast weathers
    if weather in ["fed_up", "intense", "testing"]:
        return 1.15

    # Slow weathers
    if weather in ["reflective", "vulnerable", "disappointed"]:
        return 0.92

    # Urgency modifier
    if urgency > 7:
        return 1.1

    return 1.0


__all__ = ["handle_session"]