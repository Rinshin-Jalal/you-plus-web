"""
Background Agents for Multi-Agent Coordination
===============================================

These agents run in parallel with the main FutureYouNode,
analyzing user input and emitting insights via custom events.
They do NOT speak to the user - only the speaking node does.

Uses GPT-OSS-120B via Groq for fast, cheap LLM inference.
"""

import sys
from pathlib import Path

# Add the agent directory to Python path for package imports
AGENT_DIR = str(Path(__file__).parent.parent)
if AGENT_DIR not in sys.path:
    sys.path.insert(0, AGENT_DIR)

from typing import AsyncGenerator, Optional
from loguru import logger

from line.nodes.reasoning import Node
from line.nodes.conversation_context import ConversationContext
from line.events import UserTranscriptionReceived

from agents.events import (
    CallSummary,
    ExcuseDetected,
    ExcuseCallout,
    SentimentAnalysis,
    CommitmentIdentified,
    PromiseResponse,
    UserFrustrated,
    PatternAlert,
    MemorableQuoteDetected,
)

# Import LLM analysis functions
from core.llm import (
    analyze_excuse,
    analyze_sentiment,
    analyze_commitment,
    analyze_promise,
    analyze_quote,
    analyze_stage,
)


# ═══════════════════════════════════════════════════════════════════════════════
# LLM-POWERED BACKGROUND AGENTS
# ═══════════════════════════════════════════════════════════════════════════════


class ExcuseDetectorNode(Node):
    """
    LLM-powered agent that detects excuses in user responses.
    Emits ExcuseDetected events when excuses are identified.
    """

    def __init__(self, user_context: Optional[dict] = None):
        super().__init__()
        self.user_context = user_context or {}
        self.favorite_excuse = self._get_favorite_excuse()

    def _get_favorite_excuse(self) -> Optional[str]:
        """Get user's known favorite excuse from onboarding."""
        identity = self.user_context.get("identity", {})
        onboarding = identity.get("onboarding_context", {})
        return onboarding.get("favorite_excuse")

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[ExcuseDetected, None]:
        """Analyze transcription for excuses using LLM."""

        latest = context.get_latest_user_transcript_message()
        if not latest or len(latest.strip()) < 5:
            return

        # Call LLM for analysis
        result = await analyze_excuse(latest, self.favorite_excuse)

        if not result or not result.get("has_excuse"):
            return

        excuse_event = ExcuseDetected(
            excuse_text=result.get("excuse_text", latest),
            matches_favorite=result.get("matches_favorite", False),
            favorite_excuse=self.favorite_excuse,
            confidence=result.get("confidence", 0.8),
        )

        logger.info(f"🎯 Excuse detected: {excuse_event}")
        yield excuse_event


class SentimentAnalyzerNode(Node):
    """
    LLM-powered agent that analyzes user sentiment.
    Emits SentimentAnalysis and UserFrustrated events.
    """

    def __init__(self):
        super().__init__()
        self.sentiment_history = []

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[SentimentAnalysis | UserFrustrated, None]:
        """Analyze transcription for sentiment using LLM."""

        latest = context.get_latest_user_transcript_message()
        if not latest or len(latest.strip()) < 3:
            return

        # Call LLM for analysis
        result = await analyze_sentiment(latest)

        if not result:
            return

        sentiment = result.get("sentiment", "neutral")
        confidence = result.get("confidence", 0.5)
        energy = result.get("energy", "medium")

        sentiment_event = SentimentAnalysis(
            sentiment=sentiment,
            confidence=confidence,
            indicators=[energy],
        )

        self.sentiment_history.append(sentiment_event)
        logger.info(f"😊 Sentiment: {sentiment} ({confidence:.0%})")
        yield sentiment_event

        # Emit frustration alert if needed
        if sentiment == "frustrated" and confidence >= 0.7:
            frustration_level = "high" if confidence >= 0.9 else "medium"
            yield UserFrustrated(
                frustration_level=frustration_level,
                trigger=None,
                suggested_action="soften_tone"
                if frustration_level == "medium"
                else "acknowledge",
            )


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


class PromiseDetectorNode(Node):
    """
    LLM-powered agent that detects yes/no responses to 'did you do it?'
    Emits PromiseResponse events with linked excuse detection.
    """

    def __init__(self, user_context: Optional[dict] = None):
        super().__init__()
        self.user_context = user_context or {}
        self.detected = False  # Only detect once per call
        self.favorite_excuse = self._get_favorite_excuse()
        self.excuse_history: list[str] = []

    def _get_favorite_excuse(self) -> Optional[str]:
        """Get user's known favorite excuse from onboarding."""
        identity = self.user_context.get("identity", {})
        onboarding = identity.get("onboarding_context", {})
        return onboarding.get("favorite_excuse")

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[PromiseResponse, None]:
        """Detect promise keeping response using LLM."""

        if self.detected:
            return

        latest = context.get_latest_user_transcript_message()
        if not latest or len(latest.strip()) < 2:
            return

        # Call LLM for analysis
        result = await analyze_promise(latest)

        if not result or not result.get("answered"):
            return

        response_type = result.get("response_type", "unclear")

        # Only process clear yes/no responses
        if response_type == "yes":
            self.detected = True
            yield PromiseResponse(
                kept=True,
                response_text=latest,
                excuse_detected=None,
                confidence=result.get("confidence", 0.9),
            )
            logger.info("✅ Promise KEPT detected")

        elif response_type == "no":
            self.detected = True
            excuse = result.get("excuse")
            if excuse:
                self.excuse_history.append(excuse)

            yield PromiseResponse(
                kept=False,
                response_text=latest,
                excuse_detected=excuse,
                confidence=result.get("confidence", 0.9),
            )
            logger.info(f"❌ Promise BROKEN detected, excuse: {excuse or 'none'}")


class QuoteExtractorNode(Node):
    """
    LLM-powered agent that extracts memorable quotes from user responses.
    Emits MemorableQuoteDetected events for quotes worth remembering for callbacks.
    """

    def __init__(self):
        super().__init__()
        self.quotes_this_call: list = []

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[MemorableQuoteDetected, None]:
        """Extract memorable quotes using LLM."""

        latest = context.get_latest_user_transcript_message()
        if not latest or len(latest.strip()) < 15:
            return

        # Call LLM for analysis
        result = await analyze_quote(latest)

        if not result or not result.get("is_memorable"):
            return

        quote_type = result.get("quote_type", "vulnerability")
        callback_potential = result.get("callback_potential", "medium")

        # Map quote type to emotional weight
        weight_map = {
            "vulnerability": 0.85,
            "breakthrough": 0.9,
            "commitment": 0.8,
            "fear": 0.85,
        }

        quote = MemorableQuoteDetected(
            quote_text=result.get("quote_text", latest[:200]),
            context=quote_type,
            emotional_weight=weight_map.get(quote_type, 0.7),
            callback_potential=callback_potential,
        )

        self.quotes_this_call.append(quote)
        logger.info(f'💎 Memorable quote ({quote_type}): "{latest[:50]}..."')
        yield quote


# ═══════════════════════════════════════════════════════════════════════════════
# NON-LLM AGENTS (these work fine with pattern matching or simple logic)
# ═══════════════════════════════════════════════════════════════════════════════


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

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[ExcuseCallout, None]:
        """Not used - this node responds to ExcuseDetected events via receive_excuse."""
        return
        yield  # Make this a generator


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
        status = self.user_context.get("identity_status", {})
        return status.get("current_streak_days", 0)

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[PatternAlert, None]:
        """Analyze for concerning patterns."""

        # Check if we're in their typical quit zone
        if self.quit_pattern:
            quit_lower = self.quit_pattern.lower()

            # Common quit patterns and their typical day ranges
            if "week" in quit_lower and 5 <= self.current_streak <= 10:
                yield PatternAlert(
                    pattern_type="quit_pattern",
                    description="User is in their typical 'first week' quit zone",
                    historical_context=f"They usually quit: {self.quit_pattern}",
                )
            elif "two weeks" in quit_lower and 12 <= self.current_streak <= 16:
                yield PatternAlert(
                    pattern_type="quit_pattern",
                    description="User is in their typical 'two week' quit zone",
                    historical_context=f"They usually quit: {self.quit_pattern}",
                )
            elif "month" in quit_lower and 25 <= self.current_streak <= 35:
                yield PatternAlert(
                    pattern_type="quit_pattern",
                    description="User is in their typical 'one month' quit zone",
                    historical_context=f"They usually quit: {self.quit_pattern}",
                )


# ═══════════════════════════════════════════════════════════════════════════════
# CALL SUMMARY AGGREGATOR
# ═══════════════════════════════════════════════════════════════════════════════


class CallSummaryAggregator:
    """
    Aggregates events throughout the call to produce a CallSummary at the end.
    Not a Node - this is a stateful aggregator that collects insights.

    Usage:
        aggregator = CallSummaryAggregator(user_id, call_type, mood)

        # During call, feed events:
        aggregator.add_sentiment(sentiment_event)
        aggregator.add_excuse(excuse_event)
        aggregator.add_promise(promise_event)
        aggregator.add_commitment(commitment_event)
        aggregator.add_quote(quote_event)

        # At end of call:
        summary = aggregator.finalize(call_duration_seconds)
    """

    def __init__(
        self, user_id: str, call_type: str = "audit", mood: str = "warm_direct"
    ):
        self.user_id = user_id
        self.call_type = call_type
        self.mood = mood
        self.start_time = None

        # Collected data
        self.sentiments: list[SentimentAnalysis] = []
        self.excuses: list[ExcuseDetected] = []
        self.promise_response: Optional[PromiseResponse] = None
        self.commitment: Optional[CommitmentIdentified] = None
        self.quotes: list[MemorableQuoteDetected] = []
        self.patterns: list[PatternAlert] = []

    def start(self):
        """Mark call start time."""
        from datetime import datetime

        self.start_time = datetime.now()

    def add_sentiment(self, event: SentimentAnalysis):
        """Track sentiment throughout call."""
        self.sentiments.append(event)

    def add_excuse(self, event: ExcuseDetected):
        """Track excuses detected."""
        self.excuses.append(event)

    def add_promise(self, event: PromiseResponse):
        """Record promise response (typically only one per call)."""
        self.promise_response = event

    def add_commitment(self, event: CommitmentIdentified):
        """Record tomorrow's commitment (take the most specific one)."""
        if self.commitment is None or event.is_specific:
            self.commitment = event

    def add_quote(self, event: MemorableQuoteDetected):
        """Track memorable quotes."""
        self.quotes.append(event)

    def add_pattern(self, event: PatternAlert):
        """Track pattern alerts."""
        self.patterns.append(event)

    def _calculate_quality_score(self) -> float:
        """
        Calculate call quality based on engagement signals.

        Factors:
        - Positive sentiment: +points
        - Got a specific commitment: +points
        - Promise kept: +points
        - Memorable quotes (vulnerability/breakthrough): +points
        - Frustration: -points
        - Too many excuses: -points
        """
        score = 0.5  # Start at neutral

        # Sentiment trajectory
        if self.sentiments:
            positive_count = sum(
                1 for s in self.sentiments if s.sentiment == "positive"
            )
            frustrated_count = sum(
                1 for s in self.sentiments if s.sentiment == "frustrated"
            )
            score += positive_count * 0.1
            score -= frustrated_count * 0.15

        # Commitment quality
        if self.commitment:
            if self.commitment.is_specific:
                score += 0.2
            else:
                score += 0.1

        # Promise kept
        if self.promise_response:
            if self.promise_response.kept:
                score += 0.15
            else:
                score -= 0.1

        # Memorable quotes indicate engagement
        high_value_quotes = sum(
            1
            for q in self.quotes
            if q.callback_potential == "high"
            or q.context in ["vulnerability", "breakthrough"]
        )
        score += high_value_quotes * 0.1

        # Too many excuses is bad
        if len(self.excuses) > 2:
            score -= 0.15

        # Clamp to 0.0 - 1.0
        return max(0.0, min(1.0, score))

    def finalize(self, call_duration_seconds: Optional[int] = None) -> CallSummary:
        """
        Produce final CallSummary with all aggregated data.
        """
        from datetime import datetime

        # Calculate duration if not provided
        if call_duration_seconds is None and self.start_time:
            call_duration_seconds = int(
                (datetime.now() - self.start_time).total_seconds()
            )
        elif call_duration_seconds is None:
            call_duration_seconds = 0

        # Extract sentiment trajectory
        sentiment_trajectory = [s.sentiment for s in self.sentiments]

        # Extract excuse texts
        excuses_detected = [e.excuse_text for e in self.excuses]

        # Extract quote texts
        quotes_captured = [q.quote_text for q in self.quotes]

        # Get commitment details
        tomorrow_commitment = None
        commitment_time = None
        commitment_is_specific = False
        if self.commitment:
            tomorrow_commitment = (
                self.commitment.action or self.commitment.commitment_text
            )
            commitment_time = self.commitment.time
            commitment_is_specific = self.commitment.is_specific

        # Get promise status
        promise_kept = None
        if self.promise_response:
            promise_kept = self.promise_response.kept

        return CallSummary(
            user_id=self.user_id,
            call_duration_seconds=call_duration_seconds,
            promise_kept=promise_kept,
            tomorrow_commitment=tomorrow_commitment,
            commitment_time=commitment_time,
            commitment_is_specific=commitment_is_specific,
            sentiment_trajectory=sentiment_trajectory,
            excuses_detected=excuses_detected,
            quotes_captured=quotes_captured,
            call_type=self.call_type,
            mood=self.mood,
            call_quality_score=self._calculate_quality_score(),
        )
