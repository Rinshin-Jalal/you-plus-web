"""
LLM Client - OpenAI-compatible API client for AWS Bedrock
==========================================================

Uses the standard OpenAI SDK to communicate with AWS Bedrock's
OpenAI-compatible inference endpoint.

Configuration via environment variables:
- LLM_API_KEY: API key for authentication
- LLM_BASE_URL: Base URL for the API endpoint
- LLM_MODEL: Model ID to use

For AWS Bedrock, the base URL format is typically:
https://bedrock-runtime.{region}.amazonaws.com/model/{model-id}/converse-stream
"""

import os
from typing import AsyncGenerator, Optional

from loguru import logger
from openai import AsyncOpenAI


# Configuration from environment variables
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL")
LLM_MODEL = os.getenv("LLM_MODEL")

# Initialize async client
_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    """Get or create the async OpenAI client."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=LLM_API_KEY,
            base_url=LLM_BASE_URL,
        )
    return _client


async def stream_response(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 150,
    timeout: int = 30,
) -> AsyncGenerator[str, None]:
    """
    Stream a response from the LLM API.

    Args:
        messages: OpenAI-format messages list
        temperature: Sampling temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate
        timeout: Request timeout in seconds

    Yields:
        Response content chunks as strings

    Raises:
        ValueError: If API key is not set
    """
    if not LLM_API_KEY:
        raise ValueError("LLM_API_KEY not set")

    client = _get_client()

    try:
        stream = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            timeout=timeout,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    except Exception as e:
        logger.error(f"LLM API call failed: {e}")
        raise


async def call(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 150,
    timeout: int = 30,
) -> Optional[str]:
    """
    Call LLM API and return full response (non-streaming).

    Args:
        messages: OpenAI-format messages list
        temperature: Sampling temperature
        max_tokens: Maximum tokens to generate
        timeout: Request timeout in seconds

    Returns:
        Full response content or None on error
    """
    if not LLM_API_KEY:
        logger.error("LLM_API_KEY not set")
        return None

    client = _get_client()

    try:
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=False,
            timeout=timeout,
        )

        return response.choices[0].message.content if response.choices else None

    except Exception as e:
        logger.error(f"LLM API call failed: {e}")
        return None
