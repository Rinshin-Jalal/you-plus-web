"""
LLM Client - OpenAI-compatible API client for AWS Bedrock
==========================================================

Uses the standard OpenAI SDK to communicate with AWS Bedrock's
OpenAI-compatible inference endpoint.

Configuration via environment variables:
- BEDROCK_API_KEY: AWS Bedrock API key for authentication
- BEDROCK_REGION: AWS region (e.g., us-west-2)
- BEDROCK_MODEL: Model ID to use (default: openai.gpt-oss-20b-1:0)

For AWS Bedrock, the base URL format is:
https://bedrock-runtime.{region}.amazonaws.com/openai/v1
"""

import os
from typing import AsyncGenerator, Optional, List, Dict, Any

from loguru import logger
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionChunk


# Configuration from environment variables
BEDROCK_API_KEY = os.getenv("BEDROCK_API_KEY")
BEDROCK_REGION = os.getenv("BEDROCK_REGION", "us-west-2")
BEDROCK_MODEL = os.getenv("BEDROCK_MODEL", "qwen.qwen3-next-80b-a3b")

# Fast model for quick analysis tasks (stage transitions, excuse detection, etc.)
BEDROCK_FAST_MODEL = os.getenv("BEDROCK_FAST_MODEL", "openai.gpt-oss-safeguard-20b")

# Legacy support - check for old LLM_* variables if BEDROCK_* not set
if not BEDROCK_API_KEY:
    BEDROCK_API_KEY = os.getenv("LLM_API_KEY")
if not BEDROCK_REGION or BEDROCK_REGION == "us-west-2":
    # Try to extract region from LLM_BASE_URL if provided
    llm_base_url = os.getenv("LLM_BASE_URL", "")
    if llm_base_url and "bedrock-runtime" in llm_base_url:
        # Extract region from URL like https://bedrock-runtime.us-west-2.amazonaws.com/...
        parts = llm_base_url.split("bedrock-runtime.")
        if len(parts) > 1:
            region_part = parts[1].split(".amazonaws.com")[0]
            if region_part:
                BEDROCK_REGION = region_part
if not BEDROCK_MODEL or BEDROCK_MODEL == "qwen.qwen3-next-80b-a3b":
    BEDROCK_MODEL = os.getenv("LLM_MODEL", BEDROCK_MODEL)


def get_bedrock_endpoint(region: str) -> str:
    """Get the Bedrock OpenAI-compatible endpoint URL for the given region."""
    return f"https://bedrock-runtime.{region}.amazonaws.com/openai/v1"


# Initialize async client
_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    """Get or create the async OpenAI client configured for AWS Bedrock."""
    global _client
    if _client is None:
        if not BEDROCK_API_KEY:
            raise ValueError("BEDROCK_API_KEY environment variable is required")

        endpoint = get_bedrock_endpoint(BEDROCK_REGION)
        logger.info(
            f"Initializing Bedrock client: endpoint={endpoint}, model={BEDROCK_MODEL}"
        )

        _client = AsyncOpenAI(
            api_key=BEDROCK_API_KEY,
            base_url=endpoint,
        )
    return _client


async def stream_raw(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 150,
    timeout: int = 30,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: Optional[Any] = None,
) -> AsyncGenerator[ChatCompletionChunk, None]:
    """
    Stream raw chunks from the LLM API.

    Args:
        messages: OpenAI-format messages list
        temperature: Sampling temperature
        max_tokens: Maximum tokens to generate
        timeout: Request timeout in seconds
        tools: Optional list of tools
        tool_choice: Optional tool choice strategy

    Yields:
        ChatCompletionChunk objects
    """
    if not BEDROCK_API_KEY:
        raise ValueError("BEDROCK_API_KEY not set")

    client = _get_client()

    kwargs = {
        "model": BEDROCK_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
        "timeout": timeout,
    }

    if tools:
        kwargs["tools"] = tools
    if tool_choice:
        kwargs["tool_choice"] = tool_choice

    try:
        stream = await client.chat.completions.create(**kwargs)

        async for chunk in stream:
            yield chunk

    except Exception as e:
        logger.error(f"LLM API call failed: {e}")
        raise


async def stream_response(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 150,
    timeout: int = 30,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: Optional[Any] = None,
) -> AsyncGenerator[str, None]:
    """
    Stream a response from the LLM API (content only).

    Note: If tools are used and the model calls a tool, this generator
    will yield nothing (as there is no content). Use stream_raw for tool handling.

    Args:
        messages: OpenAI-format messages list
        temperature: Sampling temperature
        max_tokens: Maximum tokens
        timeout: Request timeout
        tools: Optional tools
        tool_choice: Optional tool choice

    Yields:
        Response content chunks as strings
    """
    async for chunk in stream_raw(
        messages, temperature, max_tokens, timeout, tools, tool_choice
    ):
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def call(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 150,
    timeout: int = 30,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: Optional[Any] = None,
) -> Optional[str]:
    """
    Call LLM API and return full response (non-streaming).

    Args:
        messages: OpenAI-format messages list
        temperature: Sampling temperature
        max_tokens: Maximum tokens
        timeout: Request timeout
        tools: Optional tools
        tool_choice: Optional tool choice

    Returns:
        Full response content or None on error
    """
    if not BEDROCK_API_KEY:
        logger.error("BEDROCK_API_KEY not set")
        return None

    client = _get_client()

    kwargs = {
        "model": BEDROCK_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
        "timeout": timeout,
    }

    if tools:
        kwargs["tools"] = tools
    if tool_choice:
        kwargs["tool_choice"] = tool_choice

    try:
        response = await client.chat.completions.create(**kwargs)

        return response.choices[0].message.content if response.choices else None

    except Exception as e:
        logger.error(f"LLM API call failed: {e}")
        return None


async def fast_call(
    messages: list[dict],
    temperature: float = 0.0,
    max_tokens: int = 150,
    timeout: int = 5,
) -> Optional[str]:
    """
    Fast LLM call using smaller model for quick analysis tasks.
    Used for: stage transitions, excuse detection, sentiment, etc.

    Args:
        messages: OpenAI-format messages list
        temperature: Sampling temperature (default 0.0 for deterministic)
        max_tokens: Maximum tokens (default 150)
        timeout: Request timeout in seconds (default 5s for fast response)

    Returns:
        Full response content or None on error
    """
    if not BEDROCK_API_KEY:
        logger.error("BEDROCK_API_KEY not set")
        return None

    client = _get_client()

    kwargs = {
        "model": BEDROCK_FAST_MODEL,  # Use fast 20B model
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
        "timeout": timeout,
    }

    try:
        response = await client.chat.completions.create(**kwargs)
        return response.choices[0].message.content if response.choices else None

    except Exception as e:
        logger.error(f"Fast LLM API call failed: {e}")
        return None
