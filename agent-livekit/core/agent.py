"""
FutureYouNode - SIMPLIFIED Voice Agent (NO STAGES!)
===================================================

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

        # System prompt already has: mood, day number, yesterday's outcome, etc.
        # Let the LLM generate opening naturally based on conversation objectives in system prompt
        # No scripted opening - the system prompt should guide natural conversation start

    def _log_init_info(self) -> None:
        """Log initialization info."""
        logger.info(f"FutureYouNode initialized for user: {self.user_id}")

    async def on_user_turn_completed(
        self, turn_ctx: ChatContext, new_message: ChatMessage
    ) -> None:
        """Called after a user message."""
        text = new_message.content
        if not text:
            return

        self.total_turns += 1
        logger.info(f'Turn {self.total_turns}: "{text}"')

        # Let the LLM respond naturally based on the conversation objectives in the system prompt
        # No scripted responses - the prompt handles what should happen next

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

    def get_call_duration_seconds(self) -> int:
        """Get call duration in seconds."""
        return int((datetime.now() - self.start_time).total_seconds())


__all__ = ["FutureYouNode"]
