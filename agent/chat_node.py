"""
FutureYouNode - Voice-optimized ReasoningNode for YOU+ Future Self agent
"""

import asyncio
import os
from typing import AsyncGenerator, Optional, Union

import aiohttp
from google import genai
from google.genai import types as gemini_types
from loguru import logger

from line.events import AgentResponse, EndCall
from line.nodes.conversation_context import ConversationContext
from line.nodes.reasoning import ReasoningNode
from line.tools.system_tools import EndCallArgs, EndCallTool, end_call
from line.utils.gemini_utils import convert_messages_to_gemini

DEFAULT_MODEL_ID = os.getenv("MODEL_ID", "gemini-2.5-flash")
DEFAULT_TEMPERATURE = 0.7
BACKEND_URL = os.getenv("BACKEND_URL", "https://youplus-backend.workers.dev")


class FutureYouNode(ReasoningNode):
    """
    Voice-optimized ReasoningNode for the Future Self accountability agent.

    Extends the base ReasoningNode with:
    - YES/NO promise detection
    - Tomorrow's commitment extraction
    - Call result reporting to backend
    """

    def __init__(
        self,
        system_prompt: str,
        gemini_client: Optional[genai.Client] = None,
        user_id: str = "unknown",
        user_context: Optional[dict] = None,
        model_id: str = DEFAULT_MODEL_ID,
        temperature: float = DEFAULT_TEMPERATURE,
        max_context_length: int = 100,
        max_output_tokens: int = 500,  # Shorter for phone calls
    ):
        super().__init__(
            system_prompt=system_prompt, max_context_length=max_context_length
        )

        self.client = gemini_client
        self.model_id = model_id
        self.temperature = temperature
        self.user_id = user_id
        self.user_context = user_context or {}

        # Call state tracking
        self.kept_promise: Optional[bool] = None
        self.tomorrow_commitment: Optional[str] = None
        self.call_ended = False

        # Interruption support
        self.stop_generation_event = None

        # Create generation config
        self.generation_config = gemini_types.GenerateContentConfig(
            system_instruction=self.system_prompt,
            temperature=self.temperature,
            tools=[EndCallTool.to_gemini_tool()],
            max_output_tokens=max_output_tokens,
            thinking_config=gemini_types.ThinkingConfig(thinking_budget=0),
        )

        logger.info(f"FutureYouNode initialized for user: {user_id}")

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[Union[AgentResponse, EndCall], None]:
        """
        Process the conversation context and yield responses from Gemini.
        Also tracks promise keeping and tomorrow's commitment.
        """
        if not context.events:
            logger.info("No messages to process")
            return

        messages = convert_messages_to_gemini(context.events)

        user_message = context.get_latest_user_transcript_message()
        if user_message:
            logger.info(f'🧠 Processing user message: "{user_message}"')

            # Detect YES/NO for promise tracking
            lower_msg = user_message.lower().strip()
            if any(
                word in lower_msg
                for word in [
                    "yes",
                    "yeah",
                    "yep",
                    "yup",
                    "did it",
                    "i did",
                    "completed",
                ]
            ):
                self.kept_promise = True
                logger.info("✅ User indicated they kept their promise")
            elif any(
                word in lower_msg
                for word in ["no", "nope", "didn't", "nah", "not yet", "couldn't"]
            ):
                self.kept_promise = False
                logger.info("❌ User indicated they did not keep their promise")

        full_response = ""

        if not self.client:
            # Fallback if no Gemini client
            yield AgentResponse(
                content="I'm having trouble connecting. Let's try again tomorrow."
            )
            return

        stream = await self.client.aio.models.generate_content_stream(
            model=self.model_id,
            contents=messages,
            config=self.generation_config,
        )

        async for msg in stream:
            if msg.text:
                full_response += msg.text
                yield AgentResponse(content=msg.text)

            if msg.function_calls:
                for function_call in msg.function_calls:
                    if function_call.name == EndCallTool.name():
                        goodbye_message = function_call.args.get(
                            "goodbye_message", "Take care. Talk tomorrow."
                        )
                        args = EndCallArgs(goodbye_message=goodbye_message)
                        logger.info(f"🤖 Ending call with: {args.goodbye_message}")
                        self.call_ended = True
                        async for item in end_call(args):
                            yield item

        if full_response:
            logger.info(
                f'🤖 Agent response: "{full_response}" ({len(full_response)} chars)'
            )

            # Try to extract tomorrow's commitment from the response
            # This is a simple heuristic - could be improved with better prompting
            if "tomorrow" in full_response.lower() and "?" not in full_response:
                # The agent confirmed a commitment
                self.tomorrow_commitment = self._extract_commitment(full_response)

    def _extract_commitment(self, response: str) -> Optional[str]:
        """Try to extract a commitment from the agent's response."""
        # Simple extraction - look for patterns like "you'll do X tomorrow"
        # This could be enhanced with better parsing
        lower = response.lower()
        if "you'll" in lower or "you will" in lower:
            # Return the full response as the commitment context
            return response[:200]  # Limit length
        return None

    async def report_call_result(self):
        """Report the call result to the backend."""
        if self.user_id == "unknown":
            logger.warning("Cannot report call result - unknown user_id")
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
                        logger.info(f"✅ Call result reported for user {self.user_id}")
                    else:
                        logger.warning(f"⚠️ Failed to report call result: {resp.status}")

        except Exception as e:
            logger.error(f"💥 Error reporting call result: {e}")
