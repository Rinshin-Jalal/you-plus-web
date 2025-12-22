"""
Prompt Building Modules
======================
All modules for building and configuring agent prompts.

v5 Architecture - Behavioral Addiction Engine:
- conversation_objectives.py - What to achieve, not what to say
- Personality and behavioral hooks imported from conversation/ module
"""

from .content_templates import REVEALS, STORIES, CHALLENGES, get_reveal
from .file_loaders import load_voice_skill, load_voice_control_guide
from .conversation_rules import get_conversation_rules_v4
from .output_formatting import get_output_formatting_rules
from .goals import get_goals_section
from .tools import get_tools_section
from .prompt_builders import (
    build_legacy_psychological_context,
    build_callback_section,
    build_open_loop_section,
    build_identity_section,
    build_pillar_section,
)
from .call_analytics import save_call_analytics, default_call_memory

# v5: Conversation Objectives
from .conversation_objectives import (
    build_conversation_objectives,
    build_anti_patterns,
)

__all__ = [
    "REVEALS",
    "STORIES",
    "CHALLENGES",
    "get_reveal",
    "load_voice_skill",
    "load_voice_control_guide",
    "get_conversation_rules_v4",
    "get_output_formatting_rules",
    "get_goals_section",
    "get_tools_section",
    "build_conversation_objectives",
    "build_anti_patterns",
    "build_legacy_psychological_context",
    "build_callback_section",
    "build_open_loop_section",
    "build_identity_section",
    "build_pillar_section",
    "save_call_analytics",
    "default_call_memory",
]

