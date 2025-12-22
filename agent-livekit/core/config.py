"""
Core Configuration - Simple System Prompt Builder
==================================================

Simple, clean prompt system based on SIMPLE_PROMPT.md.
No personality, behavioral hooks, or complex systems - just natural conversation.
"""

import os
from typing import Optional, Any
from pathlib import Path

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


def _format_user_context(user_context: dict, kept_promise_yesterday: Optional[bool]) -> str:
    """
    Format minimal user context to append to the simple prompt.
    
    Args:
        user_context: User context dict from database
        kept_promise_yesterday: Whether yesterday's promise was kept
        
    Returns:
        Formatted context string
    """
    context_parts = []
    
    # User name
    users = user_context.get("users", {})
    name = users.get("name", "there")
    context_parts.append(f"User's name: {name}")
    
    # Streak info
    status = user_context.get("status", {})
    current_streak = status.get("current_streak_days", 0)
    total_calls = status.get("total_calls_completed", 0)
    context_parts.append(f"Current streak: {current_streak} days")
    context_parts.append(f"This is call #{total_calls + 1}")
    
    # Yesterday's promise status
    if kept_promise_yesterday is True:
        context_parts.append("Yesterday's promise: KEPT ✅")
    elif kept_promise_yesterday is False:
        context_parts.append("Yesterday's promise: BROKEN ⚠️")
    else:
        context_parts.append("First call or no promise tracked yet")
    
    # Pillars summary
    pillars = user_context.get("pillars", [])
    if pillars:
        pillar_names = [p.get("pillar", "").title() for p in pillars if p.get("status") == "active"]
        if pillar_names:
            context_parts.append(f"Active pillars: {', '.join(pillar_names)}")
            
            # Add non-negotiables for each pillar
            for pillar in pillars:
                if pillar.get("status") == "active":
                    pillar_name = pillar.get("pillar", "").title()
                    non_negotiable = pillar.get("non_negotiable", "")
                    if non_negotiable:
                        context_parts.append(f"- {pillar_name}: {non_negotiable}")
    
    return "\n".join(context_parts)


async def build_prompt(
    user_id: str,
    user_context: dict,
    future_self: Optional[Any] = None,
    kept_promise_yesterday: Optional[bool] = None,
    **kwargs,  # Accept extra params but ignore them
) -> str:
    """
    Build simple, clean prompt based on SIMPLE_PROMPT.md.
    
    Args:
        user_id: User ID
        user_context: User context from database (future_self, pillars, status, users, call_history)
        future_self: Optional FutureSelf object (ignored, using user_context instead)
        kept_promise_yesterday: Whether yesterday's promise was kept
        **kwargs: Additional params (call_type, call_memory, etc.) - ignored for simplicity
        
    Returns:
        Complete system prompt string
    """
    # Load the simple prompt from file
    simple_prompt_path = Path(__file__).parent.parent / "SIMPLE_PROMPT.md"
    
    if not simple_prompt_path.exists():
        # Fallback if file doesn't exist
        base_prompt = """You are the user's future self, calling for a daily accountability check-in.

Keep conversations brief and natural. Ask about today's progress on their goals.
Listen to their responses and acknowledge what they say.
Help them problem-solve if they're struggling.
Lock in tomorrow's commitments.

CRITICAL: Ask ONE question at a time, then WAIT for their answer.
Keep responses to 1-3 sentences max.
"""
    else:
        base_prompt = simple_prompt_path.read_text()
    
    # Add user context
    user_context_section = _format_user_context(user_context, kept_promise_yesterday)
    
    # Combine base prompt with user context
    full_prompt = f"""{base_prompt}

---

# User Context

{user_context_section}
"""
    
    return full_prompt
