"""
LLM Client Package
==================

OpenAI-compatible LLM client for AWS Bedrock.
"""

from core.llm_client.client import (
    stream_response,
    call,
    BEDROCK_API_KEY,
    BEDROCK_REGION,
    BEDROCK_MODEL,
    get_bedrock_endpoint,
)

__all__ = [
    "stream_response",
    "call",
    "BEDROCK_API_KEY",
    "BEDROCK_REGION",
    "BEDROCK_MODEL",
    "get_bedrock_endpoint",
]
