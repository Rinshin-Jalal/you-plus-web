"""
FutureYouNode - SIMPLIFIED Voice Agent (NO STAGES!)
====================================================

Single prompt with natural conversation flow - no manual stage tracking!
The prompt describes what should happen and when, LLM handles the rest.
"""

import os
import re
from typing import Optional, Callable, Any
from datetime import datetime

import aiohttp
from loguru import logger

from livekit.agents import Agent
from livekit.agents.llm import ChatContext, ChatMessage

from core.models import FutureYouSessionData
from agents.events import (
    ExcuseDetected,
    SentimentAnalysis,
    CommitmentIdentified,
    PromiseResponse,
    MemorableQuoteDetected,
)
from conversation.call_types import CallType
from conversation.mood import Mood

# Persona system integration
try:
    from conversation.persona import PersonaController, Persona
    PERSONA_AVAILABLE = True
except ImportError:
    PersonaController = None
    Persona = None
    PERSONA_AVAILABLE = False
    logger.warning("Persona system not available")

DEFAULT_TEMPERATURE = 0.7
BACKEND_URL = os.getenv("BACKEND_URL", "https://youplus-backend.workers.dev")


class FutureYouNode(Agent):
    """
    Main agent - NO STAGES! Just natural conversation flow guided by the prompt.
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
    ):
        super().__init__(instructions=system_prompt)
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

        # Call state (NO STAGES - just track what matters!)
        self.total_turns = 0
        self.kept_promise: Optional[bool] = None
        self.tomorrow_commitment: Optional[str] = None
        self.call_ended = False
        self.start_time = datetime.now()

        # Insights from background agents
        self._pending_insights: list = []
        self._current_sentiment: Optional[str] = None
        self._excuse_detected: Optional[ExcuseDetected] = None
        self._quotes_this_call: list = []

        self._log_init_info()

    async def on_enter(self) -> None:
        """Called when agent becomes active - LLM generates opening based on system prompt context."""
        logger.info(f"FutureYouNode entered - natural flow mode")

        if hasattr(self.session, 'userdata') and isinstance(self.session.userdata, FutureYouSessionData):
            self.user_id = self.session.userdata.user_id

        # System prompt already has: mood, call_type, persona, day number, yesterday's outcome, etc.
        # Just tell the LLM to generate the opening - it knows what to do!
        await self.session.generate_reply(
            instructions="Generate your opening line (1-2 sentences max). Then wait for their response."
        )

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
        """Called after a user message."""
        text = new_message.text_content
        if not text:
            return

        self.total_turns += 1
        logger.info(f'Turn {self.total_turns}: "{text}"')


        # Build insights context from background agents
        insight_context = self._build_insight_context()

        if insight_context:
            # Add insights as guidance
            turn_ctx.add_message(
                role="system",
                content=insight_context
            )

    def _detect_promise_response(self, message: str) -> None:
        """Detect YES/NO for promise tracking."""
        lower = message.lower().strip()

        yes_patterns = [r"\byes\b", r"\byeah\b", r"\byep\b", r"\byup\b", r"\bdid it\b", r"\bi did\b", r"\bcompleted\b"]
        no_patterns = [r"\bno\b", r"\bnope\b", r"\bdidn\'?t\b", r"\bnah\b", r"\bnot yet\b", r"\bcouldn\'?t\b"]

        if any(re.search(pattern, lower) for pattern in yes_patterns):
            self.kept_promise = True
            logger.info("✅ Promise KEPT detected")
        elif any(re.search(pattern, lower) for pattern in no_patterns):
            self.kept_promise = False
            logger.info("❌ Promise BROKEN detected")

    def add_insight(self, insight: Any) -> None:
        """Receive insights from background agents."""
        logger.info(f"Received insight: {type(insight).__name__}")

        if isinstance(insight, ExcuseDetected):
            label = "(MATCHES FAVORITE!)" if insight.matches_favorite else ""
            self._pending_insights.append(f"[EXCUSE DETECTED: '{insight.excuse_text}' {label}]")
        elif isinstance(insight, SentimentAnalysis):
            if insight.sentiment in ("frustrated", "defensive", "deflecting"):
                self._pending_insights.append(f"[SENTIMENT: User seems {insight.sentiment}]")
        elif isinstance(insight, CommitmentIdentified):
            if insight.is_specific:
                self.tomorrow_commitment = f"{insight.action} at {insight.time}"
                self._pending_insights.append(f"[COMMITMENT: {insight.action} at {insight.time} - SPECIFIC!]")
        elif isinstance(insight, PromiseResponse):
            if insight.kept is not None:
                self.kept_promise = insight.kept
        elif isinstance(insight, MemorableQuoteDetected):
            self._quotes_this_call.append({
                "text": insight.quote_text,
                "context": insight.context,
                "emotional_weight": insight.emotional_weight,
            })

    def _build_insight_context(self) -> str:
        """Build context from pending insights."""
        if not self._pending_insights:
            return ""
        text = "\n".join(self._pending_insights)
        self._pending_insights = []
        return f"\n[BACKGROUND INSIGHTS - use to inform response:]\n{text}\n"

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
        """Return updated call_memory with quotes."""
        updated = dict(self.call_memory)
        updated["memorable_quotes"] = (
            updated.get("memorable_quotes", []) + self._quotes_this_call
        )[-20:]
        return updated

    def get_call_duration_seconds(self) -> int:
        """Get call duration in seconds."""
        return int((datetime.now() - self.start_time).total_seconds())


__all__ = ["FutureYouNode"]
