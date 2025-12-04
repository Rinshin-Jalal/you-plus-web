"""
YOU+ Future Self Agent - Cartesia Line SDK
============================================

A voice-first accountability agent that calls users as their "Future Self".
Uses Cartesia Line SDK for real phone calls with voice cloning.

Multi-Agent Architecture:
- FutureYouNode: Main speaking agent (talks to user) - Uses Groq GPT-OSS-120B
- ExcuseDetectorNode: Background agent (detects excuses) - Uses Groq GPT-OSS-Safeguard-20B
- SentimentAnalyzerNode: Background agent (tracks sentiment) - Uses Groq GPT-OSS-Safeguard-20B
- CommitmentExtractorNode: Background agent (extracts tomorrow's commitment)
- PromiseDetectorNode: Background agent (detects yes/no to "did you do it?")
- PatternAnalyzerNode: Background agent (alerts on quit patterns)

DEPLOYMENT:
  cartesia auth login
  cartesia deploy

TESTING:
  cartesia call +1XXXXXXXXXX --metadata '{"user_id": "uuid"}'
"""

import os
import sys
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from dotenv import load_dotenv

load_dotenv()

from core.chat_node import FutureYouNode
from core.config import (
    build_system_prompt_v2,
    build_first_message,
    fetch_user_context,
    fetch_call_memory,
    upsert_call_memory,
    get_yesterday_promise_status,
    save_call_analytics,
    save_excuse_pattern,
    fetch_excuse_patterns,
)
from services.supermemory import supermemory_service
from conversation.call_types import select_call_type, CallType
from conversation.mood import select_mood, Mood
from agents.background_agents import (
    ExcuseDetectorNode,
    ExcuseCalloutNode,
    SentimentAnalyzerNode,
    CommitmentExtractorNode,
    PromiseDetectorNode,
    PatternAnalyzerNode,
    QuoteExtractorNode,
    CallSummaryAggregator,
)
from agents.events import (
    ExcuseDetected,
    ExcuseCallout,
    SentimentAnalysis,
    CommitmentIdentified,
    PromiseResponse,
    UserFrustrated,
    PatternAlert,
    MemorableQuoteDetected,
)
from loguru import logger

from line import Bridge, CallRequest, PreCallResult, VoiceAgentApp, VoiceAgentSystem
from line.events import (
    UserStartedSpeaking,
    UserStoppedSpeaking,
    UserTranscriptionReceived,
)

# Default voice (fallback if user has no clone)
DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091"


async def handle_call_request(call_request: CallRequest):
    """Pre-call handler: validate user, fetch context, select call type/mood, configure TTS."""
    logger.info(f"Handling call request: {call_request}")

    metadata = call_request.metadata or {}
    user_id = metadata.get("user_id")

    # === CALL REJECTION LOGIC ===

    # Reject if no user_id provided
    if not user_id or user_id == "unknown":
        logger.warning("Rejecting call: no user_id provided")
        return None

    # Fetch user's context from database
    user_context = await fetch_user_context(user_id)
    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})

    # Reject if user doesn't exist
    if not identity:
        logger.warning(f"Rejecting call: user {user_id} not found")
        return None

    # Reject if subscription expired
    subscription_status = identity_status.get("subscription_status")
    if subscription_status == "expired":
        logger.warning(f"Rejecting call: user {user_id} subscription expired")
        return None

    # Reject if user paused calls
    if identity_status.get("calls_paused"):
        logger.warning(f"Rejecting call: user {user_id} has paused calls")
        return None

    # === FETCH CALL MEMORY ===
    call_memory = await fetch_call_memory(user_id)

    # === FETCH EXCUSE PATTERNS ===
    excuse_data = await fetch_excuse_patterns(user_id)

    # === DETERMINE YESTERDAY'S PROMISE STATUS ===
    call_history = user_context.get("call_history", [])
    yesterday_promise_kept = get_yesterday_promise_status(call_history)

    # === SELECT CALL TYPE ===
    current_streak = identity_status.get("current_streak_days", 0)
    call_type = select_call_type(
        user_context=user_context,
        call_memory=call_memory,
        current_streak=current_streak,
    )
    logger.info(f"📞 Selected call type: {call_type.name} ({call_type.energy})")

    # === SELECT MOOD ===
    mood = select_mood(
        user_context=user_context,
        call_memory=call_memory,
        call_type=call_type.name,
        kept_promise_yesterday=yesterday_promise_kept,
    )
    logger.info(f"🎭 Selected mood: {mood.name}")

    # === CONFIGURE CALL ===

    # Get user's cloned voice ID
    voice_id = identity.get("cartesia_voice_id") or DEFAULT_VOICE_ID

    # Get user's preferred language (default to English)
    # Cartesia supports: en, es, fr, de, it, pt, pl, zh, ja, hi, ko
    preferred_language = identity.get("preferred_language", "en")

    # Build experimental voice controls based on mood
    # See: https://docs.cartesia.ai/line/agent-patterns/experimental-emotion
    experimental_controls = {
        "speed": _get_speed_control(mood.speed_ratio),
        "emotion": _get_emotion_controls(mood.emotion_tag),
    }

    logger.info(
        f"Pre-call approved for user {user_id}, voice: {voice_id}, "
        f"language: {preferred_language}, controls: {experimental_controls}"
    )

    # Return PreCallResult with voice config, user_context, call_memory, and selections
    return PreCallResult(
        metadata={
            "user_id": user_id,
            "user_context": user_context,
            "call_memory": call_memory,
            "excuse_data": excuse_data,  # Historical excuse patterns for callouts
            "call_type": call_type.name,  # Serialize to string for metadata
            "mood": mood.name,  # Serialize to string for metadata
            "yesterday_promise_kept": yesterday_promise_kept,
        },
        config={
            "tts": {
                "voice": voice_id,
                "language": preferred_language,
                "__experimental_controls": experimental_controls,
            }
        },
    )


def _get_speed_control(speed_ratio: float) -> str:
    """Map speed_ratio to Cartesia speed control string."""
    if speed_ratio <= 0.8:
        return "slowest"
    elif speed_ratio <= 0.9:
        return "slow"
    elif speed_ratio <= 1.05:
        return "normal"
    elif speed_ratio <= 1.15:
        return "fast"
    else:
        return "fastest"


def _get_emotion_controls(emotion_tag: str) -> list[str]:
    """
    Map emotion_tag to Cartesia emotion controls.

    Cartesia supports: positivity, negativity, anger, sadness, curiosity
    Each with :lowest, :low, :normal, :high, :highest
    """
    # Map our mood emotion tags to Cartesia controls
    EMOTION_MAP = {
        "neutral": [],  # No specific emotion
        "contemplative": ["curiosity:low"],
        "excited": ["positivity:high"],
        "content": ["positivity:low"],
        "sad": ["sadness:high", "positivity:lowest"],
        "proud": ["positivity:high"],
    }
    return EMOTION_MAP.get(emotion_tag, [])


async def handle_new_call(system: VoiceAgentSystem, call_request: CallRequest):
    """Handle an incoming call and set up the multi-agent Future Self system."""
    metadata = call_request.metadata or {}
    user_id = metadata.get("user_id", "unknown")
    user_context = metadata.get("user_context", {})
    call_memory = metadata.get("call_memory", {})
    excuse_data = metadata.get("excuse_data", {})  # Historical excuse patterns
    call_type_name = metadata.get("call_type", "audit")
    mood_name = metadata.get("mood", "warm_direct")
    yesterday_promise_kept = metadata.get("yesterday_promise_kept")

    # Reconstruct CallType and Mood from names
    from conversation.call_types import CALL_TYPES
    from conversation.mood import MOODS

    call_type = CALL_TYPES.get(call_type_name, CALL_TYPES["audit"])
    mood = MOODS.get(mood_name, MOODS["warm_direct"])

    # Get current streak for excuse saving later
    identity_status = user_context.get("identity_status", {})
    current_streak = identity_status.get("current_streak_days", 0)

    logger.info(f"Incoming call for user: {user_id}")
    logger.info(f"📞 Call type: {call_type.name} | 🎭 Mood: {mood.name}")
    if excuse_data.get("patterns"):
        logger.info(
            f"🎯 Loaded {len(excuse_data['patterns'])} excuse patterns for callouts"
        )
    logger.info("Setting up multi-agent system...")

    # Build personalized system prompt with call type, mood, memory, and excuse patterns
    system_prompt = await build_system_prompt_v2(
        user_id=user_id,
        user_context=user_context,
        call_type=call_type,
        mood=mood,
        call_memory=call_memory,
        excuse_data=excuse_data,  # Include excuse patterns for callouts
    )

    # =========================================================================
    # MAIN SPEAKING AGENT - FutureYouNode (uses Groq GPT-OSS-120B)
    # =========================================================================
    conversation_node = FutureYouNode(
        system_prompt=system_prompt,
        user_id=user_id,
        user_context=user_context,
        call_type=call_type,
        mood=mood,
        call_memory=call_memory,
    )
    conversation_bridge = Bridge(conversation_node)

    # Register as the SPEAKING node (only this one talks to user)
    system.with_speaking_node(conversation_node, conversation_bridge)

    # =========================================================================
    # BACKGROUND AGENTS - Process in parallel, emit insights
    # =========================================================================

    # Excuse Detector
    excuse_node = ExcuseDetectorNode(user_context=user_context)
    excuse_bridge = Bridge(excuse_node)
    system.with_node(excuse_node, excuse_bridge)

    # Excuse Callout Generator (chains with ExcuseDetector)
    excuse_callout_node = ExcuseCalloutNode(user_context=user_context)
    excuse_callout_bridge = Bridge(excuse_callout_node)
    system.with_node(excuse_callout_node, excuse_callout_bridge)

    # Sentiment Analyzer
    sentiment_node = SentimentAnalyzerNode()
    sentiment_bridge = Bridge(sentiment_node)
    system.with_node(sentiment_node, sentiment_bridge)

    # Commitment Extractor
    commitment_node = CommitmentExtractorNode()
    commitment_bridge = Bridge(commitment_node)
    system.with_node(commitment_node, commitment_bridge)

    # Promise Detector (yes/no to "did you do it?" with excuse linking)
    promise_node = PromiseDetectorNode(user_context=user_context)
    promise_bridge = Bridge(promise_node)
    system.with_node(promise_node, promise_bridge)

    # Pattern Analyzer (quit pattern alerts)
    pattern_node = PatternAnalyzerNode(user_context=user_context)
    pattern_bridge = Bridge(pattern_node)
    system.with_node(pattern_node, pattern_bridge)

    # Quote Extractor (memorable quotes for callbacks)
    quote_node = QuoteExtractorNode()
    quote_bridge = Bridge(quote_node)
    system.with_node(quote_node, quote_bridge)

    # =========================================================================
    # CALL SUMMARY AGGREGATOR - Collects all events for end-of-call analytics
    # =========================================================================

    call_aggregator = CallSummaryAggregator(
        user_id=user_id,
        call_type=call_type.name,
        mood=mood.name,
    )
    call_aggregator.start()

    # =========================================================================
    # EVENT ROUTING - User input goes to ALL agents
    # =========================================================================

    # Main agent receives transcriptions
    conversation_bridge.on(UserTranscriptionReceived).map(conversation_node.add_event)

    # Background agents also receive transcriptions (parallel processing)
    excuse_bridge.on(UserTranscriptionReceived).map(excuse_node.add_event)
    sentiment_bridge.on(UserTranscriptionReceived).map(sentiment_node.add_event)
    commitment_bridge.on(UserTranscriptionReceived).map(commitment_node.add_event)
    promise_bridge.on(UserTranscriptionReceived).map(promise_node.add_event)
    pattern_bridge.on(UserTranscriptionReceived).map(pattern_node.add_event)
    quote_bridge.on(UserTranscriptionReceived).map(quote_node.add_event)

    # =========================================================================
    # BACKGROUND AGENT PROCESSING - Emit insights when user stops speaking
    # =========================================================================

    # Excuse detection runs in background
    (excuse_bridge.on(UserStoppedSpeaking).stream(excuse_node.generate).broadcast())

    # Sentiment analysis runs in background
    (
        sentiment_bridge.on(UserStoppedSpeaking)
        .stream(sentiment_node.generate)
        .broadcast()
    )

    # Commitment extraction runs in background
    (
        commitment_bridge.on(UserStoppedSpeaking)
        .stream(commitment_node.generate)
        .broadcast()
    )

    # Promise detection runs in background
    (promise_bridge.on(UserStoppedSpeaking).stream(promise_node.generate).broadcast())

    # Pattern analysis runs in background
    (pattern_bridge.on(UserStoppedSpeaking).stream(pattern_node.generate).broadcast())

    # Quote extraction runs in background
    (quote_bridge.on(UserStoppedSpeaking).stream(quote_node.generate).broadcast())

    # =========================================================================
    # MAIN AGENT RECEIVES INSIGHTS FROM BACKGROUND AGENTS
    # =========================================================================

    # Main agent receives excuse detections
    conversation_bridge.on(ExcuseDetected).map(conversation_node.add_insight)

    # Main agent receives sentiment analysis
    conversation_bridge.on(SentimentAnalysis).map(conversation_node.add_insight)

    # Main agent receives commitment identifications
    conversation_bridge.on(CommitmentIdentified).map(conversation_node.add_insight)

    # Main agent receives promise responses
    conversation_bridge.on(PromiseResponse).map(conversation_node.add_insight)

    # Main agent receives frustration alerts
    conversation_bridge.on(UserFrustrated).map(conversation_node.add_insight)

    # Main agent receives pattern alerts
    conversation_bridge.on(PatternAlert).map(conversation_node.add_insight)

    # Main agent receives memorable quote detections
    conversation_bridge.on(MemorableQuoteDetected).map(conversation_node.add_insight)

    # Main agent receives excuse callouts (suggested responses)
    conversation_bridge.on(ExcuseCallout).map(conversation_node.add_insight)

    # =========================================================================
    # EVENT CHAINING - ExcuseDetected triggers ExcuseCallout
    # =========================================================================

    # When excuse detected, generate a callout suggestion
    excuse_callout_bridge.on(ExcuseDetected).map(
        excuse_callout_node.receive_excuse
    ).filter(lambda x: x is not None).broadcast()

    # =========================================================================
    # AGGREGATOR FEEDS - Collect events for CallSummary
    # =========================================================================

    # Feed aggregator with all insight events for end-of-call analytics
    conversation_bridge.on(SentimentAnalysis).map(call_aggregator.add_sentiment)
    conversation_bridge.on(ExcuseDetected).map(call_aggregator.add_excuse)
    conversation_bridge.on(PromiseResponse).map(call_aggregator.add_promise)
    conversation_bridge.on(CommitmentIdentified).map(call_aggregator.add_commitment)
    conversation_bridge.on(MemorableQuoteDetected).map(call_aggregator.add_quote)
    conversation_bridge.on(PatternAlert).map(call_aggregator.add_pattern)

    # =========================================================================
    # MAIN AGENT RESPONSE - Only speaking agent responds to user
    # =========================================================================

    (
        conversation_bridge.on(UserStoppedSpeaking)
        .interrupt_on(
            UserStartedSpeaking, handler=conversation_node.on_interrupt_generate
        )
        .stream(conversation_node.generate)
        .broadcast()
    )

    # =========================================================================
    # START THE CALL
    # =========================================================================

    await system.start()
    logger.info("Multi-agent system started: 1 speaking + 7 background agents")

    # Send the personalized first message with mood and call type
    first_message = build_first_message(
        user_context=user_context,
        mood=mood,
        call_type=call_type,
    )
    await system.send_initial_message(first_message)

    await system.wait_for_shutdown()

    # =========================================================================
    # END OF CALL - Finalize analytics and persist data
    # =========================================================================

    # Generate call summary with all aggregated data
    call_summary = call_aggregator.finalize()
    logger.info(
        f"📊 Call Summary: quality={call_summary.call_quality_score:.0%}, "
        f"promise_kept={call_summary.promise_kept}, "
        f"commitment={'specific' if call_summary.commitment_is_specific else 'vague' if call_summary.tomorrow_commitment else 'none'}"
    )

    # Report call result and update call memory
    await conversation_node.report_call_result()

    # Update call memory with this call's data
    updated_memory = conversation_node.get_updated_call_memory()
    updated_memory["last_call_type"] = call_type.name
    updated_memory["last_mood"] = mood.name
    updated_memory["last_call_quality"] = call_summary.call_quality_score

    # Store commitment for tomorrow's callback
    if call_summary.tomorrow_commitment:
        updated_memory["last_commitment"] = call_summary.tomorrow_commitment
        updated_memory["last_commitment_time"] = call_summary.commitment_time
        updated_memory["last_commitment_specific"] = call_summary.commitment_is_specific

    # Append to call type history (keep last 10)
    call_type_history = call_memory.get("call_type_history", [])
    call_type_history.append(call_type.name)
    updated_memory["call_type_history"] = call_type_history[-10:]

    await upsert_call_memory(user_id, updated_memory)

    # Save call analytics for insights and tracking
    await save_call_analytics(call_summary)

    # =========================================================================
    # SAVE EXCUSE PATTERNS - For future callouts
    # =========================================================================
    # Save each detected excuse to build pattern history
    if call_aggregator.excuses:
        logger.info(f"💾 Saving {len(call_aggregator.excuses)} excuse patterns...")
        for excuse_event in call_aggregator.excuses:
            # Check if it matches their favorite excuse from onboarding
            identity = user_context.get("identity", {})
            onboarding = identity.get("onboarding_context", {})
            favorite_excuse = onboarding.get("favorite_excuse", "")
            matches_favorite = (
                favorite_excuse.lower() in excuse_event.excuse_text.lower()
                if favorite_excuse
                else False
            )

            await save_excuse_pattern(
                user_id=user_id,
                excuse_text=excuse_event.excuse_text,
                matches_favorite=matches_favorite,
                confidence=excuse_event.confidence,
                streak_day=current_streak,
                call_type=call_type.name,
            )

    # =========================================================================
    # SAVE CALL TRANSCRIPT TO SUPERMEMORY - For profile evolution
    # =========================================================================
    # Send transcript and outcomes to Supermemory so the user's profile evolves
    if supermemory_service.enabled:
        logger.info("📝 Sending call transcript to Supermemory...")

        # Build transcript from conversation_node messages (skip system messages)
        transcript = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in conversation_node.messages
            if msg["role"] in ("user", "assistant")
        ]

        # Calculate call number (current streak is a proxy, or use call history)
        call_history = user_context.get("call_history", [])
        call_number = len(call_history) + 1

        # Build outcomes from call_summary
        outcomes = {
            "promise_kept": call_summary.promise_kept,
            "tomorrow_commitment": call_summary.tomorrow_commitment,
            "commitment_time": call_summary.commitment_time,
            "commitment_specific": call_summary.commitment_is_specific,
            "excuses": call_summary.excuses_detected,
            "key_quote": call_summary.quotes_captured[0]
            if call_summary.quotes_captured
            else "",
            "emotional_peak": call_summary.sentiment_trajectory[-1]
            if call_summary.sentiment_trajectory
            else "neutral",
            "call_quality_score": call_summary.call_quality_score,
        }

        success = await supermemory_service.add_call_transcript(
            user_id=user_id,
            call_number=call_number,
            streak_day=current_streak,
            call_type=call_type.name,
            mood=mood.name,
            transcript=transcript,
            outcomes=outcomes,
        )

        if success:
            logger.info(
                f"✅ Call #{call_number} saved to Supermemory - profile will evolve"
            )
        else:
            logger.warning("⚠️ Failed to save call transcript to Supermemory")


app = VoiceAgentApp(call_handler=handle_new_call, pre_call_handler=handle_call_request)

if __name__ == "__main__":
    logger.info("Starting Future Self Agent (Multi-Agent Mode)...")
    logger.info(
        "Agents: FutureYou (speaking) + Excuse, ExcuseCallout, Sentiment, Commitment, Promise, Pattern, Quote (background)"
    )
    app.run()
