"""
LLM Client module - OpenAI-compatible API client for AWS Bedrock.
"""

from core.llm_client.client import (
    stream_response,
    stream_raw,
    call,
    fast_call,
    BEDROCK_API_KEY,
    BEDROCK_REGION,
    BEDROCK_MODEL,
    BEDROCK_FAST_MODEL,
)

__all__ = [
    "stream_response",
    "stream_raw",
    "call",
    "fast_call",
    "BEDROCK_API_KEY",
    "BEDROCK_REGION",
    "BEDROCK_MODEL",
    "BEDROCK_FAST_MODEL",
]
