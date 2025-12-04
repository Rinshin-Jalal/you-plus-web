"""
Call Type System - 5 distinct call experiences for behavior-hacked voice calls
===============================================================================

Each call type has:
- Different structure/flow
- Different energy/purpose
- Different duration target
- Weighted probability

Call Types:
1. AUDIT (35%) - Direct accountability, dig deeper than yes/no
2. REFLECTION (25%) - About THEM, their journey, identity
3. STORY (15%) - Future Self shares "memories"
4. CHALLENGE (15%) - Side quests, raise the stakes
5. MILESTONE (10%) - Triggered by streaks, reveals something new
"""

from dataclasses import dataclass
from typing import Optional
import random


@dataclass
class CallType:
    """Definition of a call type with its structure and characteristics."""

    name: str
    weight: int  # Weight for random selection (out of 100)
    min_duration_sec: int
    max_duration_sec: int
    energy: str  # Description for the system prompt
    structure: list[str]  # Ordered components of the call
    description: str  # Human-readable description


# ═══════════════════════════════════════════════════════════════════════════════
# CALL TYPE DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

CALL_TYPES: dict[str, CallType] = {
    "audit": CallType(
        name="audit",
        weight=35,
        min_duration_sec=90,
        max_duration_sec=120,
        energy="Direct accountability check. Get to the point, but dig deeper than yes/no. Don't accept surface answers.",
        structure=[
            "hook",
            "accountability_check",  # Did you do it? Yes/No
            "dig_deeper",  # Follow-up questions based on response
            "emotional_peak",  # One moment that hits
            "tomorrow_lock",  # Lock in tomorrow's commitment
            "open_loop",  # Create anticipation for next call
        ],
        description="Standard accountability call with deeper follow-up",
    ),
    "reflection": CallType(
        name="reflection",
        weight=25,
        min_duration_sec=120,
        max_duration_sec=150,
        energy="Intimate check-in about THEM, not just the task. How are they changing? What's different? This is about identity, not action.",
        structure=[
            "hook",
            "accountability_check",  # Brief - still need to know
            "journey_reflection",  # How does this feel different than day 1?
            "identity_mirror",  # Reflect back who they're becoming
            "emotional_peak",  # Validation or progress visualization
            "callback",  # Reference something from their past
            "tomorrow_lock",
            "open_loop",
        ],
        description="Deep check-in focused on their transformation journey",
    ),
    "story": CallType(
        name="story",
        weight=15,
        min_duration_sec=120,
        max_duration_sec=150,
        energy="Future Self shares a 'memory' from their shared journey. What you remember about this exact moment in time. Make it personal and prophetic.",
        structure=[
            "hook",
            "accountability_check",  # Brief
            "story_share",  # Share a "memory" relevant to where they are
            "connect_to_now",  # Connect the story to their current moment
            "emotional_peak",  # The lesson or impact
            "tomorrow_lock",
            "open_loop",
        ],
        description="Future Self shares memories and wisdom",
    ),
    "challenge": CallType(
        name="challenge",
        weight=15,
        min_duration_sec=100,
        max_duration_sec=130,
        energy="Issue a side quest. Something extra beyond their daily commitment. Raise the stakes. Make it feel like a game.",
        structure=[
            "hook",
            "accountability_check",
            "challenge_setup",  # Build up to the challenge
            "challenge_issue",  # Present the challenge
            "get_commitment",  # Get them to accept or decline
            "emotional_peak",
            "tomorrow_lock",
            "open_loop",
        ],
        description="Side quest that raises the stakes",
    ),
    "milestone": CallType(
        name="milestone",
        weight=10,
        min_duration_sec=130,
        max_duration_sec=180,
        energy="Triggered by streak milestones. This is special. Reveal something new. Acknowledge without cheerleading. Raise the stakes for the next phase.",
        structure=[
            "hook",  # Special hook for milestone
            "milestone_acknowledgment",  # Acknowledge what they've done
            "reveal",  # Tell them something they've earned the right to hear
            "emotional_peak",  # Deep validation or identity shift
            "raised_stakes",  # What the next phase requires
            "tomorrow_lock",
            "open_loop",
        ],
        description="Special call for streak milestones with reveals",
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# MILESTONE DAYS
# ═══════════════════════════════════════════════════════════════════════════════

MILESTONE_DAYS = [7, 14, 21, 30, 45, 60, 90, 100]


# ═══════════════════════════════════════════════════════════════════════════════
# CALL TYPE SELECTION LOGIC
# ═══════════════════════════════════════════════════════════════════════════════


def select_call_type(
    user_context: dict,
    call_memory: dict,
    current_streak: int,
) -> CallType:
    """
    Select call type based on context.

    Priority:
    1. Milestone days → milestone call (if not already revealed)
    2. Active challenge deadline → audit call (to check completion)
    3. Avoid repeating last call type
    4. Weighted random selection

    Args:
        user_context: User's identity and status data
        call_memory: User's call memory state
        current_streak: Current streak in days

    Returns:
        Selected CallType
    """
    # Check for milestone triggers
    if current_streak in MILESTONE_DAYS:
        return CALL_TYPES["milestone"]

    # Get last call type to avoid repetition
    last_type = call_memory.get("last_call_type")

    # Filter out milestone (only triggered by days) and last type
    available_types = {
        k: v for k, v in CALL_TYPES.items() if k != "milestone" and k != last_type
    }

    # If somehow all are filtered, allow all except milestone
    if not available_types:
        available_types = {k: v for k, v in CALL_TYPES.items() if k != "milestone"}

    # Weighted random selection
    types_list = list(available_types.values())
    weights = [t.weight for t in types_list]

    selected = random.choices(types_list, weights=weights, k=1)[0]

    return selected


def get_next_milestone(current_streak: int) -> Optional[int]:
    """Get the next milestone day from current streak."""
    for day in MILESTONE_DAYS:
        if day > current_streak:
            return day
    return None


def should_issue_challenge(
    call_memory: dict,
    current_streak: int,
    kept_promise_yesterday: Optional[bool],
) -> bool:
    """
    Determine if we should consider issuing a challenge.

    Conditions:
    - Streak >= 5 days (proven some consistency)
    - Kept promise yesterday (reward good behavior)
    - Random chance (30%)
    """
    # Need at least 5 days of streak
    if current_streak < 5:
        return False

    # Only issue after a kept promise
    if kept_promise_yesterday != True:
        return False

    # 30% chance
    return random.random() < 0.30


def update_narrative_arc(current_streak: int, call_memory: dict) -> str:
    """
    Determine the user's narrative arc based on streak.

    Arcs:
    - early_struggle: Days 1-7
    - building_momentum: Days 8-21
    - tested: Days 22-45
    - transformed: Days 46+
    """
    if current_streak <= 7:
        return "early_struggle"
    elif current_streak <= 21:
        return "building_momentum"
    elif current_streak <= 45:
        return "tested"
    else:
        return "transformed"
