"""
Core handlers for the YOU+ Future Self Agent.
==============================================

This package contains the main call handling logic:
- pre_call: Pre-call validation, user context fetching, and TTS configuration
- call: Main call handler with multi-agent setup and event routing
"""

from core.handlers.pre_call import (
    handle_call_request,
)

from core.handlers.call import (
    handle_new_call,
)

__all__ = [
    "handle_call_request",
    "handle_new_call",
]
