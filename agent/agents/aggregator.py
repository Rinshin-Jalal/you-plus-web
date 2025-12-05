"""
Call Summary Aggregator
========================

Aggregates events throughout a call to produce a comprehensive CallSummary.
Not a Node - this is a stateful aggregator that collects insights from
all background agents.
"""

from typing import Optional
from datetime import datetime

from agents.events import (
    CallSummary,
    SentimentAnalysis,
    ExcuseDetected,
    PromiseResponse,
    CommitmentIdentified,
    MemorableQuoteDetected,
    PatternAlert,
)


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
        self.start_time: Optional[datetime] = None

        # Collected data
        self.sentiments: list[SentimentAnalysis] = []
        self.excuses: list[ExcuseDetected] = []
        self.promise_response: Optional[PromiseResponse] = None
        self.commitment: Optional[CommitmentIdentified] = None
        self.quotes: list[MemorableQuoteDetected] = []
        self.patterns: list[PatternAlert] = []

    def start(self):
        """Mark call start time."""
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
            if self.promise_response.kept is True:
                score += 0.15
            elif self.promise_response.kept is False:
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


__all__ = ["CallSummaryAggregator"]
