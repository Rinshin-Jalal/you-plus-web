"""
YOU+ Agent Services
==================

External service integrations for the agent.
"""

from .supermemory import supermemory_service, SupermemoryService, UserProfile
from .trust_score import trust_score_service, TrustScoreService

# Future self service (replaces goals)
from .future_self_service import (
    get_future_self,
    get_call_focus_pillars,
    get_user_checkin_summary,
    get_user_pillars,
    get_pillar,
    record_pillar_checkin,
    build_pillars_prompt_context,
    build_pillar_checkin_summary_context,
    get_identity_alignment,
    create_complete_future_self,
)

# User context and call memory
from .user_context import (
    fetch_user_context,
    fetch_call_memory,
    upsert_call_memory,
    get_yesterday_promise_status,
)

# Excuse pattern tracking
from .excuse_patterns import (
    normalize_excuse_pattern,
    save_excuse_pattern,
    fetch_excuse_patterns,
    build_excuse_callout_section,
)

# Call analytics
from .call_analytics import save_call_analytics

__all__ = [
    # Supermemory
    "supermemory_service",
    "SupermemoryService",
    "UserProfile",
    # Trust score
    "trust_score_service",
    "TrustScoreService",
    # Future self (pillars)
    "get_future_self",
    "get_call_focus_pillars",
    "get_user_checkin_summary",
    "get_user_pillars",
    "get_pillar",
    "record_pillar_checkin",
    "build_pillars_prompt_context",
    "build_pillar_checkin_summary_context",
    "get_identity_alignment",
    "create_complete_future_self",
    # User context
    "fetch_user_context",
    "fetch_call_memory",
    "upsert_call_memory",
    "get_yesterday_promise_status",
    # Excuse patterns
    "normalize_excuse_pattern",
    "save_excuse_pattern",
    "fetch_excuse_patterns",
    "build_excuse_callout_section",
    # Call analytics
    "save_call_analytics",
]
