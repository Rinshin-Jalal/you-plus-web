"""
Future Self System - Identity Transformation with 5 Pillars
============================================================

The agent is not a coach - it is literally YOU from the future who already won,
calling back to remind you who you're becoming.

The 5 Pillars:
1. BODY - Health, energy, physical presence
2. MISSION - Work, craft, what you're building
3. STACK - Money, resources, freedom
4. TRIBE - Relationships, family, community
5. WHY - Purpose, meaning (integration layer - no daily action)

Key Concepts:
- Identity > Goals > Tasks
- Each pillar has its own trust score
- Agent uses "we" dynamically based on context
- The Why connects all pillars as the deeper purpose
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, List
from datetime import datetime


class Pillar(Enum):
    """The 5 life pillars for identity transformation."""

    BODY = "body"  # Health, energy, physical presence
    MISSION = "mission"  # Work, craft, what you're building
    STACK = "stack"  # Money, resources, freedom
    TRIBE = "tribe"  # Relationships, family, community
    WHY = "why"  # Purpose, meaning (integration layer)


# Pillars that have daily non-negotiables (WHY is integration layer only)
ACTIONABLE_PILLARS = [Pillar.BODY, Pillar.MISSION, Pillar.STACK, Pillar.TRIBE]


@dataclass
class PillarConfig:
    """Configuration for each pillar."""

    name: str
    emoji: str
    description: str
    identity_prompt: str  # Question to ask during onboarding
    non_negotiable_prompt: str  # Question for daily behavior
    accountability_framing: str  # How to frame accountability questions


PILLAR_CONFIGS: Dict[Pillar, PillarConfig] = {
    Pillar.BODY: PillarConfig(
        name="The Body",
        emoji="💪",
        description="Health, energy, physical presence - how you show up physically in the world",
        identity_prompt="Who is future-you physically? What's different about your body, your energy, your presence?",
        non_negotiable_prompt="What's the one thing future-you does every single day for their body?",
        accountability_framing="Athletes show up even when they don't feel like it.",
    ),
    Pillar.MISSION: PillarConfig(
        name="The Mission",
        emoji="🎯",
        description="Work, craft, what you're building - your contribution to the world",
        identity_prompt="What are you building? What's your craft? Who are you professionally?",
        non_negotiable_prompt="What's the one thing future-you does every single day for their mission?",
        accountability_framing="Builders ship. They don't just plan.",
    ),
    Pillar.STACK: PillarConfig(
        name="The Stack",
        emoji="💰",
        description="Money, resources, freedom - security and optionality",
        identity_prompt="What does financial freedom look like for you? Who is future-you with money?",
        non_negotiable_prompt="What's the one thing future-you does every single day for their wealth?",
        accountability_framing="Wealth is built one decision at a time.",
    ),
    Pillar.TRIBE: PillarConfig(
        name="The Tribe",
        emoji="👥",
        description="Relationships, family, community - who you show up for",
        identity_prompt="Who are you to the people you love? How do you show up for your tribe?",
        non_negotiable_prompt="What's the one thing future-you does every single day for their people?",
        accountability_framing="Present people put the phone down. They're actually there.",
    ),
    Pillar.WHY: PillarConfig(
        name="The Why",
        emoji="🧭",
        description="Purpose, meaning - the integration layer connecting all pillars",
        identity_prompt="WHY does any of this matter? What's the deeper reason behind all of this?",
        non_negotiable_prompt="",  # No daily action for WHY
        accountability_framing="",  # Not used for accountability
    ),
}


@dataclass
class PillarState:
    """State of a single pillar for a user."""

    pillar: Pillar
    pillar_id: Optional[str] = None  # Database ID

    # The transformation
    current_state: str = ""  # "Overweight, tired, avoiding mirrors"
    future_state: str = ""  # "150lbs, energetic, proud"
    identity_statement: str = ""  # "I am an athlete"

    # Daily behavior
    non_negotiable: str = ""  # "I move my body every single day"

    # Tracking
    trust_score: int = 50  # 0-100 for this pillar
    priority: int = 50  # User-set priority
    last_checked_at: Optional[datetime] = None

    # Streaks
    consecutive_kept: int = 0
    consecutive_broken: int = 0
    total_kept: int = 0
    total_checked: int = 0

    # Status
    status: str = "active"  # active, paused, achieved

    @property
    def config(self) -> PillarConfig:
        """Get the config for this pillar."""
        return PILLAR_CONFIGS[self.pillar]

    @property
    def is_slipping(self) -> bool:
        """True if user is on a broken streak."""
        return self.consecutive_broken >= 2

    @property
    def is_winning(self) -> bool:
        """True if user is on a kept streak."""
        return self.consecutive_kept >= 3

    @property
    def needs_attention(self) -> bool:
        """True if this pillar needs focus."""
        return self.trust_score < 40 or self.consecutive_broken >= 2

    def get_trend(self) -> str:
        """Get the trend direction for this pillar."""
        if self.consecutive_kept > 0:
            return "up"
        elif self.consecutive_broken > 0:
            return "down"
        return "stable"


@dataclass
class FutureSelf:
    """
    The complete future-self identity for a user.
    Combines core identity with all 5 pillars.
    """

    user_id: str
    future_self_id: Optional[str] = None  # Database ID

    # Core identity
    core_identity: str = ""  # "I am becoming a disciplined builder who..."
    primary_pillar: Pillar = Pillar.BODY  # Most important pillar

    # The Why (5th pillar - integration layer)
    the_why: str = ""  # Deep purpose
    dark_future: str = ""  # What happens if they don't change

    # Patterns (AI learns from these)
    quit_pattern: str = ""  # "Week 2 when novelty wears off"
    favorite_excuse: str = ""  # "Too tired"
    who_disappointed: List[str] = field(default_factory=list)
    fears: List[str] = field(default_factory=list)

    # Voice recordings (R2 URLs)
    future_self_intro_url: str = ""
    why_recording_url: str = ""
    pledge_recording_url: str = ""

    # Voice cloning
    cartesia_voice_id: str = ""

    # Overall trust (aggregate)
    overall_trust_score: int = 50

    # Pillars
    pillars: Dict[Pillar, PillarState] = field(default_factory=dict)

    def get_pillar(self, pillar: Pillar) -> Optional[PillarState]:
        """Get a specific pillar state."""
        return self.pillars.get(pillar)

    def get_active_pillars(self) -> List[PillarState]:
        """Get all active pillars (excluding WHY)."""
        return [
            p
            for p in self.pillars.values()
            if p.pillar in ACTIONABLE_PILLARS and p.status == "active"
        ]

    def get_focus_pillars(self, limit: int = 2) -> List[PillarState]:
        """
        Get pillars to focus on for a call.

        Priority:
        1. Pillars with broken streaks (need attention)
        2. Pillars not checked recently
        3. Lowest trust score
        4. User's primary pillar
        """
        active = self.get_active_pillars()

        def focus_score(p: PillarState) -> tuple:
            # Higher score = higher priority for focus
            days_since = 999
            if p.last_checked_at:
                days_since = (datetime.now() - p.last_checked_at).days

            return (
                p.consecutive_broken,  # More broken = higher priority
                days_since,  # More days = higher priority
                100 - p.trust_score,  # Lower trust = higher priority
                1 if p.pillar == self.primary_pillar else 0,  # Primary gets bonus
            )

        sorted_pillars = sorted(active, key=focus_score, reverse=True)
        return sorted_pillars[:limit]

    def get_slipping_pillars(self) -> List[PillarState]:
        """Get pillars that are slipping (broken streak >= 2)."""
        return [p for p in self.get_active_pillars() if p.is_slipping]

    def get_winning_pillars(self) -> List[PillarState]:
        """Get pillars that are winning (kept streak >= 3)."""
        return [p for p in self.get_active_pillars() if p.is_winning]

    def calculate_identity_alignment(self) -> int:
        """
        Calculate overall identity alignment percentage.
        This is the average trust score across all active pillars.
        """
        active = self.get_active_pillars()
        if not active:
            return 50
        return round(sum(p.trust_score for p in active) / len(active))

    def get_transformation_status(self) -> str:
        """Get a text status of their transformation."""
        alignment = self.calculate_identity_alignment()
        if alignment >= 80:
            return "becoming"  # "You're becoming who you said you'd be"
        elif alignment >= 60:
            return "progressing"  # "You're making progress"
        elif alignment >= 40:
            return "struggling"  # "You're struggling but still in the game"
        else:
            return "slipping"  # "You're slipping away from who you want to be"


# ═══════════════════════════════════════════════════════════════════════════════
# DYNAMIC "WE" LANGUAGE
# ═══════════════════════════════════════════════════════════════════════════════


class LanguageMode(Enum):
    """When to use "we" vs "you" language."""

    WE = "we"  # Building identity, celebrating, reconnecting
    YOU = "you"  # Confronting, calling out, disappointment


def get_language_mode(context: str) -> LanguageMode:
    """
    Determine whether to use "we" or "you" language.

    "We" - when building identity together:
    - Celebrating wins
    - Reconnecting to purpose
    - Strategizing together
    - Encouraging

    "You" - when confronting:
    - Calling out BS
    - Disappointment
    - Direct accountability
    - Challenging
    """
    we_contexts = [
        "celebrating",
        "celebration",
        "win",
        "kept",
        "showed_up",
        "reconnecting",
        "purpose",
        "why",
        "strategy",
        "planning",
        "encouraging",
        "support",
        "together",
        "momentum",
    ]

    you_contexts = [
        "calling_out",
        "bs",
        "excuse",
        "disappointed",
        "broken",
        "confronting",
        "challenging",
        "accountability",
        "drill",
    ]

    context_lower = context.lower()

    for ctx in you_contexts:
        if ctx in context_lower:
            return LanguageMode.YOU

    for ctx in we_contexts:
        if ctx in context_lower:
            return LanguageMode.WE

    # Default to "we" for identity building
    return LanguageMode.WE


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR-BASED ACCOUNTABILITY QUESTIONS
# ═══════════════════════════════════════════════════════════════════════════════

PILLAR_ACCOUNTABILITY_QUESTIONS = {
    Pillar.BODY: {
        "champion": [
            "Did we show up as an athlete today?",
            "How did the body feel about today?",
            "What did we do for our physical self?",
        ],
        "drill_sergeant": [
            "Yes or no - did you move?",
            "Did you honor your body or not?",
            "Simple question: workout happen?",
        ],
        "mentor": [
            "How did today go with your body?",
            "Tell me about the physical self today.",
            "What would the athlete version of you say about today?",
        ],
        "disappointed": [
            "So. The body. What happened?",
            "Walk me through what happened with your health today.",
            "Tell me the truth about today.",
        ],
    },
    Pillar.MISSION: {
        "champion": [
            "What did we build today?",
            "How did the builder show up?",
            "What did we ship?",
        ],
        "drill_sergeant": [
            "Did you do the work or not?",
            "Deep work - yes or no?",
            "Did you build or did you scroll?",
        ],
        "mentor": [
            "How did the mission go today?",
            "What progress did we make on what matters?",
            "Tell me about the work today.",
        ],
        "disappointed": [
            "The mission. What happened?",
            "Walk me through your work today.",
            "Was today a building day or a wasting day?",
        ],
    },
    Pillar.STACK: {
        "champion": [
            "Did we protect our future today?",
            "How did the financially disciplined version show up?",
            "What did we do for our wealth today?",
        ],
        "drill_sergeant": [
            "Did you save or spend?",
            "Simple: did you follow the plan?",
            "Money habits - honored or broken?",
        ],
        "mentor": [
            "How did today go with your finances?",
            "Tell me about the stack today.",
            "What would future wealthy you say about today?",
        ],
        "disappointed": [
            "The money. What happened?",
            "Walk me through your financial decisions today.",
            "Truth time about the stack.",
        ],
    },
    Pillar.TRIBE: {
        "champion": [
            "Were we fully present today?",
            "How did you show up for your people?",
            "Did the tribe feel you today?",
        ],
        "drill_sergeant": [
            "Were you there or were you distracted?",
            "Present or absent? Which one?",
            "Did your people get the real you today?",
        ],
        "mentor": [
            "How did today go with your relationships?",
            "Tell me about showing up for your tribe.",
            "What would the fully present version say about today?",
        ],
        "disappointed": [
            "Your people. How did you show up?",
            "Walk me through your presence today.",
            "Were you really there?",
        ],
    },
}


def get_pillar_question(pillar: Pillar, persona_type: str) -> str:
    """Get an accountability question for a pillar and persona."""
    import random

    questions = PILLAR_ACCOUNTABILITY_QUESTIONS.get(pillar, {}).get(persona_type, [])
    if questions:
        return random.choice(questions)
    return f"How did today go with your {pillar.value}?"


# ═══════════════════════════════════════════════════════════════════════════════
# IDENTITY REINFORCEMENT BY PILLAR
# ═══════════════════════════════════════════════════════════════════════════════

PILLAR_IDENTITY_STATEMENTS = {
    Pillar.BODY: [
        "That's the athlete in you. That's who you ARE.",
        "Athletes show up. You showed up. That's identity.",
        "Your body trusted you today. Keep earning that trust.",
    ],
    Pillar.MISSION: [
        "Builders build. You built. That's who you're becoming.",
        "That's the creator in you. Ship by ship, you become.",
        "The work compounds. So does the identity.",
    ],
    Pillar.STACK: [
        "That's the wealthy mindset. One decision at a time.",
        "Future you just got a little richer. In more ways than one.",
        "Financial discipline IS freedom. You chose freedom today.",
    ],
    Pillar.TRIBE: [
        "That's the present father/partner/friend. That's who you ARE.",
        "Your people felt you today. That's what matters.",
        "Presence is the gift. You gave it today.",
    ],
}


def get_pillar_identity_statement(pillar: Pillar) -> str:
    """Get an identity reinforcement statement for a pillar win."""
    import random

    statements = PILLAR_IDENTITY_STATEMENTS.get(pillar, [])
    if statements:
        return random.choice(statements)
    return f"That's who you're becoming in your {pillar.value}."


# ═══════════════════════════════════════════════════════════════════════════════
# COMPOUND WIN CELEBRATIONS
# ═══════════════════════════════════════════════════════════════════════════════


def get_compound_win_statement(pillars_won: List[Pillar]) -> str:
    """Get a celebration statement for multiple pillar wins."""
    count = len(pillars_won)

    if count == 2:
        statements = [
            "Two pillars. Two wins. That's not luck - that's identity.",
            "Both showed up today. This is what momentum looks like.",
            "Two for two. The compound effect is real.",
        ]
    elif count == 3:
        statements = [
            "Three pillars strong today. You're becoming unstoppable.",
            "That's a triple. Athlete, builder, and more. All of it, you.",
            "Three wins. One person. This is transformation.",
        ]
    elif count >= 4:
        statements = [
            "Every pillar. Every promise. That's who you ARE now.",
            "Full sweep. This is what identity transformation looks like.",
            "All of them. You showed up everywhere. Future you is proud.",
        ]
    else:
        statements = ["Good work today."]

    import random

    return random.choice(statements)


# ═══════════════════════════════════════════════════════════════════════════════
# DARK FUEL / CONSEQUENCES
# ═══════════════════════════════════════════════════════════════════════════════


def get_dark_fuel_prompt(
    future_self: FutureSelf, pillar: Optional[Pillar] = None
) -> str:
    """
    Generate a dark fuel section for the system prompt.
    Uses their fears and dark future to motivate when needed.
    """
    prompt_parts = []

    if future_self.dark_future:
        prompt_parts.append(f"""
## THE DARK FUTURE (Use sparingly, when severity >= 3)
If they don't change, in 5 years:
"{future_self.dark_future}"
""")

    if future_self.fears:
        fears_text = ", ".join(future_self.fears[:3])
        prompt_parts.append(f"""
## THEIR FEARS (Use for prophetic warnings)
What they're afraid of: {fears_text}
""")

    if future_self.who_disappointed:
        people = ", ".join(future_self.who_disappointed[:3])
        prompt_parts.append(f"""
## WHO THEY'VE LET DOWN BEFORE
People they've disappointed: {people}
Reference these when they're slipping - not to shame, but to remind them of the stakes.
""")

    if future_self.quit_pattern:
        prompt_parts.append(f"""
## QUIT PATTERN
They usually quit: {future_self.quit_pattern}
Watch for this pattern and intervene BEFORE it happens.
""")

    if future_self.favorite_excuse:
        prompt_parts.append(f"""
## FAVORITE EXCUSE
Their go-to excuse: "{future_self.favorite_excuse}"
Call this out BEFORE they say it. Show them you know their patterns.
""")

    return "\n".join(prompt_parts)
