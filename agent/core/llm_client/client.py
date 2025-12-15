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
from typing import AsyncGenerator, Optional

from loguru import logger
from openai import AsyncOpenAI


# Configuration from environment variables
BEDROCK_API_KEY = os.getenv("BEDROCK_API_KEY")
BEDROCK_REGION = os.getenv("BEDROCK_REGION", "us-west-2")
BEDROCK_MODEL = os.getenv("BEDROCK_MODEL", "openai.gpt-oss-20b-1:0")

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
if not BEDROCK_MODEL or BEDROCK_MODEL == "openai.gpt-oss-20b-1:0":
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
        logger.info(f"Initializing Bedrock client: endpoint={endpoint}, model={BEDROCK_MODEL}")
        
        _client = AsyncOpenAI(
            api_key=BEDROCK_API_KEY,
            base_url=endpoint,
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
    if not BEDROCK_API_KEY:
        raise ValueError("BEDROCK_API_KEY not set")

    client = _get_client()

    try:
        stream = await client.chat.completions.create(
            model=BEDROCK_MODEL,
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
    if not BEDROCK_API_KEY:
        logger.error("BEDROCK_API_KEY not set")
        return None

    client = _get_client()

    try:
        response = await client.chat.completions.create(
            model=BEDROCK_MODEL,
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
