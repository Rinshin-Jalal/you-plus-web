"""
Background Analyzers
====================

Runs background analysis on user speech:
- Excuse detection & Callout generation
- Sentiment analysis
- Commitment extraction
- Promise detection
- Quote extraction
- Pattern analysis

These run in parallel and return insights to the main agent.
"""

import asyncio
import random
from typing import Optional, Any

from loguru import logger

from agents.events import (
    ExcuseDetected,
    ExcuseCallout,
    SentimentAnalysis,
    CommitmentIdentified,
    PromiseResponse,
    UserFrustrated,
    MemorableQuoteDetected,
    PatternAlert,
)

from core.llm import (
    analyze_excuse,
    analyze_sentiment,
    analyze_commitment,
    analyze_promise,
    analyze_quote,
)


async def run_background_analysis(
    user_text: str,
    user_context: dict,
    promise_already_detected: Optional[bool] = None,
) -> list[Any]:
    """
    Run all background analysis in parallel.

    Args:
        user_text: The user's speech transcription
        user_context: User context for personalized analysis
        promise_already_detected: If promise was already detected, skip promise analysis

    Returns:
        List of insight events to feed to the agent
    """
    if not user_text or len(user_text.strip()) < 3:
        return []

    future_self = user_context.get("future_self", {})
    favorite_excuse = future_self.get("favorite_excuse")

    # Run independent analyses in parallel
    # Note: Excuse callout depends on excuse detection, so we handle that chain separately or await it.
    # To keep it parallel, we can wrap the chain in a task.

    async def run_excuse_chain():
        excuse_event = await _analyze_excuse(user_text, favorite_excuse)
        if excuse_event:
            # Chain: Excuse -> Callout
            # We need to track excuses this call to detect repeats, but for now we'll pass an empty list
            # or rely on the agent to track it. ideally we pass the list in.
            # For simplicity in this functional pipeline, we'll generate the callout immediately.
            callout = _analyze_excuse_callout(excuse_event, [])
            return [excuse_event, callout] if callout else [excuse_event]
        return []

    tasks = [
        run_excuse_chain(),
        _analyze_sentiment(user_text),
        _analyze_commitment(user_text),
        _analyze_quote(user_text),
        _analyze_pattern(user_context),
    ]

    # Only run promise analysis if not already detected
    if promise_already_detected is None:
        tasks.append(_analyze_promise(user_text))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Collect insights
    insights = []
    for result in results:
        if isinstance(result, Exception):
            logger.warning(f"Analysis task failed: {result}")
            continue
        if result:
            if isinstance(result, list):
                insights.extend(result)
            else:
                insights.append(result)

    return insights


async def _analyze_excuse(
    user_text: str, favorite_excuse: Optional[str]
) -> Optional[ExcuseDetected]:
    """Analyze for excuses."""
    if len(user_text.strip()) < 5:
        return None

    result = await analyze_excuse(user_text, favorite_excuse)

    if not result or not result.get("has_excuse"):
        return None

    excuse_event = ExcuseDetected(
        excuse_text=result.get("excuse_text", user_text),
        matches_favorite=result.get("matches_favorite", False),
        favorite_excuse=favorite_excuse,
        confidence=result.get("confidence", 0.8),
    )

    logger.info(f"🎯 Excuse detected: {excuse_event.excuse_text}")
    return excuse_event


def _analyze_excuse_callout(
    excuse: ExcuseDetected, excuses_this_call: list[str]
) -> Optional[ExcuseCallout]:
    """
    Generate a smart callout for a detected excuse.
    Does not require async IO (pure logic).
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

    # Generic callouts
    GENERIC_CALLOUTS = [
        "That's a story you're telling yourself. Is it true?",
        "I've heard that one before. From you. Multiple times.",
        "What would future-you say about that excuse?",
        "Interesting. That's the same pattern that's kept you stuck.",
    ]

    # Determine callout type
    if excuse.matches_favorite:
        callout_type = "favorite"
    elif excuse.excuse_text in excuses_this_call:
        callout_type = "repeat"
    else:
        callout_type = "deflection"

    # Generate callout
    excuse_lower = excuse.excuse_text.lower()
    suggested_response = None

    for pattern, callouts in CALLOUTS.items():
        pattern_words = pattern.replace("_", " ")
        if pattern_words in excuse_lower or pattern in excuse_lower:
            suggested_response = random.choice(callouts)
            break
    
    if not suggested_response:
        suggested_response = random.choice(GENERIC_CALLOUTS)

    callout = ExcuseCallout(
        excuse_text=excuse.excuse_text,
        callout_type=callout_type,
        suggested_response=suggested_response,
    )

    logger.info(f"🎯 Excuse callout ({callout_type}): {suggested_response[:50]}...")
    return callout


async def _analyze_pattern(user_context: dict) -> Optional[PatternAlert]:
    """
    Analyze for concerning patterns (e.g. quit zones).
    """
    future_self = user_context.get("future_self", {})
    quit_pattern = future_self.get("quit_pattern")
    status = user_context.get("status", {})
    current_streak = status.get("current_streak_days", 0)

    if not quit_pattern:
        return None

    quit_lower = quit_pattern.lower()

    # Common quit patterns and their typical day ranges
    if "week" in quit_lower and "two" not in quit_lower and 5 <= current_streak <= 10:
        return PatternAlert(
            pattern_type="quit_pattern",
            description="User is in their typical 'first week' quit zone",
            historical_context=f"They usually quit: {quit_pattern}",
        )
    elif (
        ("two week" in quit_lower or "2 week" in quit_lower)
        and 12 <= current_streak <= 16
    ):
        return PatternAlert(
            pattern_type="quit_pattern",
            description="User is in their typical 'two week' quit zone",
            historical_context=f"They usually quit: {quit_pattern}",
        )
    elif (
        "month" in quit_lower
        and "two" not in quit_lower
        and 25 <= current_streak <= 35
    ):
        return PatternAlert(
            pattern_type="quit_pattern",
            description="User is in their typical 'one month' quit zone",
            historical_context=f"They usually quit: {quit_pattern}",
        )
    elif (
        ("two month" in quit_lower or "2 month" in quit_lower)
        and 55 <= current_streak <= 65
    ):
        return PatternAlert(
            pattern_type="quit_pattern",
            description="User is in their typical 'two month' quit zone",
            historical_context=f"They usually quit: {quit_pattern}",
        )
    
    return None


async def _analyze_sentiment(user_text: str) -> list:
    """Analyze sentiment, return events."""
    if len(user_text.strip()) < 3:
        return []

    result = await analyze_sentiment(user_text)

    if not result:
        return []

    sentiment = result.get("sentiment", "neutral")
    confidence = result.get("confidence", 0.5)
    energy = result.get("energy", "medium")

    events = []

    sentiment_event = SentimentAnalysis(
        sentiment=sentiment,
        confidence=confidence,
        indicators=[energy],
    )
    events.append(sentiment_event)

    logger.info(f"😊 Sentiment: {sentiment} ({confidence:.0%})")

    # Emit frustration alert if needed
    if sentiment == "frustrated" and confidence >= 0.7:
        frustration_level = "high" if confidence >= 0.9 else "medium"
        events.append(
            UserFrustrated(
                frustration_level=frustration_level,
                trigger=None,
                suggested_action="soften_tone"
                if frustration_level == "high"
                else "acknowledge",
            )
        )

    return events


async def _analyze_commitment(user_text: str) -> Optional[CommitmentIdentified]:
    """Analyze for commitment."""
    result = await analyze_commitment(user_text)

    if not result or not result.get("has_commitment"):
        return None

    commitment = CommitmentIdentified(
        commitment_text=result.get("commitment_text", user_text),
        action=result.get("action"),
        time=result.get("time"),
        is_specific=result.get("is_specific", False),
        confidence=result.get("confidence", 0.8),
    )

    logger.info(f"📝 Commitment: {commitment.action} at {commitment.time}")
    return commitment


async def _analyze_promise(user_text: str) -> Optional[PromiseResponse]:
    """Analyze for promise response."""
    if len(user_text.strip()) < 2:
        return None

    result = await analyze_promise(user_text)

    if not result or not result.get("answered"):
        return None

    response_type = result.get("response_type", "unclear")

    # Only process clear yes/no responses
    if response_type == "yes":
        logger.info("✅ Promise KEPT detected")
        return PromiseResponse(
            kept=True,
            response_text=user_text,
            excuse_detected=None,
            confidence=result.get("confidence", 0.9),
        )
    elif response_type == "no":
        excuse = result.get("excuse")
        logger.info(f"❌ Promise BROKEN detected, excuse: {excuse or 'none'}")
        return PromiseResponse(
            kept=False,
            response_text=user_text,
            excuse_detected=excuse,
            confidence=result.get("confidence", 0.9),
        )

    return None


async def _analyze_quote(user_text: str) -> Optional[MemorableQuoteDetected]:
    """Analyze for memorable quotes."""
    if len(user_text.strip()) < 15:
        return None

    result = await analyze_quote(user_text)

    if not result or not result.get("is_memorable"):
        return None

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
        quote_text=result.get("quote_text", user_text[:200]),
        context=quote_type,
        emotional_weight=weight_map.get(quote_type, 0.7),
        callback_potential=callback_potential,
    )

    logger.info(f'💎 Memorable quote ({quote_type}): "{user_text[:50]}..."')
    return quote


__all__ = ["run_background_analysis"]
