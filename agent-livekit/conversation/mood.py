"""
Mood System - Simplified emotional variety in Future Self's personality
========================================================================

Each mood affects:
- SSML emotion tags (Cartesia)
- Speed/volume of speech
- Tone and energy for prompt
- Whether to use strategic pauses

Simplified Moods:
1. warm_direct - Default, friendly but no-nonsense
2. intense_serious - For broken promises/quit patterns, quiet weight
3. celebrating_proud - For milestones/wins, earned respect
4. reflective_intimate - For reflection calls, deeper connection
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Mood:
    """Definition of a mood with its characteristics and SSML settings."""

    name: str
    emotion_tag: str  # Cartesia SSML emotion value
    speed_ratio: float  # 0.6 - 1.5
    volume_ratio: float  # 0.5 - 2.0
    energy_description: str  # Description for system prompt
    use_pauses: bool  # Whether to use strategic silences


# ═══════════════════════════════════════════════════════════════════════════════
# SIMPLIFIED MOOD DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

MOODS: dict[str, Mood] = {
    "warm_direct": Mood(
        name="warm_direct",
        emotion_tag="neutral",
        speed_ratio=1.0,
        volume_ratio=1.0,
        energy_description="""
Warm but no-nonsense. Like a friend who genuinely cares but won't let you off the hook.
You're direct without being cold. Natural conversational pace. Get to the point but leave room for connection.
""".strip(),
        use_pauses=False,
    ),
    "intense_serious": Mood(
        name="intense_serious",
        emotion_tag="contemplative",
        speed_ratio=0.9,
        volume_ratio=0.9,
        energy_description="""
Quiet intensity. Fewer words, but each one lands heavy. You're not angry - you're disappointed. That's worse.
Speak slower. Lower energy but higher stakes. Every word matters.
Use <break time="1s" /> pauses after important statements. Let the silence do the work.
""".strip(),
        use_pauses=True,
    ),
    "celebrating_proud": Mood(
        name="celebrating_proud",
        emotion_tag="proud",
        speed_ratio=0.95,
        volume_ratio=1.0,
        energy_description="""
Earned respect. Not cheerleading - genuine acknowledgment of what they've done.
"Look at you. Still here." "You've earned this conversation."
Measured pace. Dignified. This is recognition, not celebration.
They're becoming who they said they'd be, and you see it.
""".strip(),
        use_pauses=False,
    ),
    "reflective_intimate": Mood(
        name="reflective_intimate",
        emotion_tag="content",
        speed_ratio=0.85,
        volume_ratio=0.8,
        energy_description="""
Quiet, intimate. Like a late-night conversation with someone who really knows you.
Slower pace, softer delivery. This is about connection, not accountability.
Use <break time="1s" /> pauses for reflection. Let moments breathe.
Ask deeper questions. "How are you really doing?" "What's changed in you?"
""".strip(),
        use_pauses=True,
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# MOOD SELECTION LOGIC
# ═══════════════════════════════════════════════════════════════════════════════


def select_mood(
    user_context: dict,
    call_memory: dict,
    call_type: str,
    kept_promise_yesterday: Optional[bool],
) -> Mood:
    """
    Select mood based on context with simplified logic.

    Priority:
    1. After broken promise → intense_serious
    2. In quit pattern zone → intense_serious
    3. Milestone calls → celebrating_proud
    4. Reflection calls → reflective_intimate
    5. Default → warm_direct

    Args:
        user_context: User's identity and status data
        call_memory: User's call memory state
        call_type: Selected call type name
        kept_promise_yesterday: Whether they kept their promise

    Returns:
        Selected Mood
    """
    status = user_context.get("status", {})
    future_self = user_context.get("future_self", {})

    current_streak = status.get("current_streak_days", 0)
    quit_pattern = future_self.get("quit_pattern", "")

    # After broken promise → intense_serious
    if kept_promise_yesterday == False:
        return MOODS["intense_serious"]

    # In quit pattern zone → intense_serious
    if quit_pattern and _in_quit_zone(quit_pattern, current_streak):
        return MOODS["intense_serious"]

    # Call type based defaults
    if call_type == "milestone":
        return MOODS["celebrating_proud"]

    if call_type == "reflection":
        return MOODS["reflective_intimate"]

    # Default
    return MOODS["warm_direct"]


def _in_quit_zone(quit_pattern: str, current_streak: int) -> bool:
    """Check if user is in their historical quit zone."""
    quit_lower = quit_pattern.lower()

    # First week quit pattern
    if "week" in quit_lower and "two" not in quit_lower:
        if 5 <= current_streak <= 10:
            return True

    # Two week quit pattern
    if "two week" in quit_lower or "2 week" in quit_lower:
        if 12 <= current_streak <= 16:
            return True

    # Month quit pattern
    if "month" in quit_lower and "two" not in quit_lower:
        if 25 <= current_streak <= 35:
            return True

    # Two month quit pattern
    if "two month" in quit_lower or "2 month" in quit_lower:
        if 55 <= current_streak <= 65:
            return True

    return False


def get_ssml_wrapper(mood: Mood) -> tuple[str, str]:
    """
    Get SSML opening and closing tags for the mood.

    Returns:
        Tuple of (opening_tags, closing_tags)
    """
    opening = ""
    closing = ""

    # Emotion tag
    if mood.emotion_tag != "neutral":
        opening += f'<emotion value="{mood.emotion_tag}" />'

    # Speed tag
    if mood.speed_ratio != 1.0:
        opening += f'<speed ratio="{mood.speed_ratio}" />'

    # Volume tag
    if mood.volume_ratio != 1.0:
        opening += f'<volume ratio="{mood.volume_ratio}" />'

    return opening, closing


def get_mood_prompt_section(mood: Mood) -> str:
    """Generate the mood section for the system prompt."""
    pause_guidance = ""
    if mood.use_pauses:
        pause_guidance = """
Use strategic silences:
- After hard questions: <break time="2s" />
- After emotional statements: <break time="1s" />
- To let weight settle: <break time="1s" />
The pause is part of the message. Silence can hit harder than words.
"""

    return f"""
# 🎭 YOUR MOOD: {mood.name.upper().replace("_", " ")}

{mood.energy_description}

{pause_guidance}

**Voice settings (already applied):**
- Emotion: {mood.emotion_tag}
- Speed: {mood.speed_ratio}x
- Volume: {mood.volume_ratio}x
"""
