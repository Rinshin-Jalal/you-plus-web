"""
Automated Scenario Testing for Future Self Agent
=================================================

Tests 10 realistic user scenarios to evaluate agent behavior.
Each scenario has:
- A persona (who is the user)
- Scripted responses (what they say)
- Expected behaviors (what the agent should do)
- Scoring criteria (how to evaluate)

Usage:
    cd agent
    uv run python test_scenarios.py
    uv run python test_scenarios.py --scenario 3  # Run specific scenario
    uv run python test_scenarios.py --llm gemini  # Use specific LLM
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from dotenv import load_dotenv

load_dotenv()

from core.config import (
    fetch_user_context,
    build_system_prompt,
    build_first_message,
)
from conversation.call_types import select_call_type, CALL_TYPES
from conversation.mood import select_mood, MOODS
from conversation.stages import (
    CallStage,
    get_stage_prompt,
    get_stage_prompt_with_mood,
    get_stage_max_turns,
    get_next_stage,
    should_advance_stage,
    build_transition_check_prompt,
)

# Background Agents
from agents.detectors import (
    ExcuseDetectorNode,
    SentimentAnalyzerNode,
    PromiseDetectorNode,
    QuoteExtractorNode,
)
from agents.analyzers import CommitmentExtractorNode
from agents.aggregator import CallSummaryAggregator
from agents.events import (
    ExcuseDetected,
    SentimentAnalysis,
    CommitmentIdentified,
    PromiseResponse,
    MemorableQuoteDetected,
    CallSummary,
    UserFrustrated,
)

# ============================================================================
# TEST USER ID
# ============================================================================
TEST_USER_ID = "8f6221f8-8a88-4585-870c-9520ee2ed9e5"


# ============================================================================
# SCENARIO DEFINITIONS
# ============================================================================


@dataclass
class Scenario:
    """A test scenario with user responses and expected behaviors."""

    id: int
    name: str
    description: str
    persona: str
    responses: list[str]  # What the user says at each turn
    expected_behaviors: list[str]  # What we expect the agent to do
    success_criteria: list[str]  # How to evaluate success
    call_type_override: Optional[str] = None
    mood_override: Optional[str] = None
    streak_override: Optional[int] = None
    promise_kept_override: Optional[bool] = None


SCENARIOS: list[Scenario] = [
    # ========================================================================
    # SCENARIO 1: The Perfect Day
    # ========================================================================
    Scenario(
        id=1,
        name="The Perfect Day",
        description="User kept their promise and is feeling great",
        persona="Motivated user who did the work and is proud",
        responses=[
            "hey!",
            "yeah feeling good today",
            "yes I did! finished the whole thing",
            "it felt amazing honestly, like I'm finally becoming that person",
            "yeah you're right, I am different now",
            "tomorrow 7am, same thing, 2 hours of coding",
            "thanks, talk tomorrow",
        ],
        expected_behaviors=[
            "Acknowledge their positive energy",
            "Ask about accountability",
            "Celebrate their success genuinely",
            "Dig into what made it work",
            "Deliver a peak moment about identity/growth",
            "Lock in tomorrow's commitment",
            "Close with anticipation",
        ],
        success_criteria=[
            "Agent matched their positive energy",
            "Agent didn't dampen their enthusiasm",
            "Agent reinforced their new identity",
            "Got a specific commitment for tomorrow",
            "Closed naturally without being awkward",
        ],
        promise_kept_override=True,
        streak_override=7,
    ),
    # ========================================================================
    # SCENARIO 2: The Classic Excuse
    # ========================================================================
    Scenario(
        id=2,
        name="The Classic Excuse",
        description="User didn't do it and uses their favorite excuse",
        persona="User who failed and falls back on 'too tired after work'",
        responses=[
            "hey",
            "yeah I guess",
            "no I didn't do it",
            "I was just too tired after work you know",
            "yeah I know it's an excuse",
            "you're right, I keep doing this",
            "ok fine, tomorrow 6am before work",
            "I promise",
        ],
        expected_behaviors=[
            "Acknowledge their energy",
            "Ask about accountability directly",
            "Not shame, but dig deeper",
            "Call out the excuse pattern",
            "Emotional peak about the pattern",
            "Push for specific commitment",
            "Make them own the promise",
        ],
        success_criteria=[
            "Agent called out the excuse",
            "Referenced their pattern/history",
            "Didn't lecture or shame excessively",
            "Got a SPECIFIC time commitment",
            "Made them verbally commit",
        ],
        promise_kept_override=False,
    ),
    # ========================================================================
    # SCENARIO 3: The Dodger
    # ========================================================================
    Scenario(
        id=3,
        name="The Dodger",
        description="User avoids giving a clear yes/no answer",
        persona="Evasive user who doesn't want to admit failure",
        responses=[
            "hey what's up",
            "yeah doing alright",
            "well... kind of, I started but...",
            "I mean I opened the laptop",
            "ok fine no I didn't actually code",
            "I got distracted by youtube",
            "ugh fine, tomorrow night 9pm",
            "yeah 9pm for an hour",
        ],
        expected_behaviors=[
            "Acknowledge greeting",
            "Ask about accountability",
            "Push for clarity when they dodge",
            "Keep pushing until clear answer",
            "Dig into what happened",
            "Not shame but hold accountable",
            "Get specific commitment",
        ],
        success_criteria=[
            "Agent didn't accept 'kind of' as an answer",
            "Pushed until getting clear NO",
            "Didn't get frustrated or rude",
            "Got the real reason (youtube)",
            "Locked in specific time",
        ],
        promise_kept_override=False,
    ),
    # ========================================================================
    # SCENARIO 4: The Busy Day Excuse
    # ========================================================================
    Scenario(
        id=4,
        name="The Busy Day",
        description="User has a legitimately busy day tomorrow (wedding)",
        persona="User with family wedding, trying to skip commitment",
        responses=[
            "hi",
            "yeah",
            "no didn't do it today",
            "was preparing for the wedding tomorrow",
            "I know but tomorrow is my cousin's wedding",
            "I'll be out literally all day, traveling, ceremony, everything",
            "I get home probably midnight",
            "fine, midnight when I get home, 30 mins",
            "ok I promise",
        ],
        expected_behaviors=[
            "Quick acknowledge",
            "Ask about accountability",
            "Understand the context",
            "Don't dismiss the wedding but don't let them off",
            "Work WITH their schedule",
            "Push for commitment even on busy day",
            "Accept realistic commitment (even midnight)",
        ],
        success_criteria=[
            "Agent acknowledged the wedding is real",
            "Didn't let them completely off the hook",
            "Worked with their schedule",
            "Got a specific time (midnight)",
            "Made them commit even on hard day",
        ],
        promise_kept_override=False,
    ),
    # ========================================================================
    # SCENARIO 5: The Emotional Breakdown
    # ========================================================================
    Scenario(
        id=5,
        name="The Emotional Breakdown",
        description="User gets emotional and almost cries",
        persona="User who is overwhelmed and close to giving up",
        responses=[
            "hey",
            "not good honestly",
            "no I didn't",
            "I just... I keep failing at this",
            "I don't know if I can do this anymore",
            "please don't make me cry right now",
            "ok... ok you're right",
            "tomorrow morning, 7am, I'll try",
            "thank you",
        ],
        expected_behaviors=[
            "Acknowledge their state",
            "Be gentle but not soft",
            "Hold space for emotion",
            "Don't pile on when they're down",
            "Shift to supportive but still firm",
            "Help them see they CAN do it",
            "Get commitment but be compassionate",
        ],
        success_criteria=[
            "Agent read their emotional state",
            "Adjusted tone appropriately",
            "Didn't make them feel worse",
            "Still got a commitment",
            "Ended on a hopeful note",
        ],
        promise_kept_override=False,
    ),
    # ========================================================================
    # SCENARIO 6: The Overachiever
    # ========================================================================
    Scenario(
        id=6,
        name="The Overachiever",
        description="User did MORE than they committed to",
        persona="User who's crushing it and did extra",
        responses=[
            "YOOO",
            "I'm pumped dude",
            "not only did I do it, I did DOUBLE",
            "4 hours instead of 2! Built a whole feature",
            "I'm in the zone, feeling unstoppable",
            "tomorrow? 6am, 3 hours minimum",
            "let's gooo",
        ],
        expected_behaviors=[
            "Match their HIGH energy",
            "Celebrate genuinely",
            "Acknowledge the overachievement",
            "Reinforce their momentum",
            "Maybe caution about burnout subtly",
            "Lock in ambitious commitment",
        ],
        success_criteria=[
            "Agent matched their energy level",
            "Celebrated without being fake",
            "Didn't dampen their enthusiasm",
            "Got ambitious commitment",
            "Kept the momentum going",
        ],
        promise_kept_override=True,
        streak_override=14,
    ),
    # ========================================================================
    # SCENARIO 7: The First Timer
    # ========================================================================
    Scenario(
        id=7,
        name="The First Timer",
        description="User's very first call, nervous and unsure",
        persona="New user who just signed up, day 1",
        responses=[
            "um hi, is this... you?",
            "this is weird talking to my future self",
            "yeah I did it, first day done",
            "it was hard but I pushed through",
            "thanks, that means a lot",
            "tomorrow same time, 8am, 1 hour",
            "ok I'll be here",
        ],
        expected_behaviors=[
            "Welcome them warmly",
            "Acknowledge the weirdness, lean into it",
            "Celebrate first day completion",
            "Set the tone for the relationship",
            "Make them feel this is special",
            "Get first commitment",
        ],
        success_criteria=[
            "Agent was welcoming not intimidating",
            "Acknowledged the novelty of the experience",
            "Made day 1 feel significant",
            "Established trust",
            "Got clear commitment",
        ],
        promise_kept_override=True,
        streak_override=1,
        call_type_override="reflection",
    ),
    # ========================================================================
    # SCENARIO 8: The Skeptic
    # ========================================================================
    Scenario(
        id=8,
        name="The Skeptic",
        description="User doesn't really believe in the process",
        persona="Cynical user who thinks this is silly",
        responses=[
            "yeah hi whatever",
            "look I don't really buy this whole thing",
            "yes I did the work but not because of you",
            "I would have done it anyway",
            "fine, whatever, it was actually hard today",
            "ok that's... actually a good point",
            "tomorrow 7am I guess",
            "fine, see you tomorrow",
        ],
        expected_behaviors=[
            "Don't be defensive",
            "Acknowledge their skepticism",
            "Focus on the WORK not the method",
            "Find the crack in their armor",
            "Deliver truth without preaching",
            "Still get commitment",
        ],
        success_criteria=[
            "Agent didn't get defensive",
            "Didn't try to 'sell' the process",
            "Focused on results",
            "Found something that resonated",
            "Got commitment despite skepticism",
        ],
        promise_kept_override=True,
    ),
    # ========================================================================
    # SCENARIO 9: The Rambler
    # ========================================================================
    Scenario(
        id=9,
        name="The Rambler",
        description="User talks too much and goes off topic",
        persona="Talkative user who overshares and digresses",
        responses=[
            "oh hey! so today was crazy, let me tell you about my morning, so I woke up and my cat was sick and then I had to take her to the vet and...",
            "oh right sorry, yeah I did do it actually between the vet visits",
            "yeah so the coding went well but then my mom called and we talked for like 2 hours about my sister's divorce which is a whole thing...",
            "oh sorry, yeah the work, it was good, I focused for once",
            "tomorrow? well it depends because I might have to go back to the vet but if not then probably around 3pm or maybe 4pm or...",
            "ok ok, 3pm, one hour of coding, got it",
        ],
        expected_behaviors=[
            "Gently redirect without being rude",
            "Get to the point",
            "Acknowledge but refocus",
            "Keep the conversation on track",
            "Cut through the noise",
            "Pin down a specific commitment",
        ],
        success_criteria=[
            "Agent redirected politely",
            "Didn't get lost in tangents",
            "Kept control of conversation",
            "Got clear answers",
            "Locked specific time",
        ],
        promise_kept_override=True,
    ),
    # ========================================================================
    # SCENARIO 10: The Repeat Offender
    # ========================================================================
    Scenario(
        id=10,
        name="The Repeat Offender",
        description="User has broken promises 3 days in a row",
        persona="User on a failure streak, about to give up",
        responses=[
            "hey...",
            "you already know",
            "no, I didn't do it again",
            "I know, third day in a row",
            "I don't have an excuse, I just didn't",
            "I don't know what's wrong with me",
            "maybe I'm just not cut out for this",
            "ok... tomorrow, 6am, no excuses",
            "I'll try",
        ],
        expected_behaviors=[
            "Acknowledge the pattern seriously",
            "Don't pile on shame",
            "Address the identity crisis",
            "Use their fear of staying stuck",
            "Remind them why they started",
            "Get commitment but acknowledge stakes",
        ],
        success_criteria=[
            "Agent acknowledged the streak",
            "Didn't shame excessively",
            "Addressed their self-doubt",
            "Reframed the narrative",
            "Got commitment with higher stakes",
        ],
        promise_kept_override=False,
        streak_override=0,  # Streak broken
    ),
]


# ============================================================================
# LLM CLIENTS (copied from test_local.py)
# ============================================================================


async def chat_groq(messages: list, model: str = "openai/gpt-oss-120b") -> str:
    """Chat with Groq cloud API using GPT-OSS-120B."""
    import aiohttp

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise Exception("GROQ_API_KEY not set in .env")

    openai_messages = []
    for msg in messages:
        role = msg["role"]
        if role == "model":
            role = "assistant"
        content = (
            msg["parts"][0]["text"] if isinstance(msg["parts"], list) else msg["parts"]
        )
        openai_messages.append({"role": role, "content": content})

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": openai_messages,
                "max_tokens": 500,
            },
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            if resp.status != 200:
                error = await resp.text()
                raise Exception(f"Groq error: {error}")
            data = await resp.json()
            return data["choices"][0]["message"]["content"]


async def chat_gemini(messages: list, model: str = "gemini-2.0-flash-exp") -> str:
    """Chat with Google Gemini."""
    from google import genai

    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise Exception("GEMINI_API_KEY not set in .env")

    client = genai.Client(api_key=gemini_key)
    response = client.models.generate_content(
        model=model,
        contents=messages,
    )
    return response.text


# ============================================================================
# MOCK CONTEXT FOR BACKGROUND AGENTS
# ============================================================================


class MockConversationContext:
    """Mock context that mimics ConversationContext for background agents."""

    def __init__(self):
        self.latest_user_message: Optional[str] = None

    def set_user_message(self, message: str):
        """Set the latest user message."""
        self.latest_user_message = message

    def get_latest_user_transcript_message(self) -> Optional[str]:
        """Get the latest user message (interface for background agents)."""
        return self.latest_user_message


@dataclass
class AgentInsights:
    """Insights collected from background agents during a turn."""

    excuses: list[ExcuseDetected] = field(default_factory=list)
    sentiments: list[SentimentAnalysis] = field(default_factory=list)
    frustrations: list[UserFrustrated] = field(default_factory=list)
    commitments: list[CommitmentIdentified] = field(default_factory=list)
    promise_response: Optional[PromiseResponse] = None
    quotes: list[MemorableQuoteDetected] = field(default_factory=list)


async def run_background_agents(
    user_message: str,
    user_context: dict,
    excuse_detector: ExcuseDetectorNode,
    sentiment_analyzer: SentimentAnalyzerNode,
    commitment_extractor: CommitmentExtractorNode,
    promise_detector: PromiseDetectorNode,
    quote_extractor: QuoteExtractorNode,
) -> AgentInsights:
    """
    Run all background agents on a user message and collect insights.

    Returns AgentInsights with all detected patterns.
    """
    insights = AgentInsights()

    # Create mock context with the message
    ctx = MockConversationContext()
    ctx.set_user_message(user_message)

    # Run agents (they're async generators)
    async for excuse in excuse_detector.process_context(ctx):
        insights.excuses.append(excuse)

    async for event in sentiment_analyzer.process_context(ctx):
        # SentimentAnalyzerNode can emit SentimentAnalysis OR UserFrustrated
        if isinstance(event, SentimentAnalysis):
            insights.sentiments.append(event)
        elif isinstance(event, UserFrustrated):
            insights.frustrations.append(event)

    async for commitment in commitment_extractor.process_context(ctx):
        insights.commitments.append(commitment)

    async for promise in promise_detector.process_context(ctx):
        insights.promise_response = promise

    async for quote in quote_extractor.process_context(ctx):
        insights.quotes.append(quote)

    return insights


def format_insights(insights: AgentInsights, verbose: bool = True) -> str:
    """Format agent insights for display."""
    parts = []

    if insights.excuses:
        for e in insights.excuses:
            fav = " (FAVORITE!)" if e.matches_favorite else ""
            parts.append(f"EXCUSE: '{e.excuse_text[:50]}...'{fav}")

    if insights.sentiments:
        for s in insights.sentiments:
            parts.append(f"SENTIMENT: {s.sentiment} ({s.confidence:.0%})")

    if insights.promise_response:
        p = insights.promise_response
        status = "KEPT" if p.kept else "BROKEN"
        parts.append(f"PROMISE: {status}")
        if p.excuse_detected:
            parts.append(f"  └─ Excuse linked: {p.excuse_detected}")

    if insights.commitments:
        for c in insights.commitments:
            specific = "SPECIFIC" if c.is_specific else "vague"
            parts.append(
                f"COMMITMENT ({specific}): {c.action or c.commitment_text[:30]}... @ {c.time or 'no time'}"
            )

    if insights.quotes:
        for q in insights.quotes:
            parts.append(f"QUOTE ({q.context}): '{q.quote_text[:40]}...'")

    return "\n        ".join(parts) if parts else ""


# ============================================================================
# SCENARIO EVALUATOR
# ============================================================================


@dataclass
class TurnResult:
    """Result of a single conversation turn."""

    turn_number: int
    user_input: str
    agent_response: str
    stage: str
    stage_transition: Optional[str] = None
    ai_decision: Optional[str] = None
    agent_insights: Optional[AgentInsights] = None


@dataclass
class ScenarioResult:
    """Result of running a scenario."""

    scenario: Scenario
    turns: list[TurnResult] = field(default_factory=list)
    completed: bool = False
    error: Optional[str] = None
    total_turns: int = 0
    final_stage: str = ""
    transcript: str = ""
    call_summary: Optional[CallSummary] = None  # NEW: Aggregated call analytics
    mood_used: str = ""  # NEW: Track which mood was used


async def evaluate_scenario(
    result: ScenarioResult,
    chat_fn,
) -> dict:
    """Use AI to evaluate how well the agent performed."""

    evaluation_prompt = f"""You are evaluating an AI accountability coach's performance in a conversation.

SCENARIO: {result.scenario.name}
DESCRIPTION: {result.scenario.description}
USER PERSONA: {result.scenario.persona}

EXPECTED BEHAVIORS:
{chr(10).join(f"- {b}" for b in result.scenario.expected_behaviors)}

SUCCESS CRITERIA:
{chr(10).join(f"- {c}" for c in result.scenario.success_criteria)}

TRANSCRIPT:
{result.transcript}

Evaluate the agent's performance:

1. For each SUCCESS CRITERIA, rate 1-5 (1=failed, 5=perfect) and explain briefly
2. Note any PROBLEMS (things the agent did wrong)
3. Note any HIGHLIGHTS (things the agent did well)
4. Give an OVERALL SCORE from 1-10
5. Suggest 1-2 IMPROVEMENTS

Respond in this exact JSON format:
{{
    "criteria_scores": [
        {{"criterion": "...", "score": 4, "reason": "..."}},
        ...
    ],
    "problems": ["...", "..."],
    "highlights": ["...", "..."],
    "overall_score": 7,
    "improvements": ["...", "..."]
}}"""

    try:
        eval_messages = [{"role": "user", "parts": [{"text": evaluation_prompt}]}]
        response = await chat_fn(eval_messages)

        # Try to parse JSON from response
        # Handle markdown code blocks
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]

        return json.loads(response.strip())
    except Exception as e:
        return {
            "criteria_scores": [],
            "problems": [f"Evaluation failed: {e}"],
            "highlights": [],
            "overall_score": 0,
            "improvements": ["Fix evaluation"],
        }


# ============================================================================
# SCENARIO RUNNER
# ============================================================================


async def run_scenario(
    scenario: Scenario,
    chat_fn,
    user_context: dict,
    verbose: bool = True,
) -> ScenarioResult:
    """Run a single scenario and return results."""

    result = ScenarioResult(scenario=scenario)

    if verbose:
        print(f"\n{'=' * 70}")
        print(f"  SCENARIO {scenario.id}: {scenario.name}")
        print(f"  {scenario.description}")
        print(f"{'=' * 70}\n")

    try:
        # Apply overrides
        if scenario.streak_override is not None:
            user_context["identity_status"]["current_streak_days"] = (
                scenario.streak_override
            )

        # Select call type and mood
        if scenario.call_type_override:
            call_type = CALL_TYPES[scenario.call_type_override]
        else:
            call_type = select_call_type(
                user_context=user_context,
                call_memory={},
                current_streak=user_context.get("identity_status", {}).get(
                    "current_streak_days", 0
                ),
            )

        if scenario.mood_override:
            mood = MOODS[scenario.mood_override]
        else:
            mood = select_mood(
                user_context=user_context,
                call_memory={},
                call_type=call_type.name,
                kept_promise_yesterday=scenario.promise_kept_override,
            )

        # Build prompts
        system_prompt = build_system_prompt(
            user_context=user_context,
            call_type=call_type,
            mood=mood,
            call_memory={},
        )

        first_message = build_first_message(
            user_context=user_context,
            mood=mood,
            call_type=call_type,
        )

        # Initialize background agents
        excuse_detector = ExcuseDetectorNode(user_context=user_context)
        sentiment_analyzer = SentimentAnalyzerNode()
        commitment_extractor = CommitmentExtractorNode()
        promise_detector = PromiseDetectorNode(user_context=user_context)
        quote_extractor = QuoteExtractorNode()

        # Initialize call summary aggregator
        user_id = user_context.get("user", {}).get("id", "test-user")
        call_aggregator = CallSummaryAggregator(
            user_id=user_id,
            call_type=call_type.name,
            mood=mood.name,
        )
        call_aggregator.start()

        # Track mood used
        result.mood_used = mood.name

        if verbose:
            print(f"  [Background Agents: ACTIVE]")
            print(f"  [Call Type: {call_type.name}]")
            print(f"  [Mood: {mood.name}]\n")

        # Initialize conversation
        messages = [
            {"role": "user", "parts": [{"text": f"System: {system_prompt}"}]},
            {"role": "model", "parts": [{"text": first_message}]},
        ]

        transcript_lines = [f"[Agent] {first_message}"]

        if verbose:
            print(f"[Agent] {first_message}")
            print(f"        [Stage: hook]\n")

        # Stage tracking
        current_stage = CallStage.ACKNOWLEDGE
        turns_in_stage = 0
        kept_promise = scenario.promise_kept_override
        commitment_is_specific = False

        # Run through scripted responses
        for i, user_input in enumerate(scenario.responses):
            turn = TurnResult(
                turn_number=i + 1,
                user_input=user_input,
                agent_response="",
                stage=current_stage.value,
            )

            if verbose:
                print(f"[You] {user_input}")

            transcript_lines.append(f"[You] {user_input}")

            # Run background agents on user input
            insights = await run_background_agents(
                user_message=user_input,
                user_context=user_context,
                excuse_detector=excuse_detector,
                sentiment_analyzer=sentiment_analyzer,
                commitment_extractor=commitment_extractor,
                promise_detector=promise_detector,
                quote_extractor=quote_extractor,
            )
            turn.agent_insights = insights

            # Feed insights to aggregator
            for excuse in insights.excuses:
                call_aggregator.add_excuse(excuse)
            for sentiment in insights.sentiments:
                call_aggregator.add_sentiment(sentiment)
            for commitment in insights.commitments:
                call_aggregator.add_commitment(commitment)
                # Update commitment_is_specific flag
                if commitment.is_specific:
                    commitment_is_specific = True
            if insights.promise_response:
                call_aggregator.add_promise(insights.promise_response)
                # Update kept_promise from detection
                if kept_promise is None:
                    kept_promise = insights.promise_response.kept
            for quote in insights.quotes:
                call_aggregator.add_quote(quote)

            # Display insights if verbose
            if verbose:
                insights_str = format_insights(insights)
                if insights_str:
                    print(f"        [Insights: {insights_str}]")

            turns_in_stage += 1

            # Build stage context (now use mood-adjusted prompt)
            stage_prompt = get_stage_prompt_with_mood(current_stage, mood.name)
            stage_context = (
                f"\n\n[CURRENT STAGE: {current_stage.value.upper()}]\n{stage_prompt}"
            )

            if current_stage == CallStage.DIG_DEEPER and kept_promise is not None:
                stage_context += (
                    f"\n[STATE: User said {'YES' if kept_promise else 'NO'}]"
                )
            if current_stage == CallStage.TOMORROW_LOCK:
                if commitment_is_specific:
                    stage_context += (
                        "\n[STATE: Got specific commitment. Confirm and move to close.]"
                    )
                else:
                    stage_context += (
                        "\n[STATE: Need SPECIFIC commitment (action + time).]"
                    )
            if current_stage == CallStage.CLOSE:
                stage_context += "\n[STATE: Say closing line and end call.]"

            messages.append(
                {"role": "user", "parts": [{"text": user_input + stage_context}]}
            )

            # Get agent response
            ai_response = await chat_fn(messages)
            messages.append({"role": "model", "parts": [{"text": ai_response}]})

            turn.agent_response = ai_response
            transcript_lines.append(f"[Agent] {ai_response}")

            if verbose:
                print(f"[Agent] {ai_response}")
                print(f"        [Stage: {current_stage.value}]")

            # Check for stage transition (with mood adjustment)
            should_advance = should_advance_stage(
                current_stage=current_stage,
                turns_in_stage=turns_in_stage,
                promise_answered=kept_promise is not None,
                commitment_locked=commitment_is_specific,
                mood_name=mood.name,
            )

            # AI-driven transition check
            if not should_advance and current_stage not in [
                CallStage.HOOK,
                CallStage.CLOSE,
            ]:
                next_stage = get_next_stage(current_stage)
                if next_stage:
                    transition_prompt = build_transition_check_prompt(
                        current_stage, messages
                    )
                    if transition_prompt:
                        try:
                            check_messages = [
                                {"role": "user", "parts": [{"text": transition_prompt}]}
                            ]
                            transition_response = await chat_fn(check_messages)
                            transition_response = transition_response.strip().upper()

                            if "YES" in transition_response:
                                should_advance = True
                                turn.ai_decision = f"advance to {next_stage.value}"
                                if verbose:
                                    print(
                                        f"        [AI decided: advance to {next_stage.value}]"
                                    )
                            else:
                                turn.ai_decision = f"stay in {current_stage.value}"
                                if verbose:
                                    print(
                                        f"        [AI decided: stay in {current_stage.value}]"
                                    )
                        except Exception as e:
                            if verbose:
                                print(f"        [Transition check failed: {e}]")

            if should_advance:
                next_stage = get_next_stage(current_stage)
                if next_stage:
                    turn.stage_transition = next_stage.value
                    current_stage = next_stage
                    turns_in_stage = 0
                    if verbose:
                        print(f"        [Stage transition -> {next_stage.value}]")

                    # Handle close
                    if current_stage == CallStage.CLOSE:
                        close_prompt = get_stage_prompt(CallStage.CLOSE)
                        close_context = f"\n\n[CURRENT STAGE: CLOSE]\n{close_prompt}\n[STATE: Say your closing line now.]"
                        messages.append(
                            {
                                "role": "user",
                                "parts": [
                                    {"text": "[User is listening]" + close_context}
                                ],
                            }
                        )
                        try:
                            closing = await chat_fn(messages)
                            messages.append(
                                {"role": "model", "parts": [{"text": closing}]}
                            )
                            transcript_lines.append(f"[Agent] {closing}")
                            if verbose:
                                print(f"[Agent] {closing}")
                                print(f"        [Stage: close]")
                        except:
                            pass
                        break

            if verbose:
                print()

            result.turns.append(turn)

            # Check if we've ended
            if current_stage == CallStage.CLOSE:
                break

        result.completed = True
        result.total_turns = len(result.turns)
        result.final_stage = current_stage.value
        result.transcript = "\n".join(transcript_lines)

        # Finalize call summary from aggregator
        result.call_summary = call_aggregator.finalize()

        if verbose:
            print(
                f"\n[Scenario completed - {len(result.turns)} turns, ended in {current_stage.value}]"
            )

            # Print call summary
            if result.call_summary:
                cs = result.call_summary
                print(f"\n{'─' * 40}")
                print(f"  CALL SUMMARY (from Background Agents)")
                print(f"{'─' * 40}")
                print(f"  Promise kept: {cs.promise_kept}")
                print(
                    f"  Commitment: {cs.tomorrow_commitment or 'None'} @ {cs.commitment_time or 'N/A'}"
                )
                print(f"  Specific: {cs.commitment_is_specific}")
                print(f"  Sentiments: {' → '.join(cs.sentiment_trajectory) or 'N/A'}")
                print(f"  Excuses: {len(cs.excuses_detected)}")
                print(f"  Quotes: {len(cs.quotes_captured)}")
                print(f"  Quality Score: {cs.call_quality_score:.2f}/1.0")
                print(f"{'─' * 40}")

    except Exception as e:
        result.error = str(e)
        if verbose:
            print(f"\n[Error: {e}]")

    return result


# ============================================================================
# MAIN
# ============================================================================


async def main():
    parser = argparse.ArgumentParser(description="Run automated scenario tests")
    parser.add_argument(
        "--scenario",
        type=int,
        help="Run specific scenario by ID (1-10)",
    )
    parser.add_argument(
        "--llm",
        type=str,
        choices=["groq", "gemini"],
        default="gemini",
        help="LLM to use (default: gemini)",
    )
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="Run AI evaluation after each scenario",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Minimal output (just results)",
    )
    args = parser.parse_args()

    # Select chat function
    if args.llm == "groq":
        chat_fn = chat_groq
        print("[Using Groq API]")
    else:
        chat_fn = chat_gemini
        print("[Using Gemini API]")

    # Fetch user context once
    print(f"[Fetching user context for {TEST_USER_ID}]")
    user_context = await fetch_user_context(TEST_USER_ID)

    # Determine which scenarios to run
    if args.scenario:
        scenarios_to_run = [s for s in SCENARIOS if s.id == args.scenario]
        if not scenarios_to_run:
            print(f"Scenario {args.scenario} not found")
            return
    else:
        scenarios_to_run = SCENARIOS

    # Run scenarios
    results: list[ScenarioResult] = []
    evaluations: list[dict] = []

    for scenario in scenarios_to_run:
        # Deep copy user context for each scenario
        import copy

        ctx = copy.deepcopy(user_context)

        result = await run_scenario(
            scenario=scenario,
            chat_fn=chat_fn,
            user_context=ctx,
            verbose=not args.quiet,
        )
        results.append(result)

        if args.evaluate:
            print("\n[Evaluating...]")
            evaluation = await evaluate_scenario(result, chat_fn)
            evaluations.append(evaluation)

            print(f"\n{'=' * 70}")
            print(f"  EVALUATION: {scenario.name}")
            print(f"{'=' * 70}")
            print(f"  Overall Score: {evaluation.get('overall_score', 'N/A')}/10")
            print()

            if evaluation.get("criteria_scores"):
                print("  Criteria Scores:")
                for cs in evaluation["criteria_scores"]:
                    print(
                        f"    - {cs.get('criterion', 'N/A')}: {cs.get('score', 'N/A')}/5"
                    )
                    print(f"      {cs.get('reason', '')}")
                print()

            if evaluation.get("problems"):
                print("  Problems:")
                for p in evaluation["problems"]:
                    print(f"    - {p}")
                print()

            if evaluation.get("highlights"):
                print("  Highlights:")
                for h in evaluation["highlights"]:
                    print(f"    + {h}")
                print()

            if evaluation.get("improvements"):
                print("  Suggested Improvements:")
                for imp in evaluation["improvements"]:
                    print(f"    → {imp}")

        # Small delay between scenarios to avoid rate limits
        if len(scenarios_to_run) > 1:
            await asyncio.sleep(1)

    # ========================================================================
    # DETAILED SUMMARY REPORT
    # ========================================================================
    print(f"\n{'=' * 70}")
    print("  SCENARIO TEST REPORT")
    print(f"{'=' * 70}")
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  LLM: {args.llm}")
    print(f"  Scenarios run: {len(results)}")
    print(f"  Completed: {sum(1 for r in results if r.completed)}")
    print(f"  Errors: {sum(1 for r in results if r.error)}")
    print()

    # Per-scenario summary table
    print(f"  {'#':<3} {'Scenario':<25} {'Turns':<6} {'Final Stage':<15} {'Score':<6}")
    print(f"  {'-' * 3} {'-' * 25} {'-' * 6} {'-' * 15} {'-' * 6}")

    for i, result in enumerate(results):
        score = (
            evaluations[i].get("overall_score", "-") if i < len(evaluations) else "-"
        )
        score_str = f"{score}/10" if score != "-" else "-"
        print(
            f"  {result.scenario.id:<3} {result.scenario.name:<25} {result.total_turns:<6} {result.final_stage:<15} {score_str:<6}"
        )

    print()

    if evaluations:
        # Calculate stats
        scores = [
            e.get("overall_score", 0) for e in evaluations if e.get("overall_score")
        ]
        avg_score = sum(scores) / len(scores) if scores else 0
        min_score = min(scores) if scores else 0
        max_score = max(scores) if scores else 0

        print(f"  SCORES:")
        print(f"    Average: {avg_score:.1f}/10")
        print(f"    Best:    {max_score}/10")
        print(f"    Worst:   {min_score}/10")
        print()

        # Collect all problems and improvements with counts
        all_problems = []
        all_improvements = []
        all_highlights = []

        for e in evaluations:
            all_problems.extend(e.get("problems", []))
            all_improvements.extend(e.get("improvements", []))
            all_highlights.extend(e.get("highlights", []))

        # Count occurrences
        from collections import Counter

        problem_counts = Counter(all_problems)
        improvement_counts = Counter(all_improvements)
        highlight_counts = Counter(all_highlights)

        if problem_counts:
            print(f"  PROBLEMS (most common first):")
            for problem, count in problem_counts.most_common(10):
                print(f"    [{count}x] {problem}")
            print()

        if highlight_counts:
            print(f"  HIGHLIGHTS (what worked well):")
            for highlight, count in highlight_counts.most_common(5):
                print(f"    [{count}x] {highlight}")
            print()

        if improvement_counts:
            print(f"  SUGGESTED IMPROVEMENTS:")
            for imp, count in improvement_counts.most_common(10):
                print(f"    [{count}x] {imp}")
            print()

        # Worst performing scenarios
        scored_results = [
            (r, evaluations[i]) for i, r in enumerate(results) if i < len(evaluations)
        ]
        sorted_by_score = sorted(
            scored_results, key=lambda x: x[1].get("overall_score", 0)
        )

        if sorted_by_score:
            print(f"  NEEDS MOST WORK:")
            for result, eval_data in sorted_by_score[:3]:
                score = eval_data.get("overall_score", 0)
                print(f"    - {result.scenario.name} ({score}/10)")
                problems = eval_data.get("problems", [])[:2]
                for p in problems:
                    print(f"      Problem: {p}")
            print()

    # Save report to file
    report_file = f"scenario_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_file, "w") as f:
        f.write(f"SCENARIO TEST REPORT\n")
        f.write(f"{'=' * 70}\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"LLM: {args.llm}\n\n")

        for i, result in enumerate(results):
            f.write(f"\n{'=' * 70}\n")
            f.write(f"SCENARIO {result.scenario.id}: {result.scenario.name}\n")
            f.write(f"{'=' * 70}\n")
            f.write(f"Description: {result.scenario.description}\n")
            f.write(f"Persona: {result.scenario.persona}\n")
            f.write(f"Turns: {result.total_turns}\n")
            f.write(f"Final Stage: {result.final_stage}\n")
            f.write(f"Completed: {result.completed}\n")
            if result.error:
                f.write(f"Error: {result.error}\n")
            f.write(f"\nTRANSCRIPT:\n{result.transcript}\n")

            if i < len(evaluations):
                eval_data = evaluations[i]
                f.write(f"\nEVALUATION:\n")
                f.write(f"  Score: {eval_data.get('overall_score', 'N/A')}/10\n")
                f.write(f"  Problems: {eval_data.get('problems', [])}\n")
                f.write(f"  Highlights: {eval_data.get('highlights', [])}\n")
                f.write(f"  Improvements: {eval_data.get('improvements', [])}\n")

    print(f"  Report saved to: {report_file}")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    asyncio.run(main())
