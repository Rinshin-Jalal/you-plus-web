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
from livekit.agents.llm import tool_context
from livekit.agents.llm import utils as llm_utils

from core.llm_client import stream_raw

class BedrockLLM(LLM):
    """
    Generic LiveKit LLM implementation for AWS Bedrock.
    """

    def __init__(self, model: str = "qwen.qwen3-next-80b-a3b", temperature: float = 0.7):
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
        messages = self._chat_ctx.to_provider_format("openai")[0]

        # Prepare tools for Bedrock (OpenAI format)
        llm_tools = None
        if self._tools:
            llm_tools = []
            for tool in self._tools:
                if tool_context.is_function_tool(tool):
                    info = tool_context.get_function_info(tool)
                    # We need to build the schema from the function signature
                    # LiveKit provides utils for this but we might need to rely on the agent framework's schema builder
                    # For now, let's assume we can use the build_legacy_openai_schema or similar if available, 
                    # or construct it manually if we had the schema.
                    # Since we don't have direct access to schema builder here without importing more internals,
                    # and looking at the previous error 'AttributeError: 'function' object has no attribute 'name'',
                    # it seems 'tool' is just the decorated function.
                    
                    # Let's try to use livekit.agents.llm.utils if available to build schema
                    schema = llm_utils.build_legacy_openai_schema(tool)
                    llm_tools.append(schema)
                    
                elif tool_context.is_raw_function_tool(tool):
                    info = tool_context.get_raw_function_info(tool)
                    llm_tools.append({
                        "type": "function",
                        "function": info.raw_schema
                    })

        try:
            in_reasoning = False
            async for chunk in stream_raw(
                messages=messages,
                temperature=self._temperature,
                tools=llm_tools,
            ):
                for choice in chunk.choices:
                    delta = choice.delta
                    content = delta.content
                    
                    # Filter reasoning tags
                    if content:
                        processed_content = ""
                        temp_content = content
                        
                        while temp_content:
                            if in_reasoning:
                                if "</reasoning>" in temp_content:
                                    _, temp_content = temp_content.split("</reasoning>", 1)
                                    in_reasoning = False
                                else:
                                    temp_content = ""
                            else:
                                if "<reasoning>" in temp_content:
                                    pre, post = temp_content.split("<reasoning>", 1)
                                    processed_content += pre
                                    temp_content = post
                                    in_reasoning = True
                                else:
                                    processed_content += temp_content
                                    temp_content = ""
                        
                        content = processed_content

                    # Map tool calls
                    tool_calls = []
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            tool_calls.append(lk_llm.FunctionToolCall(
                                call_id=tc.id,
                                name=tc.function.name if tc.function else "",
                                arguments=tc.function.arguments if tc.function else "",
                            ))

                    yield lk_llm.ChatChunk(
                        id=chunk.id,
                        delta=lk_llm.ChoiceDelta(
                            role=delta.role,  # role is a string in ChatRole Literal
                            content=delta.content,
                            tool_calls=tool_calls,
                        )
                    )

        except Exception as e:
            logger.error(f"Bedrock LLM stream failed: {e}")
            raise

class BedrockLLMAdapter(BedrockLLM):
    """Alias for backwards compatibility if needed."""
    pass

__all__ = ["BedrockLLM", "BedrockLLMStream", "BedrockLLMAdapter"]
