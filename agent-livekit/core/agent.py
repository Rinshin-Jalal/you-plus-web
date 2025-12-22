"""
FutureYouNode - SIMPLIFIED Voice Agent (NO STAGES!)
====================================================

Single prompt with natural conversation flow - no manual stage tracking!
The prompt describes what should happen and when, LLM handles the rest.
"""

import os
from typing import Optional
from datetime import datetime

import aiohttp
from loguru import logger

from livekit.agents import Agent
from livekit.agents.llm import ChatContext, ChatMessage

from core.models import FutureYouSessionData

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
        temperature: float = DEFAULT_TEMPERATURE,
        max_output_tokens: int = 150,
    ):
        super().__init__(instructions=system_prompt)
        self.system_prompt = system_prompt
        self.temperature = temperature
        self.user_id = user_id
        self.user_context = user_context or {}
        self.max_output_tokens = max_output_tokens

        # Conversation history (OpenAI format)
        self.messages: list[dict] = [{"role": "system", "content": system_prompt}]

        # Call state (NO STAGES - just track what matters!)
        self.total_turns = 0
        self.kept_promise: Optional[bool] = None
        self.tomorrow_commitment: Optional[str] = None
        self.call_ended = False
        self.start_time = datetime.now()

        # Local quotes (tracked by agent itself)
        self._quotes_this_call: list = []

        self._log_init_info()

    async def on_enter(self) -> None:
        """Called when agent becomes active - LLM generates opening based on system prompt context."""
        logger.info(f"FutureYouNode entered - natural flow mode")

        if hasattr(self.session, "userdata") and isinstance(
            self.session.userdata, FutureYouSessionData
        ):
            self.user_id = self.session.userdata.user_id

    def _log_init_info(self) -> None:
        """Log initialization info."""
        logger.info(f"FutureYouNode initialized for user: {self.user_id}")

    def get_call_duration_seconds(self) -> int:
        """Get call duration in seconds."""
        return int((datetime.now() - self.start_time).total_seconds())


__all__ = ["FutureYouNode"]
