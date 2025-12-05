"""
LLM-Powered Detector Nodes
===========================

These nodes use LLM inference to detect patterns in user speech:
- ExcuseDetectorNode: Detects excuses in user responses
- SentimentAnalyzerNode: Analyzes user sentiment
- PromiseDetectorNode: Detects yes/no responses to promise questions
- QuoteExtractorNode: Extracts memorable quotes

Uses GPT-OSS-120B via Groq for fast, cheap LLM inference.
"""

from typing import AsyncGenerator, Optional
from loguru import logger

from line.nodes.reasoning import Node
from line.nodes.conversation_context import ConversationContext

from agents.events import (
    ExcuseDetected,
    SentimentAnalysis,
    PromiseResponse,
    UserFrustrated,
    MemorableQuoteDetected,
)

from core.llm import (
    analyze_excuse,
    analyze_sentiment,
    analyze_promise,
    analyze_quote,
)


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


__all__ = [
    "ExcuseDetectorNode",
    "SentimentAnalyzerNode",
    "PromiseDetectorNode",
    "QuoteExtractorNode",
]
