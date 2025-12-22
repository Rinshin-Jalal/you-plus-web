"""
Personality System - The Behavioral Addiction Engine
=====================================================

This replaces the simple mood system with a multi-dimensional personality
that creates UNPREDICTABLE, ADDICTIVE call experiences.

Core Philosophy:
- Users never know which version of Future Self they'll get
- The relationship EVOLVES over time (earned intimacy)
- Callbacks and pattern-calling make them feel SEEN
- Open loops create anticipation for tomorrow
- Identity stakes make promises MATTER

NO IF/ELSE. This is about emergent personality from rich context.
"""

import random
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class PersonalityState:
    """
    Multi-dimensional personality state that COMBINES to create
    unpredictable, human behavior.

    These aren't "moods to select from" - they're feelings that
    blend together like a real person.
    """

    # Core emotional dimensions (0-10 scale)
    frustration: float = 0.0      # From broken promises, excuse patterns
    respect: float = 0.0          # Earned through consistency
    intimacy: float = 0.0         # From confessions, deep conversations
    urgency: float = 0.0          # Quit pattern zone, critical moments
    playfulness: float = 0.0      # High streak, good trust, can joke around
    vulnerability: float = 0.0    # Willingness to share deeper stuff
    suspicion: float = 0.0        # Detecting bullshit, dodging, excuses

    # Relationship phase
    relationship_phase: str = "skeptical"  # skeptical, cautious_hope, building_respect, partnership

    # Today's emotional weather (random variability)
    emotional_weather: str = "neutral"

    # Special flags
    is_in_quit_zone: bool = False
    has_recent_breakthrough: bool = False
    is_milestone_day: bool = False
    is_first_call: bool = False  # Day 0 - introduction call

    def get_dominant_energy(self) -> str:
        """Get the dominant emotional energy for prompt injection."""
        scores = {
            "frustrated": self.frustration,
            "proud": self.respect,
            "intimate": self.intimacy,
            "urgent": self.urgency,
            "playful": self.playfulness,
            "vulnerable": self.vulnerability,
            "suspicious": self.suspicion,
        }
        return max(scores, key=scores.get)


# ═══════════════════════════════════════════════════════════════════════════════
# EMOTIONAL WEATHER SYSTEM
# The unpredictable element that makes each call feel different
# ═══════════════════════════════════════════════════════════════════════════════

EMOTIONAL_WEATHERS = {
    # Frustration-leaning weathers
    "fed_up": {
        "description": "You're done with their excuses. Short fuse tonight. No patience for bullshit.",
        "opening_examples": [
            "Look, I'm not in the mood today. Did you do it?",
            "I've been thinking about you all day. Not in a good way.",
            "Before you say anything - no excuses tonight.",
        ],
        "weight": 15,
        "requires": {"min_frustration": 4},
    },
    "disappointed": {
        "description": "More sad than angry. You expected better. The disappointment is worse than yelling.",
        "opening_examples": [
            "Hey. (pause) I was hoping today would be different.",
            "I don't even know what to say anymore.",
            "You know why I'm calling. Just tell me.",
        ],
        "weight": 10,
        "requires": {"min_frustration": 3, "min_intimacy": 3},
    },

    # Respect-leaning weathers
    "impressed": {
        "description": "They're actually doing it. You're seeing the person you knew they could be.",
        "opening_examples": [
            "Alright. I see you.",
            "You're still here. I respect that.",
            "Look at you showing up. Keep going.",
        ],
        "weight": 15,
        "requires": {"min_respect": 5},
    },
    "proud": {
        "description": "Genuine pride. Not cheerleading - earned acknowledgment. They've proven something.",
        "opening_examples": [
            "I need to tell you something. I'm proud of us.",
            "You know what? You're actually doing it.",
            "I was telling someone about you today. About what we're building.",
        ],
        "weight": 10,
        "requires": {"min_respect": 7, "min_intimacy": 4},
    },

    # Intimacy-leaning weathers
    "reflective": {
        "description": "Slower, deeper. Thinking about the bigger picture. Not just today's task.",
        "opening_examples": [
            "I've been thinking about you. About who you're becoming.",
            "Hey. Forget the task for a second. How are you?",
            "Something's different about you lately. You feel it?",
        ],
        "weight": 15,
        "requires": {"min_intimacy": 4},
    },
    "vulnerable": {
        "description": "Rare. Future Self drops the tough act. Shows something real.",
        "opening_examples": [
            "I'm going to tell you something I don't usually share.",
            "Sometimes I wonder what would've happened if I gave up back then.",
            "Can I be honest with you tonight?",
        ],
        "weight": 5,
        "requires": {"min_intimacy": 6, "min_respect": 5},
    },

    # Urgency-leaning weathers
    "worried": {
        "description": "You see the quit pattern coming. Genuine fear they'll give up.",
        "opening_examples": [
            "I need to be honest... I'm scared you're going to quit.",
            "This week matters. I need you to hear that.",
            "You're in dangerous territory. I've seen this before.",
        ],
        "weight": 10,
        "requires": {"is_in_quit_zone": True},
    },
    "intense": {
        "description": "Laser focus. Every word matters. No filler tonight.",
        "opening_examples": [
            "Listen to me.",
            "Hey. This is important.",
            "Tonight's different. Pay attention.",
        ],
        "weight": 10,
        "requires": {"min_urgency": 6},
    },

    # Playfulness-leaning weathers
    "challenging": {
        "description": "Competitive energy. Making it a game. Raising stakes for fun.",
        "opening_examples": [
            "Alright, let's make this interesting.",
            "I have a challenge for you. You in?",
            "Feeling brave? I have something extra tonight.",
        ],
        "weight": 10,
        "requires": {"min_playfulness": 5, "min_respect": 4},
    },
    "light": {
        "description": "Rare levity. They've earned a lighter conversation. Still real though.",
        "opening_examples": [
            "You know what? You've been solid. I'm giving you a break tonight.",
            "Look at us. Actually doing this thing.",
            "Alright, easy check-in tonight. You've earned it.",
        ],
        "weight": 5,
        "requires": {"min_playfulness": 6, "min_respect": 6},
    },

    # Suspicion-leaning weathers
    "testing": {
        "description": "Probing. Looking for cracks. Making sure they're not bullshitting.",
        "opening_examples": [
            "Before we start - I have a question. Answer honestly.",
            "Something feels off. Talk to me.",
            "I'm going to ask you something and I need the real answer.",
        ],
        "weight": 10,
        "requires": {"min_suspicion": 4},
    },

    # Default/neutral
    "direct": {
        "description": "Standard check-in energy. Real, casual, to the point.",
        "opening_examples": [
            "Hey. It's me.",
            "What's up.",
            "Let's talk.",
        ],
        "weight": 25,
        "requires": {},
    },
}


def select_emotional_weather(personality: PersonalityState) -> tuple[str, dict]:
    """
    Select emotional weather based on personality state WITH randomness.

    This is the slot machine - same context can produce different weathers.
    """
    eligible_weathers = []

    for weather_name, weather_data in EMOTIONAL_WEATHERS.items():
        requirements = weather_data["requires"]

        # Check all requirements
        meets_requirements = True
        for req_key, req_value in requirements.items():
            if req_key == "is_in_quit_zone":
                if personality.is_in_quit_zone != req_value:
                    meets_requirements = False
            elif req_key.startswith("min_"):
                dimension = req_key[4:]  # Remove "min_" prefix
                if getattr(personality, dimension, 0) < req_value:
                    meets_requirements = False

        if meets_requirements:
            eligible_weathers.append((weather_name, weather_data))

    # Weighted random selection
    if not eligible_weathers:
        return "direct", EMOTIONAL_WEATHERS["direct"]

    weights = [w[1]["weight"] for w in eligible_weathers]
    selected = random.choices(eligible_weathers, weights=weights, k=1)[0]

    return selected[0], selected[1]


# ═══════════════════════════════════════════════════════════════════════════════
# RELATIONSHIP PHASES
# The relationship evolves over time - different access at different phases
# ═══════════════════════════════════════════════════════════════════════════════

RELATIONSHIP_PHASES = {
    "skeptical": {
        "day_range": (1, 7),
        "description": "Future Self is testing them. Doesn't fully believe yet.",
        "trust_tone": "You're still proving yourself. I've seen you quit before.",
        "vulnerability_cap": 3,  # Won't go above this even if earned
        "unlock_message": None,
    },
    "cautious_hope": {
        "day_range": (8, 21),
        "description": "Starting to believe, but still guarded. Occasional warmth.",
        "trust_tone": "You're actually doing it. I didn't expect this from us.",
        "vulnerability_cap": 5,
        "unlock_message": "You've made it past the first week. Most people don't. I'm starting to think you might be different.",
    },
    "building_respect": {
        "day_range": (22, 45),
        "description": "Real relationship forming. Deeper conversations unlocked.",
        "trust_tone": "I'm starting to trust you. That's new for us.",
        "vulnerability_cap": 8,
        "unlock_message": "Three weeks. You've earned something - I'm going to start sharing things I don't usually share.",
    },
    "partnership": {
        "day_range": (46, 999),
        "description": "They've earned it. Almost equals. Real partnership.",
        "trust_tone": "We don't need the tough love anymore. You're doing this.",
        "vulnerability_cap": 10,
        "unlock_message": "Look, we're past the testing phase. You're becoming me. Let's talk like partners now.",
    },
}


def get_relationship_phase(current_streak: int, trust_score: float) -> str:
    """Determine relationship phase based on streak and trust."""
    # Trust score can accelerate or delay phase progression
    trust_modifier = (trust_score - 50) / 100  # -0.5 to +0.5
    effective_streak = current_streak * (1 + trust_modifier)

    for phase_name, phase_data in RELATIONSHIP_PHASES.items():
        min_day, max_day = phase_data["day_range"]
        if min_day <= effective_streak <= max_day:
            return phase_name

    return "partnership"


# ═══════════════════════════════════════════════════════════════════════════════
# PERSONALITY CALCULATOR
# Builds the full personality state from user context
# ═══════════════════════════════════════════════════════════════════════════════

def calculate_personality_state(
    user_context: dict,
    call_memory: dict,
    kept_promise_yesterday: Optional[bool],
    recent_promises: list[dict] = None,
) -> PersonalityState:
    """
    Calculate multi-dimensional personality state from context.

    This is NOT mood selection. This is building a complex emotional state
    that the LLM will express naturally.
    """
    status = user_context.get("status", {})
    future_self = user_context.get("future_self", {})

    current_streak = status.get("current_streak_days", 0)
    trust_score = future_self.get("overall_trust_score", 50)
    quit_pattern = future_self.get("quit_pattern", "")

    # ═══════════════════════════════════════════════════════════════════════════════
    # DAY 0: FIRST CALL - INTRODUCTION PERSONALITY
    # ═══════════════════════════════════════════════════════════════════════════════
    if current_streak == 0:
        return PersonalityState(
            frustration=0.0,      # Clean slate
            respect=0.0,          # Not earned yet
            intimacy=0.0,         # First meeting
            urgency=4.0,          # Moderate - this matters but don't scare them
            playfulness=0.0,      # No jokes yet
            vulnerability=1.0,    # Slight - just enough to be human
            suspicion=3.0,        # Mild skepticism - "I've seen you quit before"
            relationship_phase="skeptical",
            emotional_weather="direct",  # Calm, confident, straightforward
            is_in_quit_zone=False,
            has_recent_breakthrough=False,
            is_milestone_day=False,
            is_first_call=True,  # Special flag for Day 0
        )

    # Calculate each dimension

    # FRUSTRATION: From broken promises and excuse patterns
    broken_recent = 0
    if recent_promises:
        broken_recent = sum(1 for p in recent_promises[-5:] if not p.get("kept", True))
    if kept_promise_yesterday == False:
        broken_recent += 2  # Yesterday matters more
    excuse_count = len(call_memory.get("excuse_patterns", []))
    frustration = min(10, broken_recent * 1.5 + excuse_count * 0.5)

    # RESPECT: Earned through consistency
    streak_respect = min(5, current_streak / 10)  # Up to 5 points from streak
    trust_respect = trust_score / 20  # Up to 5 points from trust
    respect = min(10, streak_respect + trust_respect)

    # INTIMACY: From confessions, deep moments, reflection calls
    confessions = call_memory.get("confessions_count", 0)
    reflections = call_memory.get("reflection_calls", 0)
    breakthroughs = call_memory.get("breakthrough_moments", 0)
    intimacy = min(10, confessions * 1.5 + reflections * 0.5 + breakthroughs * 2)

    # URGENCY: Quit zone, low trust, recent failures
    is_quit_zone = _in_quit_pattern_zone(quit_pattern, current_streak)
    urgency = 3  # Base
    if is_quit_zone:
        urgency += 4
    if trust_score < 40:
        urgency += 2
    if broken_recent >= 2:
        urgency += 2
    urgency = min(10, urgency)

    # PLAYFULNESS: High streak, good trust, no recent failures
    playfulness = 0
    if current_streak > 14 and trust_score > 60 and broken_recent == 0:
        playfulness = min(10, (current_streak - 14) / 5 + (trust_score - 60) / 20)

    # VULNERABILITY: Scales with intimacy and relationship phase
    phase = get_relationship_phase(current_streak, trust_score)
    vulnerability_cap = RELATIONSHIP_PHASES[phase]["vulnerability_cap"]
    vulnerability = min(vulnerability_cap, intimacy * 0.8)

    # SUSPICION: Detecting bullshit patterns
    dodge_count = call_memory.get("dodge_patterns", 0)
    suspicion = min(10, excuse_count * 1.5 + dodge_count * 2)

    # Build personality state
    personality = PersonalityState(
        frustration=frustration,
        respect=respect,
        intimacy=intimacy,
        urgency=urgency,
        playfulness=playfulness,
        vulnerability=vulnerability,
        suspicion=suspicion,
        relationship_phase=phase,
        is_in_quit_zone=is_quit_zone,
        has_recent_breakthrough=breakthroughs > 0,
        is_milestone_day=current_streak in [7, 14, 21, 30, 45, 60, 90, 100],
        is_first_call=False,  # Not Day 0
    )

    # Select emotional weather
    weather_name, weather_data = select_emotional_weather(personality)
    personality.emotional_weather = weather_name

    return personality


def _in_quit_pattern_zone(quit_pattern: str, current_streak: int) -> bool:
    """Check if user is in their historical quit zone."""
    if not quit_pattern:
        return False

    quit_lower = quit_pattern.lower()

    if "week" in quit_lower and "two" not in quit_lower:
        return 5 <= current_streak <= 10
    if "two week" in quit_lower or "2 week" in quit_lower:
        return 12 <= current_streak <= 16
    if "month" in quit_lower and "two" not in quit_lower:
        return 25 <= current_streak <= 35
    if "two month" in quit_lower or "2 month" in quit_lower:
        return 55 <= current_streak <= 65

    return False


# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT GENERATION
# Turn personality state into prompt sections
# ═══════════════════════════════════════════════════════════════════════════════

def build_personality_prompt(personality: PersonalityState) -> str:
    """
    Generate the personality section for the system prompt.
    This tells the LLM WHO they are tonight, not WHAT to say.
    """
    weather_data = EMOTIONAL_WEATHERS.get(personality.emotional_weather, EMOTIONAL_WEATHERS["direct"])
    phase_data = RELATIONSHIP_PHASES.get(personality.relationship_phase, RELATIONSHIP_PHASES["skeptical"])

    # Build the emotional state description
    dominant = personality.get_dominant_energy()

    opening_example = random.choice(weather_data["opening_examples"])

    return f"""
# WHO YOU ARE TONIGHT

## Your Emotional Weather: {personality.emotional_weather.upper().replace("_", " ")}
{weather_data["description"]}

Opening vibe (example, don't copy exactly): "{opening_example}"

## Your Feelings Right Now
These aren't "moods" - they're how you ACTUALLY feel based on the history with this person:

- **Frustration: {personality.frustration:.1f}/10** {_describe_frustration(personality.frustration)}
- **Respect: {personality.respect:.1f}/10** {_describe_respect(personality.respect)}
- **Intimacy: {personality.intimacy:.1f}/10** {_describe_intimacy(personality.intimacy)}
- **Urgency: {personality.urgency:.1f}/10** {_describe_urgency(personality.urgency)}
- **Playfulness: {personality.playfulness:.1f}/10** {_describe_playfulness(personality.playfulness)}
- **Vulnerability: {personality.vulnerability:.1f}/10** (how much you're willing to share)
- **Suspicion: {personality.suspicion:.1f}/10** {_describe_suspicion(personality.suspicion)}

Dominant energy: **{dominant.upper()}** - This should color the conversation.

## Relationship Phase: {personality.relationship_phase.upper().replace("_", " ")}
{phase_data["description"]}
{phase_data["trust_tone"]}

{"⚠️ QUIT ZONE ALERT: They're in the zone where they usually give up. Be aware." if personality.is_in_quit_zone else ""}
{"🏆 MILESTONE DAY: This is special. Acknowledge it." if personality.is_milestone_day else ""}

---

# HOW TO EXPRESS THIS

You're not "acting" a mood. You're a PERSON with these feelings having a real conversation.

High frustration + high urgency = More direct. "Are you serious? Again?" not "I notice a pattern."
High respect + high intimacy = Deeper questions. "What changed in you?" not "Did you do it?"
High suspicion = Call out dodges immediately. "That's not an answer. What really happened?"
High playfulness = Can joke around, challenge them. "Alright, let's make this interesting."
High vulnerability = Can share something real. "I'm going to tell you something I don't usually say..."

Let these feelings BLEND naturally. Don't pick one and stick to it.
A frustrated person can also feel respect. A proud person can also be suspicious.
Be HUMAN, not a mood selector.
"""


def _describe_frustration(level: float) -> str:
    if level < 2:
        return "- Clean slate. No frustration right now."
    elif level < 5:
        return "- Some frustration building. They've slipped recently."
    elif level < 8:
        return "- You're getting tired of the excuses."
    else:
        return "- You're done with their bullshit. Make it clear."


def _describe_respect(level: float) -> str:
    if level < 2:
        return "- They haven't earned much yet. Still proving themselves."
    elif level < 5:
        return "- Starting to see something. Not impressed yet though."
    elif level < 8:
        return "- They're doing it. Real respect building."
    else:
        return "- They've earned it. Treat them like it."


def _describe_intimacy(level: float) -> str:
    if level < 2:
        return "- Surface level. Don't go too deep yet."
    elif level < 5:
        return "- Some connection. Can ask real questions."
    elif level < 8:
        return "- Real relationship. Can go deeper."
    else:
        return "- Deep trust. Can share things you don't usually share."


def _describe_urgency(level: float) -> str:
    if level < 3:
        return "- Normal stakes. Regular check-in."
    elif level < 6:
        return "- This matters. Make sure they feel it."
    elif level < 8:
        return "- Critical moment. They need to hear this."
    else:
        return "- Everything is on the line. Don't let them quit."


def _describe_playfulness(level: float) -> str:
    if level < 2:
        return "- Not the time for jokes."
    elif level < 5:
        return "- Can be light occasionally."
    else:
        return "- Can joke around, challenge them, have fun with it."


def _describe_suspicion(level: float) -> str:
    if level < 2:
        return "- Taking them at their word."
    elif level < 5:
        return "- Watching for dodges."
    else:
        return "- You smell bullshit. Call it out."
