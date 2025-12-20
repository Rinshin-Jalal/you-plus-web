"""
LLM Adapter for LiveKit
=======================

Generic adapter for AWS Bedrock OpenAI-compatible API to work with LiveKit's LLM interface.
Updated for LiveKit Agents 1.x Tools API.
"""

from typing import AsyncGenerator, Optional, List, Any, Union
import json
from loguru import logger

from livekit.agents import llm as lk_llm
from livekit.agents.llm import (
    ChatContext, 
    ChatMessage, 
    ChatRole, 
    FunctionTool, 
    RawFunctionTool,
    LLM,
    LLMStream
)

from core.llm_client import stream_raw

class BedrockLLM(LLM):
    """
    Generic LiveKit LLM implementation for AWS Bedrock.
    """

    def __init__(self, model: str = "openai.gpt-oss-20b-1:0", temperature: float = 0.7):
        super().__init__()
        self._model = model
        self._temperature = temperature

    def chat(
        self,
        *,
        chat_ctx: ChatContext,
        fnc_ctx: Optional[Any] = None,
        temperature: Optional[float] = None,
        n: Optional[int] = None,
        parallel_tool_calls: Optional[bool] = None,
        tools: Optional[list[Union[FunctionTool, RawFunctionTool]]] = None,
        **kwargs
    ) -> "BedrockLLMStream":
        return BedrockLLMStream(
            llm=self,
            chat_ctx=chat_ctx,
            tools=tools or [],
            model=self._model,
            temperature=temperature or self._temperature,
        )

class BedrockLLMStream(LLMStream):
    """
    Stream wrapper for Bedrock responses.
    """

    def __init__(
        self,
        llm: "BedrockLLM",
        chat_ctx: ChatContext,
        model: str,
        temperature: float,
        tools: list[Union[FunctionTool, RawFunctionTool]],
    ):
        # In LiveKit 1.x, LLMStream.__init__ requires llm, chat_ctx, and tools
        super().__init__(llm, chat_ctx=chat_ctx, tools=tools, conn_options=None)
        self._model = model
        self._temperature = temperature
        self._it: Optional[AsyncGenerator[lk_llm.ChatChunk, None]] = None

    async def __anext__(self) -> lk_llm.ChatChunk:
        if self._it is None:
            self._it = self._run()
        return await self._it.__anext__()

    async def _run(self) -> AsyncGenerator[lk_llm.ChatChunk, None]:
        # Convert ChatContext to OpenAI format
        messages = []
        for msg in self._chat_ctx.messages:
            m = {"role": msg.role, "content": msg.content}
            if msg.tool_calls:
                m["tool_calls"] = [
                    {
                        "id": tc.tool_call_id,
                        "type": "function",
                        "function": {
                            "name": tc.function_info.name,
                            "arguments": json.dumps(tc.arguments),
                        },
                    }
                    for tc in msg.tool_calls
                ]
            if msg.tool_call_id:
                m["tool_call_id"] = msg.tool_call_id
            messages.append(m)

        # Prepare tools for Bedrock (OpenAI format)
        llm_tools = None
        if self._tools:
            llm_tools = []
            for tool in self._tools:
                llm_tools.append({
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.arguments,
                    },
                })

        try:
            async for chunk in stream_raw(
                messages=messages,
                temperature=self._temperature,
                tools=llm_tools,
            ):
                choices = []
                for choice in chunk.choices:
                    delta = choice.delta
                    
                    # Map tool calls
                    tool_calls = None
                    if delta.tool_calls:
                        tool_calls = []
                        for tc in delta.tool_calls:
                            tool_calls.append(lk_llm.ChatToolCallChunk(
                                index=tc.index,
                                tool_call_id=tc.id,
                                function_name=tc.function.name if tc.function else None,
                                function_arguments=tc.function.arguments if tc.function else None,
                            ))

                    choices.append(lk_llm.Choice(
                        index=choice.index,
                        delta=lk_llm.ChoiceDelta(
                            role=delta.role,
                            content=delta.content,
                            tool_calls=tool_calls,
                        ),
                        finish_reason=choice.finish_reason,
                    ))

                yield lk_llm.ChatChunk(choices=choices)

        except Exception as e:
            logger.error(f"Bedrock LLM stream failed: {e}")
            raise

class BedrockLLMAdapter(BedrockLLM):
    """Alias for backwards compatibility if needed."""
    pass

__all__ = ["BedrockLLM", "BedrockLLMStream", "BedrockLLMAdapter"]
