"""
Integration Tests for LLM-Powered Background Agents
====================================================

Tests each background agent with real LLM calls via Groq GPT-OSS-120B.

Run with:
    cd agent && uv run python tests/test_background_agents.py
"""

import asyncio
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

# Add agent directory to path
AGENT_DIR = str(Path(__file__).parent.parent)
if AGENT_DIR not in sys.path:
    sys.path.insert(0, AGENT_DIR)

from agents.background_agents import (
    ExcuseDetectorNode,
    SentimentAnalyzerNode,
    CommitmentExtractorNode,
    PromiseDetectorNode,
    ExcuseCalloutNode,
    PatternAnalyzerNode,
    QuoteExtractorNode,
    CallSummaryAggregator,
)
from agents.events import (
    ExcuseDetected,
    SentimentAnalysis,
    CommitmentIdentified,
    PromiseResponse,
    UserFrustrated,
    PatternAlert,
    MemorableQuoteDetected,
    ExcuseCallout,
    CallSummary,
)


@dataclass
class MockContext:
    """Mock conversation context for testing."""

    transcript: Optional[str] = None

    def get_latest_user_transcript_message(self) -> Optional[str]:
        return self.transcript


class TestResults:
    """Track test results."""

    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []

    def add(self, name: str, passed: bool, details: str = ""):
        self.tests.append((name, passed, details))
        if passed:
            self.passed += 1
        else:
            self.failed += 1

    def print_summary(self):
        print("\n" + "=" * 60)
        print("TEST RESULTS")
        print("=" * 60)

        for name, passed, details in self.tests:
            status = "PASS" if passed else "FAIL"
            print(f"  [{status}] {name}")
            if details and not passed:
                print(f"         {details}")

        print("-" * 60)
        print(f"  PASSED: {self.passed}/{self.passed + self.failed}")
        print(f"  FAILED: {self.failed}/{self.passed + self.failed}")
        print("=" * 60)


async def collect_events(generator) -> list:
    """Collect all events from an async generator."""
    events = []
    async for event in generator:
        events.append(event)
    return events


# ═══════════════════════════════════════════════════════════════════════════════
# EXCUSE DETECTOR TESTS
# ═══════════════════════════════════════════════════════════════════════════════


async def test_excuse_detector():
    """Test ExcuseDetectorNode with LLM."""
    print("\n[ExcuseDetectorNode]")
    results = TestResults()

    # Test 1: Detects 'too tired' excuse
    node = ExcuseDetectorNode()
    context = MockContext(transcript="I was too tired to do it")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects 'too tired' excuse",
        len(events) == 1 and events[0].excuse_text is not None,
        f"Got {len(events)} events" if len(events) != 1 else "",
    )

    # Test 2: Detects 'didn't have time' excuse
    node = ExcuseDetectorNode()
    context = MockContext(transcript="I didn't have time yesterday")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects 'didn't have time' excuse",
        len(events) == 1,
        f"Got {len(events)} events" if len(events) != 1 else "",
    )

    # Test 3: No false positive on positive response
    node = ExcuseDetectorNode()
    context = MockContext(transcript="Yes I did it! Feeling great!")
    events = await collect_events(node.process_context(context))
    results.add(
        "No false positive on 'yes I did it'",
        len(events) == 0,
        f"Got {len(events)} events (expected 0)" if len(events) != 0 else "",
    )

    # Test 4: Matches favorite excuse
    user_context = {
        "identity": {"onboarding_context": {"favorite_excuse": "I was too tired"}}
    }
    node = ExcuseDetectorNode(user_context=user_context)
    context = MockContext(transcript="I was just too tired after work")
    events = await collect_events(node.process_context(context))
    results.add(
        "Matches favorite excuse",
        len(events) == 1 and events[0].matches_favorite,
        f"matches_favorite={events[0].matches_favorite if events else 'N/A'}",
    )

    results.print_summary()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# SENTIMENT ANALYZER TESTS
# ═══════════════════════════════════════════════════════════════════════════════


async def test_sentiment_analyzer():
    """Test SentimentAnalyzerNode with LLM."""
    print("\n[SentimentAnalyzerNode]")
    results = TestResults()

    # Test 1: Detects positive sentiment
    node = SentimentAnalyzerNode()
    context = MockContext(transcript="Yes I did it! Feeling great about myself!")
    events = await collect_events(node.process_context(context))
    sentiment_events = [e for e in events if isinstance(e, SentimentAnalysis)]
    results.add(
        "Detects positive sentiment",
        len(sentiment_events) == 1 and sentiment_events[0].sentiment == "positive",
        f"Got sentiment: {sentiment_events[0].sentiment if sentiment_events else 'none'}",
    )

    # Test 2: Detects frustrated user
    node = SentimentAnalyzerNode()
    context = MockContext(
        transcript="Just leave me alone! I don't care about this anymore!"
    )
    events = await collect_events(node.process_context(context))
    sentiment_events = [e for e in events if isinstance(e, SentimentAnalysis)]
    results.add(
        "Detects frustrated user",
        len(sentiment_events) == 1 and sentiment_events[0].sentiment == "frustrated",
        f"Got sentiment: {sentiment_events[0].sentiment if sentiment_events else 'none'}",
    )

    # Test 3: Detects defensive/deflecting sentiment
    node = SentimentAnalyzerNode()
    context = MockContext(transcript="Well actually, you don't understand my situation")
    events = await collect_events(node.process_context(context))
    sentiment_events = [e for e in events if isinstance(e, SentimentAnalysis)]
    results.add(
        "Detects defensive/deflecting sentiment",
        len(sentiment_events) == 1
        and sentiment_events[0].sentiment in ["defensive", "frustrated"],
        f"Got sentiment: {sentiment_events[0].sentiment if sentiment_events else 'none'}",
    )

    # Test 4: Neutral for short response
    node = SentimentAnalyzerNode()
    context = MockContext(transcript="ok")
    events = await collect_events(node.process_context(context))
    sentiment_events = [e for e in events if isinstance(e, SentimentAnalysis)]
    results.add(
        "Neutral for short response",
        len(sentiment_events) == 1 and sentiment_events[0].sentiment == "neutral",
        f"Got sentiment: {sentiment_events[0].sentiment if sentiment_events else 'none'}",
    )

    results.print_summary()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# COMMITMENT EXTRACTOR TESTS
# ═══════════════════════════════════════════════════════════════════════════════


async def test_commitment_extractor():
    """Test CommitmentExtractorNode with LLM."""
    print("\n[CommitmentExtractorNode]")
    results = TestResults()

    # Test 1: Extracts specific commitment (time + action)
    node = CommitmentExtractorNode()
    context = MockContext(transcript="I'll go to the gym at 7am tomorrow")
    events = await collect_events(node.process_context(context))
    results.add(
        "Extracts specific commitment (time + action)",
        len(events) == 1 and events[0].is_specific,
        f"is_specific={events[0].is_specific if events else 'N/A'}",
    )

    # Test 2: Extracts 'I will' commitment
    node = CommitmentExtractorNode()
    context = MockContext(transcript="I will do my workout in the morning")
    events = await collect_events(node.process_context(context))
    results.add(
        "Extracts 'I will' commitment",
        len(events) == 1 and events[0].time is not None,
        f"time={events[0].time if events else 'N/A'}",
    )

    # Test 3: Detects vague commitment (no time)
    node = CommitmentExtractorNode()
    context = MockContext(transcript="I'll definitely do it")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects vague commitment (no time)",
        len(events) == 1 and not events[0].is_specific,
        f"is_specific={events[0].is_specific if events else 'N/A'}",
    )

    # Test 4: No commitment without action words
    node = CommitmentExtractorNode()
    context = MockContext(transcript="Yeah that sounds good")
    events = await collect_events(node.process_context(context))
    results.add(
        "No commitment without action words",
        len(events) == 0,
        f"Got {len(events)} events (expected 0)" if len(events) != 0 else "",
    )

    # Test 5: Detects 'promise' as commitment
    node = CommitmentExtractorNode()
    context = MockContext(transcript="I promise I'll do it at 9pm")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects 'promise' as commitment",
        len(events) == 1 and events[0].is_specific,
        f"is_specific={events[0].is_specific if events else 'N/A'}",
    )

    results.print_summary()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# PROMISE DETECTOR TESTS
# ═══════════════════════════════════════════════════════════════════════════════


async def test_promise_detector():
    """Test PromiseDetectorNode with LLM."""
    print("\n[PromiseDetectorNode]")
    results = TestResults()

    # Test 1: Detects YES response
    node = PromiseDetectorNode()
    context = MockContext(transcript="Yes, I did it!")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects YES response",
        len(events) == 1 and events[0].kept is True,
        f"kept={events[0].kept if events else 'N/A'}",
    )

    # Test 2: Detects NO response
    node = PromiseDetectorNode()
    context = MockContext(transcript="No, I didn't do it")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects NO response",
        len(events) == 1 and events[0].kept is False,
        f"kept={events[0].kept if events else 'N/A'}",
    )

    # Test 3: Links excuse to broken promise
    node = PromiseDetectorNode()
    context = MockContext(transcript="No I didn't, I was too tired after work")
    events = await collect_events(node.process_context(context))
    results.add(
        "Links excuse to broken promise",
        len(events) == 1
        and events[0].kept is False
        and events[0].excuse_detected is not None,
        f"excuse={events[0].excuse_detected if events else 'N/A'}",
    )

    # Test 4: Detects 'I did it' as YES
    node = PromiseDetectorNode()
    context = MockContext(transcript="I did it this morning")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects 'I did it' as YES",
        len(events) == 1 and events[0].kept is True,
        f"kept={events[0].kept if events else 'N/A'}",
    )

    # Test 5: No detection for ambiguous response
    node = PromiseDetectorNode()
    context = MockContext(transcript="hmm let me think about that")
    events = await collect_events(node.process_context(context))
    results.add(
        "No detection for ambiguous response",
        len(events) == 0,
        f"Got {len(events)} events (expected 0)" if len(events) != 0 else "",
    )

    # Test 6: Only detects promise once per call
    node = PromiseDetectorNode()
    context = MockContext(transcript="Yes I did it!")
    events1 = await collect_events(node.process_context(context))
    context2 = MockContext(transcript="No wait I didn't")
    events2 = await collect_events(node.process_context(context2))
    results.add(
        "Only detects promise once per call",
        len(events1) == 1 and len(events2) == 0,
        f"events1={len(events1)}, events2={len(events2)}",
    )

    results.print_summary()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# EXCUSE CALLOUT NODE TESTS
# ═══════════════════════════════════════════════════════════════════════════════


async def test_excuse_callout():
    """Test ExcuseCalloutNode (non-LLM, pattern matching)."""
    print("\n[ExcuseCalloutNode]")
    results = TestResults()

    # Test 1: Generates callout for 'too tired'
    node = ExcuseCalloutNode()
    excuse = ExcuseDetected(
        excuse_text="I was too tired",
        matches_favorite=False,
        favorite_excuse=None,
        confidence=0.8,
    )
    callout = node.receive_excuse(excuse)
    results.add(
        "Generates callout for 'too tired'",
        callout is not None and "tired" in callout.suggested_response.lower(),
        f"response: {callout.suggested_response[:50] if callout else 'None'}...",
    )

    # Test 2: Marks favorite excuse correctly
    user_context = {
        "identity": {"onboarding_context": {"favorite_excuse": "didn't have time"}}
    }
    node = ExcuseCalloutNode(user_context=user_context)
    excuse = ExcuseDetected(
        excuse_text="I didn't have time",
        matches_favorite=True,
        favorite_excuse="didn't have time",
        confidence=0.9,
    )
    callout = node.receive_excuse(excuse)
    results.add(
        "Marks favorite excuse correctly",
        callout is not None and callout.callout_type == "favorite",
        f"callout_type: {callout.callout_type if callout else 'None'}",
    )

    # Test 3: Detects repeat excuse
    node = ExcuseCalloutNode()
    excuse1 = ExcuseDetected(
        excuse_text="too busy",
        matches_favorite=False,
        favorite_excuse=None,
        confidence=0.7,
    )
    excuse2 = ExcuseDetected(
        excuse_text="too busy",
        matches_favorite=False,
        favorite_excuse=None,
        confidence=0.7,
    )
    node.receive_excuse(excuse1)
    callout2 = node.receive_excuse(excuse2)
    results.add(
        "Detects repeat excuse",
        callout2 is not None and callout2.callout_type == "repeat",
        f"callout_type: {callout2.callout_type if callout2 else 'None'}",
    )

    # Test 4: Uses generic callout for unknown excuse
    node = ExcuseCalloutNode()
    excuse = ExcuseDetected(
        excuse_text="my goldfish died",
        matches_favorite=False,
        favorite_excuse=None,
        confidence=0.6,
    )
    callout = node.receive_excuse(excuse)
    results.add(
        "Uses generic callout for unknown excuse",
        callout is not None and callout.suggested_response is not None,
        f"response: {callout.suggested_response[:50] if callout else 'None'}...",
    )

    results.print_summary()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# PATTERN ANALYZER TESTS
# ═══════════════════════════════════════════════════════════════════════════════


async def test_pattern_analyzer():
    """Test PatternAnalyzerNode."""
    print("\n[PatternAnalyzerNode]")
    results = TestResults()

    # Test 1: Detects first week quit zone
    user_context = {
        "identity": {
            "onboarding_context": {"quit_pattern": "Usually after first week"}
        },
        "identity_status": {"current_streak_days": 7},
    }
    node = PatternAnalyzerNode(user_context=user_context)
    context = MockContext(transcript="I'm not sure I can keep going")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects first week quit zone",
        len(events) == 1 and events[0].pattern_type == "quit_pattern",
        f"pattern_type: {events[0].pattern_type if events else 'N/A'}",
    )

    # Test 2: Detects two week quit zone
    user_context = {
        "identity": {"onboarding_context": {"quit_pattern": "After two weeks usually"}},
        "identity_status": {"current_streak_days": 14},
    }
    node = PatternAnalyzerNode(user_context=user_context)
    context = MockContext(transcript="This is getting hard")
    events = await collect_events(node.process_context(context))
    results.add(
        "Detects two week quit zone",
        len(events) == 1 and events[0].pattern_type == "quit_pattern",
        f"pattern_type: {events[0].pattern_type if events else 'N/A'}",
    )

    # Test 3: No alert when outside quit zone
    user_context = {
        "identity": {
            "onboarding_context": {"quit_pattern": "Usually after first week"}
        },
        "identity_status": {"current_streak_days": 20},
    }
    node = PatternAnalyzerNode(user_context=user_context)
    context = MockContext(transcript="Things are going well")
    events = await collect_events(node.process_context(context))
    results.add(
        "No alert when outside quit zone",
        len(events) == 0,
        f"Got {len(events)} events (expected 0)" if len(events) != 0 else "",
    )

    results.print_summary()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# QUOTE EXTRACTOR TESTS
# ═══════════════════════════════════════════════════════════════════════════════


async def test_quote_extractor():
    """Test QuoteExtractorNode with LLM."""
    print("\n[QuoteExtractorNode]")
    results = TestResults()

    # Test 1: Extracts vulnerability quote
    node = QuoteExtractorNode()
    context = MockContext(
        transcript="I'm scared that I'll never change. The truth is I've been lying to myself for years."
    )
    events = await collect_events(node.process_context(context))
    results.add(
        "Extracts vulnerability quote",
        len(events) == 1 and events[0].context in ["vulnerability", "fear"],
        f"context: {events[0].context if events else 'N/A'}",
    )

    # Test 2: Extracts breakthrough quote
    node = QuoteExtractorNode()
    context = MockContext(
        transcript="I finally realized what's been holding me back. It clicked for me today."
    )
    events = await collect_events(node.process_context(context))
    results.add(
        "Extracts breakthrough quote",
        len(events) == 1 and events[0].context == "breakthrough",
        f"context: {events[0].context if events else 'N/A'}",
    )

    # Test 3: Extracts strong commitment quote
    node = QuoteExtractorNode()
    context = MockContext(
        transcript="I promise, no matter what, I will not skip tomorrow. Never again."
    )
    events = await collect_events(node.process_context(context))
    results.add(
        "Extracts strong commitment quote",
        len(events) == 1 and events[0].context == "commitment",
        f"context: {events[0].context if events else 'N/A'}",
    )

    # Test 4: Extracts fear/stakes quote
    node = QuoteExtractorNode()
    context = MockContext(
        transcript="If I don't do this, I'll lose my family. My kids are watching me fail."
    )
    events = await collect_events(node.process_context(context))
    results.add(
        "Extracts fear/stakes quote",
        len(events) == 1 and events[0].context == "fear",
        f"context: {events[0].context if events else 'N/A'}",
    )

    # Test 5: No quote for short response
    node = QuoteExtractorNode()
    context = MockContext(transcript="yeah okay")
    events = await collect_events(node.process_context(context))
    results.add(
        "No quote for short response",
        len(events) == 0,
        f"Got {len(events)} events (expected 0)" if len(events) != 0 else "",
    )

    # Test 6: High callback potential for multiple vulnerability markers
    node = QuoteExtractorNode()
    context = MockContext(
        transcript="I'm afraid I can't do this. I've never told anyone, but I've been struggling with this for years and I don't know if I can change."
    )
    events = await collect_events(node.process_context(context))
    results.add(
        "High callback potential for multiple vulnerability markers",
        len(events) == 1 and events[0].callback_potential == "high",
        f"callback_potential: {events[0].callback_potential if events else 'N/A'}",
    )

    results.print_summary()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# CALL SUMMARY AGGREGATOR TESTS
# ═══════════════════════════════════════════════════════════════════════════════


async def test_call_summary_aggregator():
    """Test CallSummaryAggregator."""
    print("\n[CallSummaryAggregator]")
    results = TestResults()

    # Test 1: Creates valid summary
    aggregator = CallSummaryAggregator(
        user_id="test-user", call_type="audit", mood="warm_direct"
    )
    aggregator.start()
    summary = aggregator.finalize()
    results.add(
        "Creates valid summary",
        isinstance(summary, CallSummary) and summary.user_id == "test-user",
        f"user_id: {summary.user_id}",
    )

    # Test 2: Tracks promise kept
    aggregator = CallSummaryAggregator(user_id="test-user")
    aggregator.start()
    aggregator.add_promise(
        PromiseResponse(
            kept=True, response_text="yes", excuse_detected=None, confidence=0.9
        )
    )
    summary = aggregator.finalize()
    results.add(
        "Tracks promise kept",
        summary.promise_kept is True,
        f"promise_kept: {summary.promise_kept}",
    )

    # Test 3: Tracks commitment
    aggregator = CallSummaryAggregator(user_id="test-user")
    aggregator.start()
    aggregator.add_commitment(
        CommitmentIdentified(
            commitment_text="I'll do it at 7am",
            action="do it",
            time="7am",
            is_specific=True,
            confidence=0.9,
        )
    )
    summary = aggregator.finalize()
    results.add(
        "Tracks commitment",
        summary.tomorrow_commitment is not None and summary.commitment_is_specific,
        f"commitment: {summary.tomorrow_commitment}",
    )

    # Test 4: Tracks sentiment trajectory
    aggregator = CallSummaryAggregator(user_id="test-user")
    aggregator.start()
    aggregator.add_sentiment(
        SentimentAnalysis(sentiment="neutral", confidence=0.5, indicators=[])
    )
    aggregator.add_sentiment(
        SentimentAnalysis(sentiment="positive", confidence=0.8, indicators=[])
    )
    summary = aggregator.finalize()
    results.add(
        "Tracks sentiment trajectory",
        len(summary.sentiment_trajectory) == 2
        and summary.sentiment_trajectory == ["neutral", "positive"],
        f"trajectory: {summary.sentiment_trajectory}",
    )

    # Test 5: Quality score is reasonable
    aggregator = CallSummaryAggregator(user_id="test-user")
    aggregator.start()
    aggregator.add_promise(
        PromiseResponse(
            kept=True, response_text="yes", excuse_detected=None, confidence=0.9
        )
    )
    aggregator.add_sentiment(
        SentimentAnalysis(sentiment="positive", confidence=0.8, indicators=[])
    )
    aggregator.add_commitment(
        CommitmentIdentified(
            commitment_text="7am workout",
            action="workout",
            time="7am",
            is_specific=True,
            confidence=0.9,
        )
    )
    summary = aggregator.finalize()
    results.add(
        "Quality score is reasonable",
        0.7 <= summary.call_quality_score <= 1.0,
        f"quality_score: {summary.call_quality_score:.2f}",
    )

    # Test 6: Low quality score for bad call
    aggregator = CallSummaryAggregator(user_id="test-user")
    aggregator.start()
    aggregator.add_promise(
        PromiseResponse(
            kept=False, response_text="no", excuse_detected="too tired", confidence=0.9
        )
    )
    aggregator.add_sentiment(
        SentimentAnalysis(sentiment="frustrated", confidence=0.9, indicators=[])
    )
    aggregator.add_excuse(
        ExcuseDetected(
            excuse_text="too tired",
            matches_favorite=False,
            favorite_excuse=None,
            confidence=0.8,
        )
    )
    aggregator.add_excuse(
        ExcuseDetected(
            excuse_text="no time",
            matches_favorite=False,
            favorite_excuse=None,
            confidence=0.8,
        )
    )
    aggregator.add_excuse(
        ExcuseDetected(
            excuse_text="busy",
            matches_favorite=False,
            favorite_excuse=None,
            confidence=0.8,
        )
    )
    summary = aggregator.finalize()
    results.add(
        "Low quality score for bad call",
        summary.call_quality_score < 0.5,
        f"quality_score: {summary.call_quality_score:.2f}",
    )

    results.print_summary()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════


async def main():
    print("=" * 60)
    print("BACKGROUND AGENTS INTEGRATION TESTS (LLM-Powered)")
    print("=" * 60)
    print("\nUsing Groq GPT-OSS-120B for LLM calls...")

    all_results = []

    # Run all tests
    all_results.append(await test_excuse_detector())
    all_results.append(await test_sentiment_analyzer())
    all_results.append(await test_commitment_extractor())
    all_results.append(await test_promise_detector())
    all_results.append(await test_excuse_callout())
    all_results.append(await test_pattern_analyzer())
    all_results.append(await test_quote_extractor())
    all_results.append(await test_call_summary_aggregator())

    # Final summary
    total_passed = sum(r.passed for r in all_results)
    total_failed = sum(r.failed for r in all_results)

    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    print(f"  TOTAL PASSED: {total_passed}/{total_passed + total_failed}")
    print(f"  TOTAL FAILED: {total_failed}/{total_passed + total_failed}")
    print()
    if total_failed == 0:
        print("  ALL TESTS PASSED!")
    else:
        print(f"  {total_failed} TESTS FAILED")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
