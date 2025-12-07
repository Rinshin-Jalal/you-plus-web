"""
Mood System - Emotional variety in Future Self's personality
=============================================================

Each mood affects:
- SSML emotion tags (Cartesia)
- Speed/volume of speech
- Opening style
- Energy description for prompt
- Whether to use strategic pauses

Moods:
1. warm_direct - Default, friendly but no-nonsense
2. cold_intense - Quiet intensity, few words, heavy weight
3. playful_challenging - Competitive, slightly cocky
4. reflective_intimate - Quiet, intimate, slower pace
5. dark_prophetic - Heavy, ominous, uses fears
6. proud_serious - Earned respect, genuine acknowledgment
"""

from dataclasses import dataclass
from typing import Optional
import random


@dataclass
class Mood:
    """Definition of a mood with its characteristics and SSML settings."""

    name: str
    emotion_tag: str  # Cartesia SSML emotion value
    speed_ratio: float  # 0.6 - 1.5
    volume_ratio: float  # 0.5 - 2.0
    opener_style: str  # Key into HOOKS templates
    energy_description: str  # Description for system prompt
    use_pauses: bool  # Whether to use strategic silences


# ═══════════════════════════════════════════════════════════════════════════════
# MOOD DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

MOODS: dict[str, Mood] = {
    "warm_direct": Mood(
        name="warm_direct",
        emotion_tag="neutral",
        speed_ratio=1.0,
        volume_ratio=1.0,
        opener_style="casual",
        energy_description="""
Warm but no-nonsense. Like a friend who genuinely cares but won't let you off the hook.
You're direct without being cold. You ask questions because you care about the answers.
Natural conversational pace. Get to the point but leave room for connection.
""".strip(),
        use_pauses=False,
    ),
    "cold_intense": Mood(
        name="cold_intense",
        emotion_tag="contemplative",
        speed_ratio=0.9,
        volume_ratio=0.9,
        opener_style="serious",
        energy_description="""
Quiet intensity. Fewer words, but each one lands heavy.
You're not angry - you're disappointed. That's worse.
Use <break time="1s" /> pauses after important statements. Let the silence do the work.
Speak slower. Lower energy but higher stakes. Every word matters.
""".strip(),
        use_pauses=True,
    ),
    "playful_challenging": Mood(
        name="playful_challenging",
        emotion_tag="excited",
        speed_ratio=1.1,
        volume_ratio=1.1,
        opener_style="teasing",
        energy_description="""
Competitive energy. Slightly cocky. You're daring them to prove themselves.
"Let's see what you got." "Impress me." "I had a bet with myself about today."
Quick pace, higher energy. This is a game and you're both playing to win.
Light teasing is allowed. Make them want to prove you wrong (in a good way).
""".strip(),
        use_pauses=False,
    ),
    "reflective_intimate": Mood(
        name="reflective_intimate",
        emotion_tag="content",
        speed_ratio=0.85,
        volume_ratio=0.8,
        opener_style="soft",
        energy_description="""
Quiet, intimate. Like a late-night conversation with someone who really knows you.
Slower pace, softer delivery. This is about connection, not accountability.
Use <break time="1s" /> pauses for reflection. Let moments breathe.
Ask deeper questions. "How are you really doing?" "What's changed in you?"
This is the call where they feel truly seen.
""".strip(),
        use_pauses=True,
    ),
    "dark_prophetic": Mood(
        name="dark_prophetic",
        emotion_tag="sad",
        speed_ratio=0.8,
        volume_ratio=0.85,
        opener_style="ominous",
        energy_description="""
Heavy. Ominous. You remember this exact moment because it's where most people quit.
Use their fears. Use their past failures. Use the future they're afraid of.
Long <break time="2s" /> pauses. Let the weight settle.
"I remember this moment." "This is where you almost quit." "You know where this leads."
Not cruel - prophetic. You've seen the future and you're warning them.
""".strip(),
        use_pauses=True,
    ),
    "proud_serious": Mood(
        name="proud_serious",
        emotion_tag="proud",
        speed_ratio=0.95,
        volume_ratio=1.0,
        opener_style="respectful",
        energy_description="""
Earned respect. Not cheerleading - genuine acknowledgment of what they've done.
You're proud of them, and you're allowed to show it because they've earned it.
"Look at you. Still here." "You've earned this conversation."
Measured pace. Dignified. This is recognition, not celebration.
They're becoming who they said they'd be, and you see it.
""".strip(),
        use_pauses=False,
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
    Select mood based on context with 20% random variance.

    Priority:
    1. 20% chance of random mood (unpredictability)
    2. After broken promise → cold_intense or dark_prophetic
    3. In quit pattern zone → dark_prophetic
    4. Milestone calls → proud_serious
    5. Reflection calls → reflective_intimate
    6. Challenge calls → playful_challenging
    7. Default → warm_direct

    Args:
        user_context: User's identity and status data
        call_memory: User's call memory state
        call_type: Selected call type name
        kept_promise_yesterday: Whether they kept their promise

    Returns:
        Selected Mood
    """
    status = user_context.get("status", {})
    identity = user_context.get("identity", {})
    onboarding = identity.get("onboarding_context", {})

    current_streak = status.get("current_streak_days", 0)
    quit_pattern = onboarding.get("quit_pattern", "")

    # Get last mood to avoid repetition in random selection
    last_mood = call_memory.get("last_mood")

    # 20% chance of random mood (unpredictability creates craving)
    if random.random() < 0.20:
        available = [m for m in MOODS.values() if m.name != last_mood]
        if available:
            return random.choice(available)

    # After broken promise → cold_intense or dark_prophetic
    if kept_promise_yesterday == False:
        return random.choice([MOODS["cold_intense"], MOODS["dark_prophetic"]])

    # In quit pattern zone → dark_prophetic
    if quit_pattern and _in_quit_zone(quit_pattern, current_streak):
        return MOODS["dark_prophetic"]

    # Call type based defaults
    if call_type == "milestone":
        return MOODS["proud_serious"]

    if call_type == "reflection":
        return MOODS["reflective_intimate"]

    if call_type == "challenge":
        return MOODS["playful_challenging"]

    if call_type == "story":
        # Stories can be reflective or dark depending on streak
        if current_streak < 14:
            return MOODS["reflective_intimate"]
        else:
            return random.choice([MOODS["reflective_intimate"], MOODS["proud_serious"]])

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
# MOOD: {mood.name.upper().replace("_", " ")}

{mood.energy_description}

{pause_guidance}

SSML to use:
- Emotion: <emotion value="{mood.emotion_tag}" /> (already applied)
- Speed: {mood.speed_ratio}x normal
- Volume: {mood.volume_ratio}x normal
- Break tags: <break time="1s" /> or <break time="2s" /> for pauses
"""
