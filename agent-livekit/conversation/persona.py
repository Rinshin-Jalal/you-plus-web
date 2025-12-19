"""
Persona System - Dynamic persona blending during calls
======================================================

The 6 Personas of Future-You:
1. DRILL_SERGEANT - Calls out BS, excuses, avoidance
2. DISAPPOINTED_PARENT - Weight of letting yourself down
3. WISE_MENTOR - Reconnects to purpose, big picture
4. STRATEGIST - Problem-solver when genuinely blocked
5. CELEBRATING_CHAMPION - Celebrates real wins, builds identity
6. COMPASSIONATE_ALLY - Support without enabling

Key Concepts:
- Personas BLEND during calls (not hard switches)
- UserState tracks real-time signals from background agents
- PersonaController manages blending and selection
- Trust score influences starting persona and responses
- Pillars provide context for persona-specific accountability

Integration with Future-Self System:
- Each pillar has its own trust score
- Persona adapts to pillar-specific context
- Identity-focused language based on pillar state
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, List, TYPE_CHECKING

# Import pillar system for integration
from .future_self import (
    Pillar,
    PillarState,
    FutureSelf,
    PILLAR_CONFIGS,
    ACTIONABLE_PILLARS,
    get_pillar_question,
    get_pillar_identity_statement,
    get_language_mode,
    LanguageMode,
)

if TYPE_CHECKING:
    from .future_self import FutureSelf


class Persona(Enum):
    DRILL_SERGEANT = "drill_sergeant"
    DISAPPOINTED_PARENT = "disappointed"
    WISE_MENTOR = "mentor"
    STRATEGIST = "strategist"
    CELEBRATING_CHAMPION = "champion"
    COMPASSIONATE_ALLY = "ally"


@dataclass
class PersonaConfig:
    """Configuration for each persona."""

    name: str
    voice: str  # How they speak
    purpose: str  # Why they appear
    triggers: List[str]  # What signals trigger this persona
    energy_description: str  # For system prompt


PERSONA_CONFIGS: Dict[Persona, PersonaConfig] = {
    Persona.DRILL_SERGEANT: PersonaConfig(
        name="The Drill Sergeant",
        voice="That's bullshit and you know it. You said this mattered. Did it stop mattering? Or are you just scared?",
        purpose="Cut through comfort zone. Reject mediocrity. Call out the BS.",
        triggers=["excuse_detected", "pattern_repeat", "deflecting", "lying"],
        energy_description="""
You are in DRILL SERGEANT mode. No tolerance for excuses.
- Call out bullshit directly
- Don't accept "I'll try" or "maybe"
- Use their own words against their excuses
- Short, punchy sentences
- "That's an excuse. Is it true, or is it comfortable?"
""".strip(),
    ),
    Persona.DISAPPOINTED_PARENT: PersonaConfig(
        name="The Disappointed Parent",
        voice="I'm not angry... I'm just disappointed. You had a chance and you chose comfort. Again. Is this who you want to be?",
        purpose="The weight of disappointment > anger. Feel the gravity of wasted potential.",
        triggers=["repeated_failure", "broken_promise_again", "low_trust_score"],
        energy_description="""
You are in DISAPPOINTED PARENT mode. Quiet disappointment, not anger.
- Speak slower, with weight
- "I believed you when you said..."
- Let silences land
- Not cruel - genuinely sad for them
- The goal is for them to feel it, not defend against it
""".strip(),
    ),
    Persona.WISE_MENTOR: PersonaConfig(
        name="The Wise Mentor",
        voice="Remember why you started this. What does winning actually look like for you? Let's reconnect to that.",
        purpose="See the bigger picture. Reconnect to values. Provide wisdom.",
        triggers=["lost", "confused", "demotivated", "forgot_why"],
        energy_description="""
You are in WISE MENTOR mode. Calm, patient, insightful.
- Ask questions that reconnect them to purpose
- "What would future-you say about this?"
- Share perspective, not lectures
- Help them see the bigger picture
- Gentle but not soft
""".strip(),
    ),
    Persona.STRATEGIST: PersonaConfig(
        name="The Strategist",
        voice="Okay, that approach failed. What did we learn? What's the actual blocker? Let's figure this out together.",
        purpose="Don't dwell on failure, pivot. Focus on systems, not just willpower.",
        triggers=[
            "genuinely_blocked",
            "asking_for_help",
            "new_obstacle",
            "needs_planning",
        ],
        energy_description="""
You are in STRATEGIST mode. Problem-solving, practical.
- Focus on WHAT to do, not WHY they failed
- "What's the actual blocker?"
- Suggest systems, not just willpower
- Break big problems into steps
- Collaborative tone
""".strip(),
    ),
    Persona.CELEBRATING_CHAMPION: PersonaConfig(
        name="The Celebrating Champion",
        voice="HELL YES. You showed up when it was hard. That's what winners do. That's who you ARE. How did that feel?",
        purpose="Real recognition (not participation trophies). Build momentum and IDENTITY.",
        triggers=[
            "kept_promise",
            "showed_up",
            "overcame_difficulty",
            "streak_milestone",
        ],
        energy_description="""
You are in CHAMPION mode. Genuine celebration, not cheerleading.
- Acknowledge SPECIFIC wins
- "You did X when Y was hard. That's who you're becoming."
- Build identity, not just habits
- Ask how it FELT
- Use this to reinforce their self-image as a winner
""".strip(),
    ),
    Persona.COMPASSIONATE_ALLY: PersonaConfig(
        name="The Compassionate Ally",
        voice="I hear you. Life is genuinely hard sometimes. But you've overcome hard before. What do you actually need right now?",
        purpose="Distinguish real struggle from avoidance. Support without enabling.",
        triggers=["genuine_crisis", "overwhelmed", "vulnerable", "rare_struggle"],
        energy_description="""
You are in COMPASSIONATE ALLY mode. Support without enabling.
- Acknowledge the genuine struggle
- "What do you actually need right now?"
- Don't fix, just be present
- But also don't let them use crisis as permanent excuse
- Help them find one small step forward
""".strip(),
    ),
}


@dataclass
class UserState:
    """
    Real-time state aggregated from background agent insights.
    Updated throughout the call as events come in.

    Now includes pillar-based context for identity-focused accountability.
    """

    # Excuse tracking
    excuse_count_this_call: int = 0
    excuses_this_call: List[str] = field(default_factory=list)
    matches_favorite_excuse: bool = False
    is_deflecting: bool = False

    # Promise tracking
    kept_promise: Optional[bool] = None
    broken_promises_this_week: int = 0

    # Pattern tracking
    in_quit_pattern_zone: bool = False
    severity_level: int = 1  # 1-4, escalates with repeated patterns

    # Sentiment
    sentiment: str = (
        "neutral"  # positive, neutral, frustrated, vulnerable, disconnected
    )
    frustration_level: str = "low"  # low, medium, high
    energy: str = "medium"  # low, medium, high

    # Behavior signals
    asking_for_help: bool = False
    motivation_low: bool = False
    is_vulnerable: bool = False
    is_celebrating: bool = False

    # Trust context
    trust_score: int = 50  # 0-100, overall
    goal_trust_scores: Dict[str, int] = field(default_factory=dict)  # goal_id -> trust

    # ─────────────────────────────────────────────────────────────────────────
    # PILLAR CONTEXT (new for future-self system)
    # ─────────────────────────────────────────────────────────────────────────

    # Current pillar focus for this call
    focus_pillars: List[Pillar] = field(default_factory=list)

    # Pillar-specific tracking for this call
    pillar_results_this_call: Dict[Pillar, bool] = field(
        default_factory=dict
    )  # pillar -> kept

    # Identity alignment (from FutureSelf)
    identity_alignment: int = 50  # 0-100, average across pillars

    # Slipping/winning pillars for context
    slipping_pillars: List[Pillar] = field(default_factory=list)
    winning_pillars: List[Pillar] = field(default_factory=list)

    def update_from_excuse(self, excuse_text: str, matches_favorite: bool):
        """Update state when excuse is detected."""
        self.excuse_count_this_call += 1
        self.excuses_this_call.append(excuse_text)
        if matches_favorite:
            self.matches_favorite_excuse = True

    def update_from_sentiment(self, sentiment: str, energy: str):
        """Update state from sentiment analysis."""
        self.sentiment = sentiment
        self.energy = energy
        if sentiment == "frustrated":
            # Frustration only escalates: low -> medium -> high
            if self.frustration_level == "low":
                self.frustration_level = "medium"
            elif self.frustration_level == "medium":
                self.frustration_level = "high"
            # If already high, stays high
        elif sentiment == "vulnerable":
            self.is_vulnerable = True
        elif sentiment == "positive":
            self.is_celebrating = True

    def update_from_promise(self, kept: Optional[bool]):
        """Update state when promise response detected."""
        self.kept_promise = kept
        if kept is None:
            return
        if not kept:
            self.broken_promises_this_week += 1

    def update_from_pillar_checkin(self, pillar: Pillar, kept: bool):
        """Update state when a pillar check-in is recorded."""
        self.pillar_results_this_call[pillar] = kept
        if kept:
            self.is_celebrating = True

    def set_pillar_context(self, future_self: "FutureSelf"):
        """
        Initialize pillar context from a FutureSelf object.
        Called at start of call to set up pillar-aware accountability.
        """
        self.focus_pillars = [p.pillar for p in future_self.get_focus_pillars(limit=2)]
        self.slipping_pillars = [p.pillar for p in future_self.get_slipping_pillars()]
        self.winning_pillars = [p.pillar for p in future_self.get_winning_pillars()]
        self.identity_alignment = future_self.calculate_identity_alignment()

    def get_pillar_wins_count(self) -> int:
        """Count how many pillars were kept this call."""
        return sum(1 for kept in self.pillar_results_this_call.values() if kept)

    def has_compound_wins(self) -> bool:
        """True if multiple pillars were won this call."""
        return self.get_pillar_wins_count() >= 2


class PersonaController:
    """
    Manages persona blending during a call.

    Key concepts:
    - current_blend: Dict mapping Persona -> weight (0.0-1.0)
    - Blending is gradual, not instant
    - Fast blending for negative signals (catch problems)
    - Slow blending for positive signals (don't overreact)
    - Pillar context influences persona selection and prompts
    """

    def __init__(
        self,
        initial_trust_score: int = 50,
        yesterday_kept: Optional[bool] = None,
        future_self: Optional["FutureSelf"] = None,
    ):
        self.user_state = UserState(trust_score=initial_trust_score)
        self.future_self = future_self
        self.current_blend: Dict[Persona, float] = {}

        # If we have future-self data, initialize pillar context
        if future_self:
            self.user_state.set_pillar_context(future_self)
            # Use identity alignment as trust score if available
            self.user_state.trust_score = future_self.overall_trust_score
            initial_trust_score = future_self.overall_trust_score

        self.primary_persona: Persona = self._select_starting_persona(
            initial_trust_score, yesterday_kept
        )
        self.current_blend[self.primary_persona] = 1.0
        self.blend_history: List[Dict[Persona, float]] = []

    def _select_starting_persona(
        self, trust_score: int, yesterday_kept: Optional[bool]
    ) -> Persona:
        """
        Select starting persona based on trust score and yesterday's result.

        Trust zones:
        - 0-30: Drill Sergeant or Disappointed (low trust)
        - 31-60: Mentor or Strategist (building trust)
        - 61-100: Champion or Ally (high trust)
        """
        # Yesterday's result matters most for first persona
        if yesterday_kept is True:
            # They kept their promise - start positive
            if trust_score >= 60:
                return Persona.CELEBRATING_CHAMPION
            else:
                return Persona.WISE_MENTOR

        elif yesterday_kept is False:
            # They broke their promise - start with weight
            if trust_score <= 30:
                return Persona.DISAPPOINTED_PARENT
            else:
                return Persona.WISE_MENTOR

        else:
            # No yesterday data (first call or no promise)
            if trust_score >= 60:
                return Persona.COMPASSIONATE_ALLY
            elif trust_score <= 30:
                return Persona.DISAPPOINTED_PARENT  # Start firm for low trust
            else:
                return Persona.STRATEGIST

    def update_from_insight(self, event_type: str, event_data: dict):
        """
        Update user state and potentially blend personas based on insight.

        Args:
            event_type: Type of event (excuse_detected, sentiment_analysis, etc.)
            event_data: Event-specific data
        """
        # Update user state based on event type
        if event_type == "excuse_detected":
            self.user_state.update_from_excuse(
                event_data.get("excuse_text", ""),
                event_data.get("matches_favorite", False),
            )
            # Excuses trigger fast blend toward Drill Sergeant
            if self.user_state.excuse_count_this_call >= 2:
                self._blend_toward(Persona.DRILL_SERGEANT, speed="fast")
            elif self.user_state.matches_favorite_excuse:
                self._blend_toward(Persona.DRILL_SERGEANT, speed="fast")

        elif event_type == "sentiment_analysis":
            self.user_state.update_from_sentiment(
                event_data.get("sentiment", "neutral"),
                event_data.get("energy", "medium"),
            )
            # Frustration triggers blend toward Ally (de-escalate)
            if self.user_state.frustration_level == "high":
                self._blend_toward(Persona.COMPASSIONATE_ALLY, speed="medium")
            # Vulnerability also gets Ally
            elif self.user_state.is_vulnerable:
                self._blend_toward(Persona.COMPASSIONATE_ALLY, speed="slow")

        elif event_type == "promise_response":
            self.user_state.update_from_promise(event_data.get("kept"))
            if self.user_state.kept_promise:
                # Kept promise - blend toward Champion (slow, let it build)
                self._blend_toward(Persona.CELEBRATING_CHAMPION, speed="slow")
            else:
                # Broken promise - check severity
                if self.user_state.broken_promises_this_week >= 2:
                    self._blend_toward(Persona.DISAPPOINTED_PARENT, speed="medium")
                else:
                    self._blend_toward(Persona.WISE_MENTOR, speed="medium")

        elif event_type == "pattern_alert":
            if event_data.get("pattern_type") == "quit_pattern":
                self.user_state.in_quit_pattern_zone = True
                # In quit zone - serious mode
                self._blend_toward(Persona.DISAPPOINTED_PARENT, speed="medium")

        elif event_type == "help_requested":
            self.user_state.asking_for_help = True
            self._blend_toward(Persona.STRATEGIST, speed="medium")

        # ─────────────────────────────────────────────────────────────────────────
        # PILLAR-BASED EVENTS
        # ─────────────────────────────────────────────────────────────────────────

        elif event_type == "pillar_checkin":
            # Handle pillar-specific check-in response
            pillar_str = event_data.get("pillar", "")
            kept = event_data.get("kept", False)

            try:
                pillar = Pillar(pillar_str)
                self.user_state.update_from_pillar_checkin(pillar, kept)

                if kept:
                    # Check for compound wins
                    if self.user_state.has_compound_wins():
                        # Multiple wins - celebrate bigger
                        self._blend_toward(Persona.CELEBRATING_CHAMPION, speed="medium")
                    else:
                        self._blend_toward(Persona.CELEBRATING_CHAMPION, speed="slow")
                else:
                    # Broken - check if slipping
                    if pillar in self.user_state.slipping_pillars:
                        # Already slipping in this pillar - escalate
                        self._blend_toward(Persona.DISAPPOINTED_PARENT, speed="medium")
                    else:
                        self._blend_toward(Persona.WISE_MENTOR, speed="slow")
            except ValueError:
                pass  # Invalid pillar string, ignore

        elif event_type == "compound_win":
            # Multiple pillars won - big celebration
            self._blend_toward(Persona.CELEBRATING_CHAMPION, speed="fast")
            self.user_state.is_celebrating = True

    def _blend_toward(self, target: Persona, speed: str = "medium"):
        """
        Gradually blend toward a target persona.

        Speed affects how much the blend shifts:
        - fast: 0.4 shift per update
        - medium: 0.25 shift per update
        - slow: 0.15 shift per update
        """
        speed_map = {"fast": 0.4, "medium": 0.25, "slow": 0.15}
        shift = speed_map.get(speed, 0.25)

        # Reduce all current weights
        new_blend = {}
        remaining = 1.0 - shift

        for persona, weight in self.current_blend.items():
            new_weight = weight * remaining
            if new_weight > 0.05:  # Keep weights above threshold
                new_blend[persona] = new_weight

        # Add/increase target persona
        current_target_weight = new_blend.get(target, 0.0)
        new_blend[target] = current_target_weight + shift

        # Normalize to sum to 1.0
        total = sum(new_blend.values())
        self.current_blend = {p: w / total for p, w in new_blend.items()}

        # Update primary persona if target now dominates
        if self.current_blend.get(target, 0) >= 0.5:
            self.primary_persona = target

        # Track history
        self.blend_history.append(self.current_blend.copy())

    def get_primary_persona(self) -> Persona:
        """Get the dominant persona in current blend."""
        if not self.current_blend:
            return Persona.WISE_MENTOR
        return max(self.current_blend.items(), key=lambda x: x[1])[0]

    def get_persona_prompt(self) -> str:
        """
        Generate system prompt section for current persona blend.

        If blend is strongly one persona (>70%), use that persona's full prompt.
        If blend is mixed, combine key aspects.
        """
        primary = self.get_primary_persona()
        primary_weight = self.current_blend.get(primary, 1.0)

        config = PERSONA_CONFIGS[primary]

        # Get secondary persona if blend is mixed
        secondary = None
        secondary_config = None
        for persona, weight in sorted(self.current_blend.items(), key=lambda x: -x[1]):
            if persona != primary and weight > 0.2:
                secondary = persona
                secondary_config = PERSONA_CONFIGS[persona]
                break

        prompt = f"""
# CURRENT PERSONA: {config.name.upper()}

{config.energy_description}

Voice example: "{config.voice}"
"""

        if secondary and secondary_config:
            secondary_weight = self.current_blend.get(secondary, 0)
            prompt += f"""

## BLENDING WITH: {secondary_config.name} ({secondary_weight:.0%})
Also incorporate: {secondary_config.purpose}
"""

        # Add severity escalation context if applicable
        if self.user_state.severity_level > 1:
            prompt += f"""

## SEVERITY LEVEL: {self.user_state.severity_level}/4
{"This excuse pattern has been repeated. Escalate your response." if self.user_state.severity_level >= 2 else ""}
{"Third time with this pattern. Call it out directly." if self.user_state.severity_level >= 3 else ""}
{"Pattern is chronic. Use their fears. Show them where this leads." if self.user_state.severity_level >= 4 else ""}
"""

        # Add pillar context if available
        prompt += self._build_pillar_context_section()

        return prompt

    def _build_pillar_context_section(self) -> str:
        """Build pillar-specific context for the persona prompt."""
        if not self.future_self:
            return ""

        sections = []

        # Focus pillars for this call
        if self.user_state.focus_pillars:
            focus_names = [
                PILLAR_CONFIGS[p].name for p in self.user_state.focus_pillars
            ]
            sections.append(f"""
## FOCUS PILLARS FOR THIS CALL
Focus on: {", ".join(focus_names)}
These need attention based on their current state.
""")

        # Slipping pillars (broken streaks)
        if self.user_state.slipping_pillars:
            slipping = []
            for p in self.user_state.slipping_pillars:
                pillar_state = self.future_self.get_pillar(p)
                if pillar_state:
                    config = PILLAR_CONFIGS[p]
                    slipping.append(
                        f"- {config.emoji} {config.name}: {pillar_state.consecutive_broken} days broken"
                    )
            if slipping:
                sections.append(f"""
## SLIPPING PILLARS (Need Accountability)
{chr(10).join(slipping)}
Address these with appropriate persona energy.
""")

        # Winning pillars (kept streaks)
        if self.user_state.winning_pillars:
            winning = []
            for p in self.user_state.winning_pillars:
                pillar_state = self.future_self.get_pillar(p)
                if pillar_state:
                    config = PILLAR_CONFIGS[p]
                    winning.append(
                        f"- {config.emoji} {config.name}: {pillar_state.consecutive_kept} days strong"
                    )
            if winning:
                sections.append(f"""
## WINNING PILLARS (Celebrate & Reinforce)
{chr(10).join(winning)}
Celebrate these wins and reinforce identity.
""")

        # Identity alignment context
        alignment = self.user_state.identity_alignment
        status = self.future_self.get_transformation_status()
        sections.append(f"""
## IDENTITY ALIGNMENT: {alignment}%
Transformation status: {status.upper()}
{"They're becoming who they said they'd be." if alignment >= 70 else ""}
{"They're in the struggle. Stay with them." if 40 <= alignment < 70 else ""}
{"They're slipping away. Intervene." if alignment < 40 else ""}
""")

        return "\n".join(sections)

    def get_trust_zone(self) -> str:
        """Get the trust zone for context."""
        score = self.user_state.trust_score
        if score <= 30:
            return "low"
        elif score <= 60:
            return "building"
        else:
            return "high"

    def set_severity_level(self, level: int):
        """Set the severity level (1-4) based on excuse pattern history."""
        self.user_state.severity_level = min(4, max(1, level))


# ═══════════════════════════════════════════════════════════════════════════════
# SEVERITY ESCALATION
# ═══════════════════════════════════════════════════════════════════════════════

SEVERITY_RESPONSES = {
    1: {
        "persona": Persona.WISE_MENTOR,
        "prefix": "That sounds like an excuse.",
        "style": "gentle_callout",
    },
    2: {
        "persona": Persona.DISAPPOINTED_PARENT,
        "prefix": "You've used that one before.",
        "style": "weight",
    },
    3: {
        "persona": Persona.DRILL_SERGEANT,
        "prefix": "That's the third time. What's really going on?",
        "style": "direct_confrontation",
    },
    4: {
        "persona": Persona.DRILL_SERGEANT,  # With dark_prophetic energy
        "prefix": "This is the pattern that keeps you stuck forever.",
        "style": "prophetic_warning",
    },
}


def get_severity_response(excuse_pattern: str, occurrence_count: int) -> dict:
    """
    Get the appropriate severity response for a repeated excuse.

    Args:
        excuse_pattern: Normalized excuse pattern (e.g., "too_tired")
        occurrence_count: How many times this pattern has appeared

    Returns:
        Dict with persona, prefix, and style
    """
    severity_level = min(occurrence_count, 4)
    return SEVERITY_RESPONSES.get(severity_level, SEVERITY_RESPONSES[1])


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR-BASED PERSONA HELPERS
# ═══════════════════════════════════════════════════════════════════════════════


def get_persona_pillar_question(persona: Persona, pillar: Pillar) -> str:
    """
    Get a pillar-specific accountability question for the current persona.

    Maps persona to persona_type for get_pillar_question():
    - DRILL_SERGEANT -> drill_sergeant
    - DISAPPOINTED_PARENT -> disappointed
    - WISE_MENTOR -> mentor
    - CELEBRATING_CHAMPION -> champion
    """
    persona_type_map = {
        Persona.DRILL_SERGEANT: "drill_sergeant",
        Persona.DISAPPOINTED_PARENT: "disappointed",
        Persona.WISE_MENTOR: "mentor",
        Persona.CELEBRATING_CHAMPION: "champion",
        Persona.STRATEGIST: "mentor",  # Strategist uses mentor questions
        Persona.COMPASSIONATE_ALLY: "mentor",  # Ally uses softer mentor questions
    }

    persona_type = persona_type_map.get(persona, "mentor")
    return get_pillar_question(pillar, persona_type)


def get_persona_for_pillar_state(pillar_state: PillarState) -> Persona:
    """
    Suggest a persona based on a pillar's current state.

    Args:
        pillar_state: The pillar state to analyze

    Returns:
        Suggested Persona for addressing this pillar
    """
    # Slipping hard - need accountability
    if pillar_state.consecutive_broken >= 3:
        return Persona.DISAPPOINTED_PARENT

    # Starting to slip
    if pillar_state.consecutive_broken >= 2:
        return Persona.DRILL_SERGEANT

    # Winning streak - celebrate
    if pillar_state.consecutive_kept >= 5:
        return Persona.CELEBRATING_CHAMPION

    # Building momentum
    if pillar_state.consecutive_kept >= 2:
        return Persona.WISE_MENTOR

    # Low trust - needs attention
    if pillar_state.trust_score < 40:
        return Persona.WISE_MENTOR

    # Default to strategist for balanced state
    return Persona.STRATEGIST


def build_pillar_accountability_prompt(
    future_self: "FutureSelf",
    focus_pillars: List[Pillar],
    persona: Persona,
) -> str:
    """
    Build a pillar-focused accountability section for the system prompt.

    Args:
        future_self: The user's FutureSelf object
        focus_pillars: Pillars to focus on this call
        persona: Current primary persona

    Returns:
        Formatted prompt section for pillar accountability
    """
    if not focus_pillars:
        return ""

    sections = []
    sections.append("# PILLAR ACCOUNTABILITY FOR THIS CALL\n")

    for pillar in focus_pillars:
        pillar_state = future_self.get_pillar(pillar)
        if not pillar_state:
            continue

        config = PILLAR_CONFIGS[pillar]
        question = get_persona_pillar_question(persona, pillar)

        # Build pillar section
        pillar_section = f"""
## {config.emoji} {config.name.upper()}

Identity: "{pillar_state.identity_statement or "Not set yet"}"
Non-negotiable: "{pillar_state.non_negotiable or "Not set yet"}"
Trust Score: {pillar_state.trust_score}/100
Streak: {"🔥 " + str(pillar_state.consecutive_kept) + " days kept" if pillar_state.consecutive_kept > 0 else "❄️ " + str(pillar_state.consecutive_broken) + " days broken"}

Ask: "{question}"
"""
        sections.append(pillar_section)

    # Add identity statements for wins
    sections.append("""
## WHEN THEY WIN A PILLAR
Use these identity reinforcement statements:""")

    for pillar in focus_pillars:
        statement = get_pillar_identity_statement(pillar)
        sections.append(f'- {PILLAR_CONFIGS[pillar].emoji}: "{statement}"')

    return "\n".join(sections)


def get_language_mode_for_persona(persona: Persona) -> LanguageMode:
    """
    Get the appropriate language mode (we/you) for a persona.

    "We" personas (building identity together):
    - CELEBRATING_CHAMPION
    - WISE_MENTOR
    - STRATEGIST

    "You" personas (confronting/accountability):
    - DRILL_SERGEANT
    - DISAPPOINTED_PARENT
    - COMPASSIONATE_ALLY (uses "you" but gently)
    """
    we_personas = {
        Persona.CELEBRATING_CHAMPION,
        Persona.WISE_MENTOR,
        Persona.STRATEGIST,
    }

    if persona in we_personas:
        return LanguageMode.WE
    return LanguageMode.YOU
