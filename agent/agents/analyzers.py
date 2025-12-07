"""
Analyzer Nodes
===============

These nodes analyze user behavior and generate responses:
- CommitmentExtractorNode: Extracts tomorrow's commitment from user responses
- PatternAnalyzerNode: Analyzes user's behavior against historical patterns
- ExcuseCalloutNode: Generates smart callouts for excuses

Uses GPT-OSS-120B via Groq for LLM-powered analysis.
"""

from typing import AsyncGenerator, Optional
from loguru import logger

from line.nodes.reasoning import Node
from line.nodes.conversation_context import ConversationContext

from agents.events import (
    CommitmentIdentified,
    ExcuseDetected,
    ExcuseCallout,
    PatternAlert,
)

from core.llm import analyze_commitment


class CommitmentExtractorNode(Node):
    """
    LLM-powered agent that extracts tomorrow's commitment from user responses.
    Emits CommitmentIdentified events.
    """

    def __init__(self):
        super().__init__()

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[CommitmentIdentified, None]:
        """Extract commitment from user response using LLM."""

        latest = context.get_latest_user_transcript_message()
        if not latest or len(latest.strip()) < 5:
            return

        # Call LLM for analysis
        result = await analyze_commitment(latest)

        if not result or not result.get("has_commitment"):
            return

        commitment = CommitmentIdentified(
            commitment_text=result.get("commitment_text", latest),
            action=result.get("action"),
            time=result.get("time"),
            is_specific=result.get("is_specific", False),
            confidence=0.8 if result.get("is_specific") else 0.5,
        )

        logger.info(f"📝 Commitment: {commitment}")
        yield commitment


class ExcuseCalloutNode(Node):
    """
    Generates smart callouts for excuses.
    Chains with ExcuseDetected events to produce ExcuseCallout responses.

    Pipeline: ExcuseDetected -> ExcuseCalloutNode -> ExcuseCallout
    """

    # Pre-crafted callouts for common excuse types
    CALLOUTS = {
        "too_tired": [
            "Ah, 'too tired' - the excuse that's kept you exactly where you are.",
            "Interesting. Future you was never too tired. That's why they became me.",
            "Tired today. Tired tomorrow. Tired forever. Unless...",
        ],
        "no_time": [
            "No time? Or no priority? Be honest with yourself.",
            "You had time to sleep. Time to eat. Time to scroll. Just no time for yourself.",
            "There's always time. The question is what you're choosing to spend it on.",
        ],
        "busy": [
            "Busy is a choice. A convenient one.",
            "Everyone's busy. Winners are busy doing what matters.",
            "Busy with what exactly? Things that move you forward, or things that keep you stuck?",
        ],
        "forgot": [
            "Forgot? Or it just wasn't important enough to remember?",
            "Strange how we never forget what we truly care about.",
            "Future you never forgets. That's the difference.",
        ],
        "tomorrow": [
            "Tomorrow. The favorite word of everyone who never changes.",
            "You said tomorrow yesterday. And the day before that.",
            "Tomorrow-you is tired of your promises too.",
        ],
    }

    # Generic callouts for unknown excuses
    GENERIC_CALLOUTS = [
        "That's a story you're telling yourself. Is it true?",
        "I've heard that one before. From you. Multiple times.",
        "What would future-you say about that excuse?",
        "Interesting. That's the same pattern that's kept you stuck.",
    ]

    def __init__(self, user_context: Optional[dict] = None):
        super().__init__()
        self.user_context = user_context or {}
        self.favorite_excuse = self._get_favorite_excuse()
        self.excuses_this_call: list[str] = []

    def _get_favorite_excuse(self) -> Optional[str]:
        """Get user's known favorite excuse from onboarding."""
        identity = self.user_context.get("identity", {})
        onboarding = identity.get("onboarding_context", {})
        return onboarding.get("favorite_excuse")

    def _get_callout(self, excuse_text: str, callout_type: str) -> str:
        """Get appropriate callout for the excuse."""
        import random

        # Try to match excuse pattern to our callouts
        excuse_lower = excuse_text.lower()

        for pattern, callouts in self.CALLOUTS.items():
            pattern_words = pattern.replace("_", " ")
            if pattern_words in excuse_lower or pattern in excuse_lower:
                return random.choice(callouts)

        # Fall back to generic
        return random.choice(self.GENERIC_CALLOUTS)

    def receive_excuse(self, excuse: ExcuseDetected) -> Optional[ExcuseCallout]:
        """Transform ExcuseDetected into ExcuseCallout."""

        # Determine callout type
        if excuse.matches_favorite:
            callout_type = "favorite"
        elif excuse.excuse_text in self.excuses_this_call:
            callout_type = "repeat"
        else:
            callout_type = "deflection"

        # Track for repeat detection
        self.excuses_this_call.append(excuse.excuse_text)

        # Generate callout
        suggested_response = self._get_callout(excuse.excuse_text, callout_type)

        callout = ExcuseCallout(
            excuse_text=excuse.excuse_text,
            callout_type=callout_type,
            suggested_response=suggested_response,
        )

        logger.info(f"🎯 Excuse callout ({callout_type}): {suggested_response[:50]}...")
        return callout

class PatternAnalyzerNode(Node):
    """
    Analyzes user's behavior against historical patterns.
    Emits PatternAlert events when concerning patterns are detected.
    """

    def __init__(self, user_context: Optional[dict] = None):
        super().__init__()
        self.user_context = user_context or {}
        self.quit_pattern = self._get_quit_pattern()
        self.current_streak = self._get_streak()

    def _get_quit_pattern(self) -> Optional[str]:
        """Get user's known quit pattern from onboarding."""
        identity = self.user_context.get("identity", {})
        onboarding = identity.get("onboarding_context", {})
        return onboarding.get("quit_pattern")

    def _get_streak(self) -> int:
        """Get current streak."""
        status = self.user_context.get("status", {})
        return status.get("current_streak_days", 0)

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[PatternAlert, None]:
        """Analyze for concerning patterns."""

        # Check if we're in their typical quit zone
        if self.quit_pattern:
            quit_lower = self.quit_pattern.lower()

            # Common quit patterns and their typical day ranges
            if "week" in quit_lower and "two" not in quit_lower and 5 <= self.current_streak <= 10:
                yield PatternAlert(
                    pattern_type="quit_pattern",
                    description="User is in their typical 'first week' quit zone",
                    historical_context=f"They usually quit: {self.quit_pattern}",
                )
            elif (
                ("two week" in quit_lower or "2 week" in quit_lower)
                and 12 <= self.current_streak <= 16
            ):
                yield PatternAlert(
                    pattern_type="quit_pattern",
                    description="User is in their typical 'two week' quit zone",
                    historical_context=f"They usually quit: {self.quit_pattern}",
                )
            elif (
                "month" in quit_lower
                and "two" not in quit_lower
                and 25 <= self.current_streak <= 35
            ):
                yield PatternAlert(
                    pattern_type="quit_pattern",
                    description="User is in their typical 'one month' quit zone",
                    historical_context=f"They usually quit: {self.quit_pattern}",
                )
            elif (
                ("two month" in quit_lower or "2 month" in quit_lower)
                and 55 <= self.current_streak <= 65
            ):
                yield PatternAlert(
                    pattern_type="quit_pattern",
                    description="User is in their typical 'two month' quit zone",
                    historical_context=f"They usually quit: {self.quit_pattern}",
                )


__all__ = [
    "CommitmentExtractorNode",
    "ExcuseCalloutNode",
    "PatternAnalyzerNode",
]
