"""
Groq API Client - Helper for Groq LLM calls
============================================
"""

import os
import json
from typing import AsyncGenerator, Optional

import aiohttp
from loguru import logger


GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "openai/gpt-oss-120b"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


async def stream_groq_response(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 150,
    timeout: int = 30,
) -> AsyncGenerator[str, None]:
    """
    Stream a response from Groq API.

    Args:
        messages: OpenAI-format messages list
        temperature: Sampling temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate
        timeout: Request timeout in seconds

    Yields:
        Response content chunks as strings

    Raises:
        ValueError: If GROQ_API_KEY is not set
        aiohttp.ClientError: If API call fails
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set")

    async with aiohttp.ClientSession() as session:
        async with session.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
            },
            timeout=aiohttp.ClientTimeout(total=timeout),
        ) as resp:
            if resp.status != 200:
                error = await resp.text()
                logger.error(f"Groq API error {resp.status}: {error}")
                raise aiohttp.ClientResponseError(
                    resp.request_info,
                    resp.history,
                    status=resp.status,
                    message=error,
                )

            async for line in resp.content:
                line = line.decode("utf-8").strip()
                if not line or not line.startswith("data: "):
                    continue

                data = line[6:]  # Remove "data: " prefix
                if data == "[DONE]":
                    break

                try:
                    chunk = json.loads(data)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content
                except json.JSONDecodeError:
                    continue


async def call_groq(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 150,
    timeout: int = 30,
) -> Optional[str]:
    """
    Call Groq API and return full response (non-streaming).

    Args:
        messages: OpenAI-format messages list
        temperature: Sampling temperature
        max_tokens: Maximum tokens to generate
        timeout: Request timeout in seconds

    Returns:
        Full response content or None on error
    """
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY not set")
        return None

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": False,
                },
                timeout=aiohttp.ClientTimeout(total=timeout),
            ) as resp:
                if resp.status != 200:
                    error = await resp.text()
                    logger.error(f"Groq API error {resp.status}: {error}")
                    return None

                result = await resp.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content")

    except Exception as e:
        logger.error(f"Groq API call failed: {e}")
        return None
