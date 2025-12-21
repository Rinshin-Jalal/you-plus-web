"""
Future Self System - Identity Transformation with Dynamic Pillars
==================================================================

The agent is not a coach - it is literally YOU from the future who already won,
calling back to remind you who you're becoming.

Users select their own pillars during onboarding (e.g., "gym", "career", "finances", 
or custom pillars like "custom_gaming_less"). The "why" is stored separately in the 
future_self table as the integration layer connecting all pillars.

Key Concepts:
- Identity > Goals > Tasks
- Each pillar has its own trust score
- Agent uses "we" dynamically based on context
- The Why connects all pillars as the deeper purpose
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List
from datetime import datetime


@dataclass
class PillarState:
    """State of a single pillar for a user."""

    pillar: str  # Pillar ID (e.g., "gym", "career", "custom_gaming_less")
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
    Combines core identity with user-selected pillars.
    """

    user_id: str
    future_self_id: Optional[str] = None  # Database ID

    # Core identity
    core_identity: str = ""  # "I am becoming a disciplined builder who..."
    primary_pillar: str = ""  # Most important pillar ID (e.g., "gym", "career")

    # The Why (integration layer - stored in future_self table, not as a pillar)
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

    # Pillars (keyed by pillar ID string)
    pillars: Dict[str, PillarState] = field(default_factory=dict)

    def get_pillar(self, pillar_id: str) -> Optional[PillarState]:
        """Get a specific pillar state by ID."""
        return self.pillars.get(pillar_id)

    def get_active_pillars(self) -> List[PillarState]:
        """Get all active pillars."""
        return [p for p in self.pillars.values() if p.status == "active"]

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

from enum import Enum


class LanguageMode(Enum):
    """When to use "we" vs "you" language."""

    WE = "we"  # Building identity, celebrating, reconnecting
    YOU = "you"  # Confronting, calling out, disappointment





# ═══════════════════════════════════════════════════════════════════════════════
# DARK FUEL / CONSEQUENCES
# ═══════════════════════════════════════════════════════════════════════════════


def get_dark_fuel_prompt(
    future_self: FutureSelf, pillar_id: Optional[str] = None
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

