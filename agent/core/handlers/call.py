"""
Call Handler
=============

Main call handler that sets up the multi-agent Future Self system.
"""

import sys
from pathlib import Path

AGENT_DIR = Path(__file__).parent.parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from loguru import logger

from line import Bridge, CallRequest, VoiceAgentSystem
from line.events import (
    UserStartedSpeaking,
    UserStoppedSpeaking,
    UserTranscriptionReceived,
)

from core.chat_node import FutureYouNode
from core.config import (
    build_system_prompt_v2,
    build_system_prompt_v3,
    build_first_message,
)
from core.handlers.post_call import handle_call_end

# Persona system integration
try:
    from conversation.persona import PersonaController
    from services.trust_score import trust_score_service

    PERSONA_AVAILABLE = True
except ImportError:
    PersonaController = None
    trust_score_service = None
    PERSONA_AVAILABLE = False

from agents.detectors import (
    ExcuseDetectorNode,
    SentimentAnalyzerNode,
    PromiseDetectorNode,
    QuoteExtractorNode,
)
from agents.analyzers import (
    CommitmentExtractorNode,
    ExcuseCalloutNode,
    PatternAnalyzerNode,
)
from agents.aggregator import CallSummaryAggregator
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


async def handle_new_call(system: VoiceAgentSystem, call_request: CallRequest):
    """Handle an incoming call and set up the multi-agent Future Self system."""
    metadata = call_request.metadata or {}
    user_id = metadata.get("user_id", "unknown")
    user_context = metadata.get("user_context", {})
    call_memory = metadata.get("call_memory", {})
    excuse_data = metadata.get("excuse_data", {})
    call_type_name = metadata.get("call_type", "audit")
    mood_name = metadata.get("mood", "warm_direct")
    yesterday_promise_kept = metadata.get("yesterday_promise_kept")

    from conversation.call_types import CALL_TYPES
    from conversation.mood import MOODS

    call_type = CALL_TYPES.get(call_type_name, CALL_TYPES["audit"])
    mood = MOODS.get(mood_name, MOODS["warm_direct"])

    identity_status = user_context.get("identity_status", {})
    current_streak = identity_status.get("current_streak_days", 0)

    logger.info(f"Incoming call for user: {user_id}")
    logger.info(f"📞 Call type: {call_type.name} | 🎭 Mood: {mood.name}")

    # Initialize persona controller
    persona_controller = await _init_persona(
        user_id, user_context, call_memory, yesterday_promise_kept
    )

    # Build system prompt
    system_prompt = await _build_prompt(
        user_id,
        user_context,
        call_type,
        mood,
        call_memory,
        excuse_data,
        persona_controller,
    )

    # Create main speaking agent
    conversation_node = FutureYouNode(
        system_prompt=system_prompt,
        user_id=user_id,
        user_context=user_context,
        call_type=call_type,
        mood=mood,
        call_memory=call_memory,
        persona_controller=persona_controller,
    )
    conversation_bridge = Bridge(conversation_node)
    system.with_speaking_node(conversation_node, conversation_bridge)

    # Setup background agents
    agents = _setup_agents(system, user_context)

    # Setup aggregator
    call_aggregator = CallSummaryAggregator(user_id, call_type.name, mood.name)
    call_aggregator.start()

    # Setup event routing
    _setup_routing(conversation_node, conversation_bridge, agents, call_aggregator)

    # Start call
    await system.start()
    logger.info("Multi-agent system started")

    first_message = build_first_message(user_context, mood, call_type)
    await system.send_initial_message(first_message)
    await system.wait_for_shutdown()

    # End of call processing
    await handle_call_end(
        user_id,
        user_context,
        call_memory,
        call_type,
        mood,
        current_streak,
        conversation_node,
        call_aggregator,
        persona_controller,
    )


async def _init_persona(user_id, user_context, call_memory, yesterday_promise_kept):
    """Initialize PersonaController if available."""
    if not PERSONA_AVAILABLE or not PersonaController or not trust_score_service:
        return None

    trust_score = await trust_score_service.get_overall_trust(user_id)
    controller = PersonaController(trust_score, yesterday_promise_kept)
    controller.set_severity_level(call_memory.get("severity_level", 1))
    logger.info(f"🎭 Persona: {controller.get_primary_persona().value}")
    return controller


async def _build_prompt(
    user_id, user_context, call_type, mood, call_memory, excuse_data, persona_controller
):
    """Build personalized system prompt."""
    if persona_controller:
        return await build_system_prompt_v3(
            user_id,
            user_context,
            call_type,
            mood,
            call_memory,
            excuse_data,
            persona_controller,
        )
    return await build_system_prompt_v2(
        user_id, user_context, call_type, mood, call_memory, excuse_data
    )


def _setup_agents(system: VoiceAgentSystem, user_context: dict) -> dict:
    """Set up background agents."""
    agents = {}

    agents["excuse"] = ExcuseDetectorNode(user_context)
    agents["excuse_bridge"] = Bridge(agents["excuse"])
    system.with_node(agents["excuse"], agents["excuse_bridge"])

    agents["excuse_callout"] = ExcuseCalloutNode(user_context)
    agents["excuse_callout_bridge"] = Bridge(agents["excuse_callout"])
    system.with_node(agents["excuse_callout"], agents["excuse_callout_bridge"])

    agents["sentiment"] = SentimentAnalyzerNode()
    agents["sentiment_bridge"] = Bridge(agents["sentiment"])
    system.with_node(agents["sentiment"], agents["sentiment_bridge"])

    agents["commitment"] = CommitmentExtractorNode()
    agents["commitment_bridge"] = Bridge(agents["commitment"])
    system.with_node(agents["commitment"], agents["commitment_bridge"])

    agents["promise"] = PromiseDetectorNode(user_context)
    agents["promise_bridge"] = Bridge(agents["promise"])
    system.with_node(agents["promise"], agents["promise_bridge"])

    agents["pattern"] = PatternAnalyzerNode(user_context)
    agents["pattern_bridge"] = Bridge(agents["pattern"])
    system.with_node(agents["pattern"], agents["pattern_bridge"])

    agents["quote"] = QuoteExtractorNode()
    agents["quote_bridge"] = Bridge(agents["quote"])
    system.with_node(agents["quote"], agents["quote_bridge"])

    return agents


def _setup_routing(conversation_node, conversation_bridge, agents, call_aggregator):
    """Set up event routing between agents."""
    # Main agent receives transcriptions
    conversation_bridge.on(UserTranscriptionReceived).map(conversation_node.add_event)

    # Background agents receive transcriptions
    for name in ["excuse", "sentiment", "commitment", "promise", "pattern", "quote"]:
        agents[f"{name}_bridge"].on(UserTranscriptionReceived).map(
            agents[name].add_event
        )
        agents[f"{name}_bridge"].on(UserStoppedSpeaking).stream(
            agents[name].generate
        ).broadcast()

    # Main agent receives insights
    for event in [
        ExcuseDetected,
        SentimentAnalysis,
        CommitmentIdentified,
        PromiseResponse,
        UserFrustrated,
        PatternAlert,
        MemorableQuoteDetected,
        ExcuseCallout,
    ]:
        conversation_bridge.on(event).map(conversation_node.add_insight)

    # Excuse chaining
    agents["excuse_callout_bridge"].on(ExcuseDetected).map(
        agents["excuse_callout"].receive_excuse
    ).filter(lambda x: x is not None).broadcast()

    # Aggregator feeds
    conversation_bridge.on(SentimentAnalysis).map(call_aggregator.add_sentiment)
    conversation_bridge.on(ExcuseDetected).map(call_aggregator.add_excuse)
    conversation_bridge.on(PromiseResponse).map(call_aggregator.add_promise)
    conversation_bridge.on(CommitmentIdentified).map(call_aggregator.add_commitment)
    conversation_bridge.on(MemorableQuoteDetected).map(call_aggregator.add_quote)
    conversation_bridge.on(PatternAlert).map(call_aggregator.add_pattern)

    # Main response
    (
        conversation_bridge.on(UserStoppedSpeaking)
        .interrupt_on(
            UserStartedSpeaking, handler=conversation_node.on_interrupt_generate
        )
        .stream(conversation_node.generate)
        .broadcast()
    )


__all__ = ["handle_new_call"]
