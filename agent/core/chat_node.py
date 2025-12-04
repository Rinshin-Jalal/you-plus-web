"""
FutureYouNode - Voice-optimized ReasoningNode for YOU+ Future Self agent

Now with STAGE-BASED conversation flow:
- Each stage has a focused prompt
- Stage transitions based on user responses
- Prevents monologuing and text walls

Uses Groq GPT-OSS-120B for the main speaking agent.
"""

import os
import sys
import json
from pathlib import Path
from typing import AsyncGenerator, Optional, Union

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

import aiohttp
from loguru import logger

from line.events import AgentResponse, EndCall
from line.nodes.conversation_context import ConversationContext
from line.nodes.reasoning import ReasoningNode
from line.tools.system_tools import EndCallArgs, EndCallTool, end_call

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
from conversation.call_types import CallType
from conversation.mood import Mood
from conversation.stages import (
    CallStage,
    get_stage_prompt,
    get_next_stage,
    should_advance_stage,
    build_transition_check_prompt,
)
from core.llm import llm_analyze

# Persona system integration
try:
    from conversation.persona import PersonaController, Persona  # type: ignore
    from conversation.identity_questions import (  # type: ignore
        get_accountability_question,
        get_followup_question,
        get_identity_statement,
    )

    PERSONA_AVAILABLE = True
except ImportError:
    PersonaController = None  # type: ignore
    Persona = None  # type: ignore
    PERSONA_AVAILABLE = False
    logger.warning("Persona system not available")

# Groq configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "openai/gpt-oss-120b"  # Main speaking agent
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

DEFAULT_TEMPERATURE = 0.7
BACKEND_URL = os.getenv("BACKEND_URL", "https://youplus-backend.workers.dev")


class FutureYouNode(ReasoningNode):
    """
    Voice-optimized ReasoningNode for the Future Self accountability agent.

    Now with STAGE-BASED conversation flow:
    - Tracks current stage (hook → acknowledge → accountability → dig_deeper → peak → tomorrow_lock → close)
    - Each stage has focused prompts preventing monologuing
    - Transitions based on user responses and insights from background agents

    Uses Groq GPT-OSS-120B for fast, high-quality responses.
    """

    def __init__(
        self,
        system_prompt: str,
        user_id: str = "unknown",
        user_context: Optional[dict] = None,
        call_type: Optional[CallType] = None,
        mood: Optional[Mood] = None,
        call_memory: Optional[dict] = None,
        persona_controller=None,  # NEW: Persona system (PersonaController)
        temperature: float = DEFAULT_TEMPERATURE,
        max_context_length: int = 100,
        max_output_tokens: int = 150,  # SHORTER - forces concise responses
    ):
        super().__init__(
            system_prompt=system_prompt, max_context_length=max_context_length
        )

        self.temperature = temperature
        self.user_id = user_id
        self.user_context = user_context or {}
        self.call_type = call_type
        self.mood = mood
        self.call_memory = call_memory or {}
        self.max_output_tokens = max_output_tokens

        # Persona system integration
        self.persona_controller = persona_controller

        # Conversation history for Groq (OpenAI format)
        self.messages: list[dict] = [{"role": "system", "content": system_prompt}]

        # STAGE TRACKING - New state machine
        self.current_stage = CallStage.HOOK
        self.turns_in_stage = 0
        self.total_turns = 0

        # Call state tracking
        self.kept_promise: Optional[bool] = None
        self.tomorrow_commitment: Optional[str] = None
        self.commitment_is_specific: bool = False
        self.call_ended = False

        # Interruption support
        self.stop_generation_event = None

        # Insights from background agents (consumed each turn)
        self._pending_insights: list = []
        self._current_sentiment: Optional[str] = None
        self._excuse_detected: Optional[ExcuseDetected] = None
        self._frustration_level: Optional[str] = None

        # Memorable quotes collected during this call
        self._quotes_this_call: list = []

        # Emotional peaks detected during this call
        self._peaks_this_call: list = []

        logger.info(f"FutureYouNode initialized for user: {user_id}")
        logger.info(f"🎭 Starting stage: {self.current_stage.value}")
        logger.info(f"🤖 Using Groq model: {GROQ_MODEL}")
        if call_type:
            logger.info(f"📞 Call type: {call_type.name}")
        if mood:
            logger.info(f"🎭 Mood: {mood.name}")
        if persona_controller and PERSONA_AVAILABLE:
            primary = persona_controller.get_primary_persona()
            logger.info(f"🎭 Starting persona: {primary.value}")

    async def process_context(
        self, context: ConversationContext
    ) -> AsyncGenerator[Union[AgentResponse, EndCall], None]:
        """
        Process the conversation context with STAGE-BASED flow.

        Each stage has its own focused prompt injected to prevent monologuing.
        Uses Groq GPT-OSS-120B for responses.
        """
        if not context.events:
            logger.info("No messages to process")
            return

        if not GROQ_API_KEY:
            logger.error("GROQ_API_KEY not set!")
            yield AgentResponse(
                content="I'm having trouble connecting. Let's try again tomorrow."
            )
            return

        # Increment turn counters
        self.total_turns += 1
        self.turns_in_stage += 1

        # Get latest user message and add to conversation history
        user_message = context.get_latest_user_transcript_message()
        if user_message:
            logger.info(f'🧠 Processing: "{user_message}"')

            # Add user message to history
            self.messages.append({"role": "user", "content": user_message})

            # Detect YES/NO for promise tracking
            lower_msg = user_message.lower().strip()
            if any(
                word in lower_msg
                for word in [
                    "yes",
                    "yeah",
                    "yep",
                    "yup",
                    "did it",
                    "i did",
                    "completed",
                ]
            ):
                self.kept_promise = True
                logger.info("✅ Promise KEPT detected")
            elif any(
                word in lower_msg
                for word in ["no", "nope", "didn't", "nah", "not yet", "couldn't"]
            ):
                self.kept_promise = False
                logger.info("❌ Promise BROKEN detected")

        # Build stage-aware context
        stage_context = self._build_stage_context()
        insight_context = self._build_insight_context()

        # Combine stage instructions with insights as a system message injection
        combined_context = stage_context
        if insight_context:
            combined_context += "\n" + insight_context

        logger.info(
            f"💡 Stage: {self.current_stage.value} (turn {self.turns_in_stage})"
        )

        # Build messages for this request (include stage context as latest system injection)
        request_messages = self.messages.copy()
        if combined_context:
            request_messages.append({"role": "system", "content": combined_context})

        full_response = ""

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    GROQ_API_URL,
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": GROQ_MODEL,
                        "messages": request_messages,
                        "temperature": self.temperature,
                        "max_tokens": self.max_output_tokens,
                        "stream": True,
                    },
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as resp:
                    if resp.status != 200:
                        error = await resp.text()
                        logger.error(f"Groq API error {resp.status}: {error}")
                        yield AgentResponse(
                            content="I'm having trouble thinking right now. Let's try again."
                        )
                        return

                    # Stream the response
                    async for line in resp.content:
                        line = line.decode("utf-8").strip()
                        if not line or not line.startswith("data: "):
                            continue

                        data = line[6:]  # Remove "data: " prefix
                        if data == "[DONE]":
                            break

                        try:
                            chunk = json.loads(data)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                full_response += content
                                yield AgentResponse(content=content)
                        except json.JSONDecodeError:
                            continue

        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            yield AgentResponse(
                content="I'm having trouble connecting. Let's try again tomorrow."
            )
            return

        # Add assistant response to history
        if full_response:
            self.messages.append({"role": "assistant", "content": full_response})
            logger.info(
                f'🤖 Agent response: "{full_response}" ({len(full_response)} chars)'
            )

            # Check for end call indicators in response
            end_indicators = ["take care", "talk tomorrow", "goodbye", "bye for now"]
            if any(ind in full_response.lower() for ind in end_indicators):
                if self.current_stage == CallStage.CLOSE:
                    logger.info("🤖 Ending call (close stage + goodbye detected)")
                    self.call_ended = True
                    args = EndCallArgs(goodbye_message=full_response)
                    async for item in end_call(args):
                        yield item

            # Try to extract tomorrow's commitment from the response
            if "tomorrow" in full_response.lower() and "?" not in full_response:
                self.tomorrow_commitment = self._extract_commitment(full_response)

            # Use LLM to check if we should advance to next stage
            if user_message:
                await self._maybe_advance_stage_llm(user_message)

    def _extract_commitment(self, response: str) -> Optional[str]:
        """Try to extract a commitment from the agent's response."""
        # Simple extraction - look for patterns like "you'll do X tomorrow"
        # This could be enhanced with better parsing
        lower = response.lower()
        if "you'll" in lower or "you will" in lower:
            # Return the full response as the commitment context
            return response[:200]  # Limit length
        return None

    def add_insight(self, insight) -> None:
        """
        Receive insights from background agents.
        Called by the Bridge when background agents emit events.

        Insights are processed and stored to influence the next response.
        Also feeds events to PersonaController for dynamic persona blending.
        """
        logger.info(f"💡 Received insight: {type(insight).__name__}")

        if isinstance(insight, ExcuseDetected):
            self._excuse_detected = insight
            if insight.matches_favorite:
                logger.info(f"🎯 FAVORITE EXCUSE DETECTED: {insight.excuse_text}")
            self._pending_insights.append(
                f"[EXCUSE DETECTED: '{insight.excuse_text}' "
                f"{'(MATCHES THEIR FAVORITE EXCUSE!)' if insight.matches_favorite else ''}]"
            )
            # Feed to PersonaController for persona blending
            if self.persona_controller and PERSONA_AVAILABLE:
                self.persona_controller.update_from_insight(
                    "excuse_detected",
                    {
                        "excuse_text": insight.excuse_text,
                        "matches_favorite": insight.matches_favorite,
                    },
                )

        elif isinstance(insight, SentimentAnalysis):
            self._current_sentiment = insight.sentiment
            if insight.sentiment in ("frustrated", "defensive", "deflecting"):
                self._pending_insights.append(
                    f"[SENTIMENT: User seems {insight.sentiment}. "
                    f"Indicators: {', '.join(insight.indicators[:3])}]"
                )
            # Feed to PersonaController
            if self.persona_controller and PERSONA_AVAILABLE:
                energy = insight.indicators[0] if insight.indicators else "medium"
                self.persona_controller.update_from_insight(
                    "sentiment_analysis",
                    {"sentiment": insight.sentiment, "energy": energy},
                )

        elif isinstance(insight, CommitmentIdentified):
            if insight.is_specific:
                self.tomorrow_commitment = f"{insight.action} at {insight.time}"
                self.commitment_is_specific = (
                    True  # Mark as specific for stage advancement
                )
                self._pending_insights.append(
                    f"[COMMITMENT EXTRACTED: {insight.action} at {insight.time} - SPECIFIC!]"
                )
            elif insight.action:
                self.tomorrow_commitment = insight.action
                self._pending_insights.append(
                    f"[VAGUE COMMITMENT: {insight.action} (no specific time - push for details)]"
                )

        elif isinstance(insight, PromiseResponse):
            if insight.kept is not None:
                self.kept_promise = insight.kept
                logger.info(
                    f"{'✅' if insight.kept else '❌'} Promise kept: {insight.kept}"
                )
            # Feed to PersonaController - this is a major signal
            if self.persona_controller and PERSONA_AVAILABLE:
                self.persona_controller.update_from_insight(
                    "promise_response",
                    {"kept": insight.kept},
                )

        elif isinstance(insight, UserFrustrated):
            self._frustration_level = insight.frustration_level
            self._pending_insights.append(
                f"[USER FRUSTRATED ({insight.frustration_level}): {insight.suggested_action}]"
            )

        elif isinstance(insight, PatternAlert):
            self._pending_insights.append(
                f"[PATTERN ALERT: {insight.pattern_type} - {insight.description}]"
            )
            if insight.historical_context:
                self._pending_insights.append(
                    f"[HISTORY: {insight.historical_context}]"
                )
            # Feed to PersonaController
            if self.persona_controller and PERSONA_AVAILABLE:
                self.persona_controller.update_from_insight(
                    "pattern_alert",
                    {"pattern_type": insight.pattern_type},
                )

        elif isinstance(insight, MemorableQuoteDetected):
            # Store the quote for later saving to call_memory
            current_streak = self.user_context.get("identity_status", {}).get(
                "current_streak_days", 0
            )
            self._quotes_this_call.append(
                {
                    "text": insight.quote_text,
                    "context": insight.context,
                    "day": current_streak,
                    "emotional_weight": insight.emotional_weight,
                }
            )
            logger.info(
                f"💎 Stored memorable quote ({insight.context}): "
                f'"{insight.quote_text[:50]}..."'
            )

        elif isinstance(insight, ExcuseCallout):
            # Pre-crafted callout suggestion from ExcuseCalloutNode
            self._pending_insights.append(
                f"[EXCUSE CALLOUT ({insight.callout_type}): "
                f"Consider saying: '{insight.suggested_response}']"
            )
            logger.info(
                f"🎯 Excuse callout suggestion ({insight.callout_type}): "
                f"{insight.suggested_response[:50]}..."
            )

    def _build_insight_context(self) -> str:
        """
        Build a context string from pending insights to inject into the conversation.
        Clears the pending insights after building.
        """
        if not self._pending_insights:
            return ""

        insight_text = "\n".join(self._pending_insights)
        self._pending_insights = []  # Clear after consumption

        return (
            "\n\n[BACKGROUND AGENT INSIGHTS - Use these to inform your response, "
            "but do NOT read them verbatim to the user:]\n"
            f"{insight_text}\n\n"
        )

    def _build_stage_context(self) -> str:
        """
        Build stage-specific instructions to inject into the conversation.
        NOTE: Stage advancement is now handled by _maybe_advance_stage_llm() in process_context.
        """
        # Get the focused prompt for current stage
        stage_prompt = get_stage_prompt(self.current_stage)

        # Add context about what we know
        context_parts = [
            f"\n\n[CURRENT STAGE: {self.current_stage.value.upper()}]",
            stage_prompt,
        ]

        # Add persona context if available
        if self.persona_controller and PERSONA_AVAILABLE:
            persona_prompt = self.persona_controller.get_persona_prompt()
            context_parts.append(f"\n{persona_prompt}")

        # Add state info for relevant stages
        if self.current_stage == CallStage.DIG_DEEPER:
            if self.kept_promise is True:
                context_parts.append(
                    "\n[STATE: User said YES - they kept their promise]"
                )
            elif self.kept_promise is False:
                context_parts.append(
                    "\n[STATE: User said NO - they broke their promise]"
                )

        if self.current_stage == CallStage.TOMORROW_LOCK:
            if self.tomorrow_commitment and self.commitment_is_specific:
                context_parts.append(
                    f"\n[STATE: Got commitment: {self.tomorrow_commitment}. "
                    "Confirm and move to close.]"
                )
            else:
                context_parts.append(
                    "\n[STATE: Need SPECIFIC commitment (action + time). "
                    "Push for details if vague.]"
                )

        if self.current_stage == CallStage.CLOSE:
            context_parts.append(
                "\n[STATE: Deliver closing line, then END THE CALL. "
                "Use the EndCall tool after your message.]"
            )

        return "\n".join(context_parts)

    async def _maybe_advance_stage_llm(self, user_message: str) -> None:
        """
        Use LLM to decide if we should advance to the next stage.
        Falls back to rule-based if LLM fails.
        """
        # Don't advance on first turn of a stage (let it play out)
        if self.turns_in_stage < 1:
            return

        # Get next stage
        next_stage = get_next_stage(self.current_stage)
        if not next_stage:
            return  # No next stage to advance to

        # Build transition check prompt
        recent_messages = [
            {"role": "assistant", "parts": [{"text": m["content"]}]}
            if m["role"] == "assistant"
            else {"role": "user", "parts": [{"text": m["content"]}]}
            for m in self.messages[-4:]  # Last 4 messages
        ]
        transition_prompt = build_transition_check_prompt(
            self.current_stage, recent_messages
        )

        if not transition_prompt:
            # Fallback to rule-based
            self._maybe_advance_stage()
            return

        try:
            # Ask LLM if we should advance
            response = await llm_analyze(
                prompt=transition_prompt,
                temperature=0.0,
                max_tokens=10,
            )

            if response and "YES" in response.upper():
                old_stage = self.current_stage.value
                self.current_stage = next_stage
                self.turns_in_stage = 0
                logger.info(
                    f"🔄 LLM stage transition: {old_stage} → {next_stage.value}"
                )
            else:
                logger.debug(f"🔄 LLM says stay in {self.current_stage.value}")
        except Exception as e:
            logger.warning(f"LLM stage check failed, using rules: {e}")
            self._maybe_advance_stage()

    def _maybe_advance_stage(self) -> None:
        """
        Check if we should advance to the next stage based on:
        - Turn count in current stage
        - State changes (promise answered, commitment locked)
        """
        # Don't advance on first turn of a stage (let it play out)
        if self.turns_in_stage < 1:
            return

        # Check advancement conditions
        advance = should_advance_stage(
            current_stage=self.current_stage,
            turns_in_stage=self.turns_in_stage,
            promise_answered=self.kept_promise is not None,
            commitment_locked=self.commitment_is_specific,
        )

        if advance:
            next_stage = get_next_stage(self.current_stage)
            if next_stage:
                old_stage = self.current_stage.value
                self.current_stage = next_stage
                self.turns_in_stage = 0  # Reset turn counter for new stage
                logger.info(f"🔄 Stage transition: {old_stage} → {next_stage.value}")
            else:
                # No next stage means call should end
                logger.info("🏁 Reached end of call flow")

    async def report_call_result(self):
        """Report the call result to the backend."""
        if self.user_id == "unknown":
            logger.warning("Cannot report call result - unknown user_id")
            return

        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "user_id": self.user_id,
                    "kept_promise": self.kept_promise,
                    "call_type": "accountability_checkin",
                }

                if self.tomorrow_commitment:
                    payload["tomorrow_commitment"] = self.tomorrow_commitment

                async with session.post(
                    f"{BACKEND_URL}/api/calls/report",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        logger.info(f"✅ Call result reported for user {self.user_id}")
                    else:
                        logger.warning(f"⚠️ Failed to report call result: {resp.status}")

        except Exception as e:
            logger.error(f"💥 Error reporting call result: {e}")

    def get_updated_call_memory(self) -> dict:
        """
        Return updated call_memory with quotes and peaks from this call.
        Called by main.py after the call ends to save to database.
        """
        updated = dict(self.call_memory)

        # Add new quotes (keep last 20)
        existing_quotes = updated.get("memorable_quotes", [])
        all_quotes = existing_quotes + self._quotes_this_call
        updated["memorable_quotes"] = all_quotes[-20:]

        # Add emotional peaks (keep last 10)
        existing_peaks = updated.get("emotional_peaks", [])
        all_peaks = existing_peaks + self._peaks_this_call
        updated["emotional_peaks"] = all_peaks[-10:]

        # Update narrative arc based on streak
        current_streak = self.user_context.get("identity_status", {}).get(
            "current_streak_days", 0
        )
        if current_streak >= 60:
            updated["narrative_arc"] = "mastery"
        elif current_streak >= 30:
            updated["narrative_arc"] = "transformation"
        elif current_streak >= 14:
            updated["narrative_arc"] = "building_momentum"
        elif current_streak >= 7:
            updated["narrative_arc"] = "proving_ground"
        else:
            updated["narrative_arc"] = "early_struggle"

        return updated
