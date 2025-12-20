"""
FutureYouNode - Voice Agent for YOU+ Future Self
=================================================

Main speaking agent that uses LiveKit Agents SDK.
Implements stage-based conversation flow with background analysis.

Uses:
- Cartesia Ink for STT
- Cartesia for TTS (with voice cloning)
- Custom LLM client for AWS Bedrock
"""

import os
import re
import asyncio
import json
from typing import Optional, Callable, Any, List, Dict
from datetime import datetime

import aiohttp
from loguru import logger
from pydantic import BaseModel

from livekit.agents import Agent, function_tool, RunContext
from livekit.agents.llm import ChatContext, ChatMessage

from core.models import FutureYouSessionData
from agents.events import (
    ExcuseDetected,
    ExcuseCallout,
    SentimentAnalysis,
    CommitmentIdentified,
    PromiseResponse,
    UserFrustrated,
    PatternAlert,
    MemorableQuoteDetected,
)
from conversation.call_types import CallType
from conversation.mood import Mood
from conversation.stages.models import CallStage
from conversation.stages.transitions import (
    get_stage_prompt,
    get_next_stage,
    should_advance_stage,
    build_transition_check_prompt,
)
from core.llm import llm_analyze
from core.llm_client import stream_response, stream_raw, call as llm_call

# Persona system integration
try:
    from conversation.persona import PersonaController, Persona

    PERSONA_AVAILABLE = True
except ImportError:
    PersonaController = None
    Persona = None
    PERSONA_AVAILABLE = False
    logger.warning("Persona system not available")

# Memory tools integration
try:
    from services.supermemory import execute_memory_tool, MEMORY_TOOLS

    MEMORY_TOOLS_AVAILABLE = True
except ImportError:
    execute_memory_tool = None
    MEMORY_TOOLS = []
    MEMORY_TOOLS_AVAILABLE = False
    logger.warning("Memory tools not available")


DEFAULT_TEMPERATURE = 0.7
BACKEND_URL = os.getenv("BACKEND_URL", "https://youplus-backend.workers.dev")


class FutureYouNode(Agent):
    """
    Main station agent for the Future Self accountability call.
    Handles the HOOK, ACKNOWLEDGE, and CLOSE phases.
    """

    def __init__(
        self,
        system_prompt: str,
        user_id: str = "unknown",
        user_context: Optional[dict] = None,
        call_type: Optional[CallType] = None,
        mood: Optional[Mood] = None,
        call_memory: Optional[dict] = None,
        persona_controller: Optional[Any] = None,
        temperature: float = DEFAULT_TEMPERATURE,
        max_output_tokens: int = 150,
        # LiveKit Agent components
        stt=None,
        tts=None,
        vad=None,
        llm=None,
    ):
        super().__init__(
            instructions=system_prompt,
            stt=stt,
            tts=tts,
            vad=vad,
            llm=llm,
        )
        self.system_prompt = system_prompt
        self.temperature = temperature
        self.user_id = user_id
        self.user_context = user_context or {}
        self.call_type = call_type
        self.mood = mood
        self.call_memory = call_memory or {}
        self.max_output_tokens = max_output_tokens
        self.persona_controller = persona_controller

        # Conversation history (OpenAI format)
        self.messages: list[dict] = [{"role": "system", "content": system_prompt}]

        # Stage tracking
        self.current_stage = CallStage.HOOK
        self.turns_in_stage = 0
        self.total_turns = 0

        # Call state
        self.kept_promise: Optional[bool] = None
        self.tomorrow_commitment: Optional[str] = None
        self.commitment_is_specific: bool = False
        self.call_ended = False
        self.start_time = datetime.now()

        # Insights from background agents
        self._pending_insights: list = []
        self._current_sentiment: Optional[str] = None
        self._excuse_detected: Optional[ExcuseDetected] = None
        self._frustration_level: Optional[str] = None
        self._quotes_this_call: list = []
        self._peaks_this_call: list = []

        self._log_init_info()

    async def on_enter(self, context: RunContext) -> None:
        """Called when this station becomes active."""
        logger.info(f"FutureYouNode entered. Stage: {self.current_stage.value}")
        
        # Sync state from userdata if available
        if hasattr(self.session, 'userdata') and isinstance(self.session.userdata, FutureYouSessionData):
            self.user_id = self.session.userdata.user_id
            # Note: current_station value 'hook' should map to CallStage.HOOK
            station_val = self.session.userdata.current_station
            try:
                self.current_stage = CallStage(station_val)
            except ValueError:
                self.current_stage = CallStage.HOOK

        # If we just started, generate the hook
        if self.current_stage == CallStage.HOOK:
            await self.session.generate_reply(
                instructions="Introduce yourself as the user's Future Self and deliver the daily check-in hook."
            )

    @function_tool()
    async def start_audit(self, context: RunContext[FutureYouSessionData]):
        """Handoff control to the TruthNode to verify today's promise."""
        from agents.stations.truth_node import TruthNode
        
        logger.info("Station Handoff: FutureYouNode -> TruthNode")
        context.userdata.current_station = "truth"
        
        return TruthNode(
            system_prompt=self.system_prompt,
            user_id=self.user_id,
            user_context=self.user_context,
            call_type=self.call_type,
            mood=self.mood,
            call_memory=self.call_memory,
            persona_controller=self.persona_controller,
            # Pass components to new station
            stt=self.stt,
            tts=self.tts,
            vad=self.vad,
            llm=self.llm,
        ), "Transferring to accountability audit."

    def _log_init_info(self) -> None:
        """Log initialization info."""
        logger.info(f"FutureYouNode initialized for user: {self.user_id}")
        if self.call_type:
            logger.info(f"Call type: {self.call_type.name}")
        if self.mood:
            logger.info(f"Mood: {self.mood.name}")
        if self.persona_controller and PERSONA_AVAILABLE:
            primary = self.persona_controller.get_primary_persona()
            logger.info(f"Starting persona: {primary.value}")

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        """Called after a user message is added to the chat context."""
        text = new_message.text_content()
        if not text:
            return

        self.total_turns += 1
        self.turns_in_stage += 1

        logger.info(f'Processing: "{text}"')
        self._detect_promise_response(text)

        # Check stage advancement
        await self._maybe_advance_stage_llm(text)

        # Build context-aware instructions for this turn
        stage_context = self._build_stage_context()
        insight_context = self._build_insight_context()
        combined = stage_context + ("\n" + insight_context if insight_context else "")

        if combined:
            # Add as a system message to guide the LLM's next response
            turn_ctx.add_message(
                role="system",
                content=combined
            )
        
        logger.info(f"Stage: {self.current_stage.value} (turn {self.turns_in_stage})")

    def _detect_promise_response(self, message: str) -> None:
        """Detect YES/NO for promise tracking using word boundaries."""
        lower = message.lower().strip()

        yes_patterns = [
            r"\byes\b",
            r"\byeah\b",
            r"\byep\b",
            r"\byup\b",
            r"\bdid it\b",
            r"\bi did\b",
            r"\bcompleted\b",
        ]
        no_patterns = [
            r"\bno\b",
            r"\bnope\b",
            r"\bdidn\'?t\b",
            r"\bnah\b",
            r"\bnot yet\b",
            r"\bcouldn\'?t\b",
        ]

        if any(re.search(pattern, lower) for pattern in yes_patterns):
            self.kept_promise = True
            logger.info("Promise KEPT detected")
        elif any(re.search(pattern, lower) for pattern in no_patterns):
            self.kept_promise = False
            logger.info("Promise BROKEN detected")

    async def _handle_response_end(
        self, response: str, user_message: Optional[str]
    ) -> None:
        """Handle end of response - check for call end and stage advance."""
        # Check for call end
        end_indicators = ["take care", "talk tomorrow", "goodbye", "bye for now"]
        if any(ind in response.lower() for ind in end_indicators):
            if self.current_stage == CallStage.CLOSE:
                logger.info("Ending call (close stage + goodbye)")
                self.call_ended = True

        # Extract commitment
        if "tomorrow" in response.lower() and "?" not in response:
            self.tomorrow_commitment = self._extract_commitment(response)

        # Check stage advancement
        if user_message:
            await self._maybe_advance_stage_llm(user_message)

    def _extract_commitment(self, response: str) -> Optional[str]:
        """Extract commitment from response."""
        lower = response.lower()
        if "you'll" in lower or "you will" in lower:
            return response[:200]
        return None

    def add_insight(self, insight: Any) -> None:
        """Receive and process insights from background agents."""
        logger.info(f"Received insight: {type(insight).__name__}")

        if isinstance(insight, ExcuseDetected):
            self._handle_excuse_insight(insight)
        elif isinstance(insight, SentimentAnalysis):
            self._handle_sentiment_insight(insight)
        elif isinstance(insight, CommitmentIdentified):
            self._handle_commitment_insight(insight)
        elif isinstance(insight, PromiseResponse):
            self._handle_promise_insight(insight)
        elif isinstance(insight, UserFrustrated):
            self._handle_frustration_insight(insight)
        elif isinstance(insight, PatternAlert):
            self._handle_pattern_insight(insight)
        elif isinstance(insight, MemorableQuoteDetected):
            self._handle_quote_insight(insight)
        elif isinstance(insight, ExcuseCallout):
            self._handle_callout_insight(insight)

    def _handle_excuse_insight(self, insight: ExcuseDetected) -> None:
        self._excuse_detected = insight
        label = "(MATCHES FAVORITE!)" if insight.matches_favorite else ""
        self._pending_insights.append(
            f"[EXCUSE DETECTED: '{insight.excuse_text}' {label}]"
        )
        if self.persona_controller and PERSONA_AVAILABLE:
            self.persona_controller.update_from_insight(
                "excuse_detected",
                {
                    "excuse_text": insight.excuse_text,
                    "matches_favorite": insight.matches_favorite,
                },
            )

    def _handle_sentiment_insight(self, insight: SentimentAnalysis) -> None:
        self._current_sentiment = insight.sentiment
        if insight.sentiment in ("frustrated", "defensive", "deflecting"):
            self._pending_insights.append(
                f"[SENTIMENT: User seems {insight.sentiment}. "
                f"Indicators: {', '.join(insight.indicators[:3])}]"
            )
        if self.persona_controller and PERSONA_AVAILABLE:
            energy = insight.indicators[0] if insight.indicators else "medium"
            self.persona_controller.update_from_insight(
                "sentiment_analysis", {"sentiment": insight.sentiment, "energy": energy}
            )

    def _handle_commitment_insight(self, insight: CommitmentIdentified) -> None:
        if insight.is_specific:
            self.tomorrow_commitment = f"{insight.action} at {insight.time}"
            self.commitment_is_specific = True
            self._pending_insights.append(
                f"[COMMITMENT: {insight.action} at {insight.time} - SPECIFIC!]"
            )
        elif insight.action:
            self.tomorrow_commitment = insight.action
            self._pending_insights.append(
                f"[VAGUE COMMITMENT: {insight.action} (no time - push for details)]"
            )

    def _handle_promise_insight(self, insight: PromiseResponse) -> None:
        if insight.kept is not None:
            self.kept_promise = insight.kept
            logger.info(
                f"{'✅' if insight.kept else '❌'} Promise kept: {insight.kept}"
            )
        if self.persona_controller and PERSONA_AVAILABLE:
            self.persona_controller.update_from_insight(
                "promise_response", {"kept": insight.kept}
            )

    def _handle_frustration_insight(self, insight: UserFrustrated) -> None:
        self._frustration_level = insight.frustration_level
        self._pending_insights.append(
            f"[USER FRUSTRATED ({insight.frustration_level}): {insight.suggested_action}]"
        )

    def _handle_pattern_insight(self, insight: PatternAlert) -> None:
        self._pending_insights.append(
            f"[PATTERN: {insight.pattern_type} - {insight.description}]"
        )
        if insight.historical_context:
            self._pending_insights.append(f"[HISTORY: {insight.historical_context}]")
        if self.persona_controller and PERSONA_AVAILABLE:
            self.persona_controller.update_from_insight(
                "pattern_alert", {"pattern_type": insight.pattern_type}
            )

    def _handle_quote_insight(self, insight: MemorableQuoteDetected) -> None:
        streak = self.user_context.get("status", {}).get("current_streak_days", 0)
        self._quotes_this_call.append(
            {
                "text": insight.quote_text,
                "context": insight.context,
                "day": streak,
                "emotional_weight": insight.emotional_weight,
            }
        )
        logger.info(f'Stored quote ({insight.context}): "{insight.quote_text[:50]}..."')

    def _handle_callout_insight(self, insight: ExcuseCallout) -> None:
        self._pending_insights.append(
            f"[CALLOUT ({insight.callout_type}): '{insight.suggested_response}']"
        )

    def _build_insight_context(self) -> str:
        """Build context from pending insights."""
        if not self._pending_insights:
            return ""
        text = "\n".join(self._pending_insights)
        self._pending_insights = []
        return f"\n[BACKGROUND INSIGHTS - use to inform response:]\n{text}\n"

    def _build_stage_context(self) -> str:
        """Build stage-specific instructions."""
        parts = [
            f"\n[CURRENT STAGE: {self.current_stage.value.upper()}]",
            get_stage_prompt(self.current_stage),
        ]

        if self.persona_controller and PERSONA_AVAILABLE:
            parts.append(f"\n{self.persona_controller.get_persona_prompt()}")

        if self.current_stage == CallStage.DIG_DEEPER:
            if self.kept_promise is True:
                parts.append("\n[STATE: User said YES - kept promise]")
            elif self.kept_promise is False:
                parts.append("\n[STATE: User said NO - broke promise]")

        if self.current_stage == CallStage.TOMORROW_LOCK:
            if self.tomorrow_commitment and self.commitment_is_specific:
                parts.append(
                    f"\n[STATE: Got commitment: {self.tomorrow_commitment}. Move to close.]"
                )
            else:
                parts.append("\n[STATE: Need SPECIFIC commitment (action + time)]")

        if self.current_stage == CallStage.CLOSE:
            parts.append("\n[STATE: Deliver closing line, then END THE CALL]")

        return "\n".join(parts)

    async def _maybe_advance_stage_llm(self, user_message: str) -> None:
        """Use LLM to decide stage advancement."""
        if self.turns_in_stage < 1:
            return

        next_stage = get_next_stage(self.current_stage)
        if not next_stage:
            return

        def extract_text(content_item) -> str:
            if isinstance(content_item, dict):
                return content_item.get("text", "")
            return str(content_item) if content_item is not None else ""

        recent = [
            {
                "role": (
                    "assistant"
                    if m.get("role") == "assistant"
                    else "model"
                    if m.get("role") == "model"
                    else "system"
                    if m.get("role") == "system"
                    else "user"
                ),
                "parts": (
                    m.get("parts")
                    or (
                        [{"text": extract_text(c)} for c in m["content"]]
                        if isinstance(m.get("content"), list)
                        else [{"text": str(m.get("content", ""))}]
                    )
                ),
            }
            for m in self.messages[-4:]
        ]
        prompt = build_transition_check_prompt(self.current_stage, recent)

        if not prompt:
            self._maybe_advance_stage()
            return

        try:
            response = await llm_analyze(prompt=prompt, temperature=0.0, max_tokens=10)
            if response and "YES" in response.upper():
                old = self.current_stage.value
                self.current_stage = next_stage
                self.turns_in_stage = 0
                logger.info(f"LLM transition: {old} → {next_stage.value}")
        except Exception as e:
            logger.warning(f"LLM check failed, using rules: {e}")
            self._maybe_advance_stage()

    def _maybe_advance_stage(self) -> None:
        """Rule-based stage advancement (fallback)."""
        if self.turns_in_stage < 1:
            return

        if should_advance_stage(
            current_stage=self.current_stage,
            turns_in_stage=self.turns_in_stage,
            promise_answered=self.kept_promise is not None,
            commitment_locked=self.commitment_is_specific,
        ):
            next_stage = get_next_stage(self.current_stage)
            if next_stage:
                old = self.current_stage.value
                self.current_stage = next_stage
                self.turns_in_stage = 0
                logger.info(f"Stage transition: {old} → {next_stage.value}")

    async def report_call_result(self):
        """Report call result to backend."""
        if self.user_id == "unknown":
            return

        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "user_id": self.user_id,
                    "kept_promise": self.kept_promise,
                    "call_type": "accountability_checkin",
                }
                if self.tomorrow_commitment:
                    payload["tomorrow_commitment"] = self.tomorrow_commitment

                async with session.post(
                    f"{BACKEND_URL}/api/calls/report",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        logger.info(f"Call result reported for {self.user_id}")
        except Exception as e:
            logger.error(f"Error reporting call result: {e}")

    def get_updated_call_memory(self) -> dict:
        """Return updated call_memory with quotes and peaks."""
        updated = dict(self.call_memory)
        updated["memorable_quotes"] = (
            updated.get("memorable_quotes", []) + self._quotes_this_call
        )[-20:]
        updated["emotional_peaks"] = (
            updated.get("emotional_peaks", []) + self._peaks_this_call
        )[-10:]

        streak = self.user_context.get("status", {}).get("current_streak_days", 0)
        if streak >= 60:
            updated["narrative_arc"] = "mastery"
        elif streak >= 30:
            updated["narrative_arc"] = "transformation"
        elif streak >= 14:
            updated["narrative_arc"] = "building_momentum"
        elif streak >= 7:
            updated["narrative_arc"] = "proving_ground"
        else:
            updated["narrative_arc"] = "early_struggle"

        return updated

    def get_call_duration_seconds(self) -> int:
        """Get call duration in seconds."""
        return int((datetime.now() - self.start_time).total_seconds())


__all__ = ["FutureYouNode"]
