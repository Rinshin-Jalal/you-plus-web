"""
LLM Adapter for LiveKit
=======================

Adapts the FutureYouAgent to work with LiveKit's VoiceAssistant LLM interface.
"""

from typing import AsyncGenerator, Optional, Union
from dataclasses import dataclass, field

from loguru import logger
from livekit.agents import llm as lk_llm
from livekit.agents.llm import ChatContext, ChatMessage, ChatRole

from core.agent import FutureYouAgent


@dataclass
class ChatChunk:
    """Represents a chunk of chat response."""

    choices: list = field(default_factory=list)

    @property
    def content(self) -> str:
        if self.choices:
            return self.choices[0].get("delta", {}).get("content", "")
        return ""


class BedrockLLMAdapter(lk_llm.LLM):
    """
    Adapts FutureYouAgent to LiveKit's LLM interface.

    This allows the VoiceAssistant to use our custom agent logic
    while maintaining compatibility with the LiveKit pipeline.
    """

    def __init__(self, agent: FutureYouAgent):
        super().__init__()
        self._agent = agent
        self._chat_ctx = ChatContext()
        # Initialize with system prompt
        self._chat_ctx.messages.append(
            ChatMessage(role=ChatRole.SYSTEM, content=agent.system_prompt)
        )

    @property
    def chat_ctx(self) -> ChatContext:
        return self._chat_ctx

    async def chat(
        self,
        chat_ctx: ChatContext,
        fnc_ctx: Optional[lk_llm.FunctionContext] = None,
        temperature: Optional[float] = None,
        n: Optional[int] = None,
        parallel_tool_calls: Optional[bool] = None,
    ) -> "LLMStream":
        """
        Generate a chat response.

        This is called by VoiceAssistant when user stops speaking.
        """
        # Get the latest user message
        user_message = ""
        for msg in reversed(chat_ctx.messages):
            if msg.role == ChatRole.USER:
                user_message = msg.content
                break

        return LLMStream(self._agent, user_message)


class LLMStream(lk_llm.LLMStream):
    """
    Stream wrapper for agent responses.
    """

    def __init__(self, agent: FutureYouAgent, user_message: str):
        super().__init__()
        self._agent = agent
        self._user_message = user_message
        self._response: Optional[str] = None

    async def __anext__(self) -> lk_llm.ChatChunk:
        """Get the next chunk of the response."""
        if self._response is None:
            # Generate the full response
            self._response = await self._agent.generate_response(self._user_message)
            # Return the full response as a single chunk
            return lk_llm.ChatChunk(
                choices=[
                    lk_llm.Choice(
                        delta=lk_llm.ChoiceDelta(
                            role="assistant",
                            content=self._response,
                        ),
                        index=0,
                    )
                ]
            )
        else:
            raise StopAsyncIteration

    def __aiter__(self):
        return self

    async def aclose(self):
        pass


__all__ = ["BedrockLLMAdapter", "LLMStream"]
