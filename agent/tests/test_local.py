"""
Local Test Script for Future Self Agent
========================================

Test the agent's prompts and responses WITHOUT making a real phone call.
Uses your test user's data from Supabase.

Usage:
    cd agent
    uv run python test_local.py

Options:
    uv run python test_local.py --call-type audit
    uv run python test_local.py --mood cold_intense
    uv run python test_local.py --streak 7
    uv run python test_local.py --promise-kept false

LLM Options:
    uv run python test_local.py --llm gemini          # Google Gemini (default)
    uv run python test_local.py --llm ollama          # Local Ollama
    uv run python test_local.py --llm groq            # Groq cloud (free, better quality)
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from dotenv import load_dotenv

load_dotenv()

from core.config import (
    fetch_user_context,
    fetch_call_memory,
    build_system_prompt,
    build_first_message,
    get_yesterday_promise_status,
)
from conversation.call_types import select_call_type, CALL_TYPES
from conversation.mood import select_mood, MOODS
from conversation.stages import (
    CallStage,
    get_stage_prompt,
    get_stage_config,
    get_next_stage,
    should_advance_stage,
    build_transition_check_prompt,
)

# ============================================================================
# TEST USER ID - PASTE YOUR TEST USER ID HERE
# ============================================================================
TEST_USER_ID = "8f6221f8-8a88-4585-870c-9520ee2ed9e5"


def parse_args():
    """Parse command line arguments for testing different scenarios."""
    parser = argparse.ArgumentParser(description="Test the Future Self agent locally")
    parser.add_argument(
        "--user-id",
        type=str,
        default=TEST_USER_ID,
        help="User ID to test with",
    )
    parser.add_argument(
        "--call-type",
        type=str,
        choices=["audit", "reflection", "story", "challenge", "milestone"],
        help="Force a specific call type (default: auto-select)",
    )
    parser.add_argument(
        "--mood",
        type=str,
        choices=[
            "warm_direct",
            "cold_intense",
            "playful_challenging",
            "reflective_intimate",
            "dark_prophetic",
            "proud_serious",
        ],
        help="Force a specific mood (default: auto-select)",
    )
    parser.add_argument(
        "--streak",
        type=int,
        help="Override current streak days (for testing milestones)",
    )
    parser.add_argument(
        "--promise-kept",
        type=str,
        choices=["true", "false", "none"],
        help="Override yesterday's promise status",
    )
    parser.add_argument(
        "--no-interactive",
        action="store_true",
        help="Skip interactive mode, just show prompts",
    )
    parser.add_argument(
        "--llm",
        type=str,
        choices=["ollama", "groq", "gemini"],
        default="gemini",
        help="LLM to use for interactive testing (default: gemini)",
    )
    parser.add_argument(
        "--model",
        type=str,
        help="Override model name (e.g., 'qwen2.5:14b', 'llama-3.1-70b-versatile')",
    )
    return parser.parse_args()


# ============================================================================
# LLM CLIENTS
# ============================================================================


async def chat_ollama(messages: list, model: str = "qwen2.5:14b") -> str:
    """Chat with Ollama local model."""
    import aiohttp

    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")

    # Convert messages to Ollama format
    ollama_messages = []
    for msg in messages:
        role = msg["role"]
        if role == "model":
            role = "assistant"
        content = (
            msg["parts"][0]["text"] if isinstance(msg["parts"], list) else msg["parts"]
        )
        ollama_messages.append({"role": role, "content": content})

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{ollama_url}/api/chat",
            json={
                "model": model,
                "messages": ollama_messages,
                "stream": False,
            },
            timeout=aiohttp.ClientTimeout(total=120),
        ) as resp:
            if resp.status != 200:
                error = await resp.text()
                raise Exception(f"Ollama error: {error}")
            data = await resp.json()
            return data["message"]["content"]


async def chat_groq(messages: list, model: str = "llama-3.1-70b-versatile") -> str:
    """Chat with Groq cloud API (free tier available)."""
    import aiohttp

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise Exception("GROQ_API_KEY not set in .env")

    # Convert messages to OpenAI format
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


async def test_agent_locally():
    """Test the agent's context fetching and prompt building."""
    args = parse_args()

    print("=" * 70)
    print("  YOU+ FUTURE SELF AGENT - LOCAL TEST")
    print("  Behavior-Hacked Voice Call System")
    print("=" * 70)
    print()

    # ========================================================================
    # 1. FETCH USER CONTEXT
    # ========================================================================
    print(f"[1/5] Fetching context for user: {args.user_id}")

    user_context = await fetch_user_context(args.user_id)
    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})
    onboarding = identity.get("onboarding_context", {})
    call_history = user_context.get("call_history", [])

    # Override streak if specified
    if args.streak is not None:
        identity_status["current_streak_days"] = args.streak
        user_context["identity_status"] = identity_status
        print(f"      [Override] Streak set to: {args.streak} days")

    current_streak = identity_status.get("current_streak_days", 0)

    print()
    print("-" * 70)
    print("  USER PROFILE")
    print("-" * 70)
    print(f"  Name:            {identity.get('name', 'N/A')}")
    print(f"  Commitment:      {identity.get('daily_commitment', 'N/A')}")
    print(f"  Streak:          {current_streak} days")
    print(f"  Total calls:     {identity_status.get('total_calls_completed', 0)}")
    print()
    print("  Onboarding:")
    print(f"    Goal:          {onboarding.get('goal', 'N/A')}")
    print(f"    Favorite excuse: {onboarding.get('favorite_excuse', 'N/A')}")
    print(f"    Quit pattern:  {onboarding.get('quit_pattern', 'N/A')}")
    print(f"    Biggest fear:  {onboarding.get('biggest_fear', 'N/A')}")
    print()

    # ========================================================================
    # 2. FETCH CALL MEMORY
    # ========================================================================
    print("[2/5] Fetching call memory...")

    call_memory = await fetch_call_memory(args.user_id)

    print()
    print("-" * 70)
    print("  CALL MEMORY")
    print("-" * 70)
    print(f"  Narrative arc:   {call_memory.get('narrative_arc', 'early_struggle')}")
    print(f"  Last call type:  {call_memory.get('last_call_type', 'None')}")
    print(f"  Last mood:       {call_memory.get('last_mood', 'None')}")
    quotes = call_memory.get("memorable_quotes", [])
    print(f"  Memorable quotes: {len(quotes)}")
    if quotes:
        latest = quotes[-1]
        print(
            f'    Latest: "{latest.get("text", "")[:50]}..." (day {latest.get("day", "?")})'
        )
    print()

    # ========================================================================
    # 3. DETERMINE YESTERDAY'S PROMISE STATUS
    # ========================================================================
    print("[3/5] Determining yesterday's promise status...")

    if args.promise_kept == "true":
        yesterday_promise_kept = True
        print("      [Override] Promise kept: True")
    elif args.promise_kept == "false":
        yesterday_promise_kept = False
        print("      [Override] Promise kept: False")
    elif args.promise_kept == "none":
        yesterday_promise_kept = None
        print("      [Override] Promise kept: None (first call)")
    else:
        yesterday_promise_kept = get_yesterday_promise_status(call_history)
        print(f"      From history: {yesterday_promise_kept}")
    print()

    # ========================================================================
    # 4. SELECT CALL TYPE & MOOD
    # ========================================================================
    print("[4/5] Selecting call type and mood...")

    if args.call_type:
        call_type = CALL_TYPES[args.call_type]
        print(f"      [Override] Call type: {call_type.name}")
    else:
        call_type = select_call_type(
            user_context=user_context,
            call_memory=call_memory,
            current_streak=current_streak,
        )
        print(f"      Auto-selected: {call_type.name}")

    if args.mood:
        mood = MOODS[args.mood]
        print(f"      [Override] Mood: {mood.name}")
    else:
        mood = select_mood(
            user_context=user_context,
            call_memory=call_memory,
            call_type=call_type.name,
            kept_promise_yesterday=yesterday_promise_kept,
        )
        print(f"      Auto-selected: {mood.name}")

    print()
    print("-" * 70)
    print("  CALL CONFIGURATION")
    print("-" * 70)
    print(f"  Call Type:       {call_type.name.upper()}")
    print(f"  Energy:          {call_type.energy}")
    print(
        f"  Duration:        {call_type.min_duration_sec // 60}-{call_type.max_duration_sec // 60} minutes"
    )
    print(f"  Structure:       {' -> '.join(call_type.structure)}")
    print()
    print(f"  Mood:            {mood.name.upper()}")
    print(f"  Emotion tag:     {mood.emotion_tag}")
    print(f"  Speed:           {mood.speed_ratio}x")
    print(f"  Volume:          {mood.volume_ratio}x")
    print(f"  Opener style:    {mood.opener_style}")
    print(f"  Uses pauses:     {mood.use_pauses}")
    print()

    # ========================================================================
    # 5. BUILD PROMPTS
    # ========================================================================
    print("[5/5] Building prompts...")
    print()

    system_prompt = build_system_prompt(
        user_context=user_context,
        call_type=call_type,
        mood=mood,
        call_memory=call_memory,
    )

    first_message = build_first_message(
        user_context=user_context,
        mood=mood,
        call_type=call_type,
    )

    print("=" * 70)
    print("  SYSTEM PROMPT")
    print("=" * 70)
    print(system_prompt)
    print()

    print("=" * 70)
    print("  FIRST MESSAGE")
    print("=" * 70)
    print(f'"{first_message}"')
    print()

    # ========================================================================
    # INTERACTIVE MODE
    # ========================================================================
    if args.no_interactive:
        print("[Done] Skipping interactive mode.")
        return

    # Determine which LLM to use
    llm_name = args.llm
    if args.model:
        model_name = args.model
    elif llm_name == "ollama":
        model_name = "qwen3:8b"  # Use qwen3:8b (more common)
    elif llm_name == "groq":
        model_name = "openai/gpt-oss-120b"  # Main agent model
    else:
        model_name = "gemini-2.0-flash-exp"

    print("=" * 70)
    print(f"  INTERACTIVE TEST ({llm_name.upper()} - {model_name})")
    print("=" * 70)
    print("Type responses as the user. Type 'quit' to exit.")
    print()

    # Select chat function
    if llm_name == "ollama":
        chat_fn = lambda msgs: chat_ollama(msgs, model_name)
        print(
            f"[Info] Using Ollama at {os.getenv('OLLAMA_URL', 'http://localhost:11434')}"
        )
        print("[Info] Make sure Ollama is running: ollama serve")
        print(f"[Info] And model is pulled: ollama pull {model_name}")
    elif llm_name == "groq":
        chat_fn = lambda msgs: chat_groq(msgs, model_name)
        print("[Info] Using Groq cloud API (free tier)")
    else:
        chat_fn = lambda msgs: chat_gemini(msgs, model_name)
        print("[Info] Using Google Gemini")

    print()

    # Stage tracking for test mode
    current_stage = CallStage.HOOK
    turns_in_stage = 0
    kept_promise = None
    commitment_is_specific = False

    try:
        # Start conversation
        messages = [
            {"role": "user", "parts": [{"text": f"System: {system_prompt}"}]},
            {"role": "model", "parts": [{"text": first_message}]},
        ]

        print(f"[Agent] {first_message}")
        print(f"        [Stage: {current_stage.value}]")
        print()

        # Advance past HOOK stage after first message
        current_stage = CallStage.ACKNOWLEDGE
        turns_in_stage = 0

        while True:
            user_input = input("[You] ").strip()

            if user_input.lower() == "quit":
                print("\n[Test ended]")
                break

            if not user_input:
                continue

            # Detect yes/no for stage tracking
            lower_input = user_input.lower()
            if any(w in lower_input for w in ["yes", "yeah", "yep", "did it", "i did"]):
                kept_promise = True
            elif any(w in lower_input for w in ["no", "nope", "didn't", "nah"]):
                kept_promise = False

            # Check for time patterns (for commitment tracking)
            if any(t in lower_input for t in ["am", "pm", "morning", "7", "8", "9"]):
                if any(a in lower_input for a in ["will", "going to", "gonna", "i'll"]):
                    commitment_is_specific = True

            turns_in_stage += 1

            # Build stage-aware message BEFORE checking transitions
            # This ensures the agent responds in the CURRENT stage first
            stage_prompt = get_stage_prompt(current_stage)
            stage_context = (
                f"\n\n[CURRENT STAGE: {current_stage.value.upper()}]\n{stage_prompt}"
            )

            # Add state info
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

            try:
                ai_response = await chat_fn(messages)
                # Store clean response (without stage context visible)
                messages.append({"role": "model", "parts": [{"text": ai_response}]})
                print(f"[Agent] {ai_response}")
                print(f"        [Stage: {current_stage.value}]")
                print()

                # Check if we should advance stage AFTER agent responds
                # First check safety valve (max turns or automatic stages like HOOK/CLOSE)
                should_advance = should_advance_stage(
                    current_stage=current_stage,
                    turns_in_stage=turns_in_stage,
                    promise_answered=kept_promise is not None,
                    commitment_locked=commitment_is_specific,
                )

                # If safety valve didn't trigger, ask AI to decide
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
                                # Use a lightweight check - single word response
                                check_messages = [
                                    {
                                        "role": "user",
                                        "parts": [{"text": transition_prompt}],
                                    }
                                ]
                                transition_response = await chat_fn(check_messages)
                                transition_response = (
                                    transition_response.strip().upper()
                                )

                                # Parse YES/NO from response
                                if "YES" in transition_response:
                                    should_advance = True
                                    print(
                                        f"        [AI decided: advance to {next_stage.value}]"
                                    )
                                else:
                                    print(
                                        f"        [AI decided: stay in {current_stage.value}]"
                                    )
                            except Exception as e:
                                print(f"        [Transition check failed: {e}]")

                if should_advance:
                    next_stage = get_next_stage(current_stage)
                    if next_stage:
                        current_stage = next_stage
                        turns_in_stage = 0
                        print(f"        [Stage transition -> {next_stage.value}]")

                        # If we just transitioned to CLOSE, let the agent say the closing line
                        if current_stage == CallStage.CLOSE:
                            close_prompt = get_stage_prompt(CallStage.CLOSE)
                            close_context = f"\n\n[CURRENT STAGE: CLOSE]\n{close_prompt}\n[STATE: Say your closing line now and end the call.]"
                            messages.append(
                                {
                                    "role": "user",
                                    "parts": [
                                        {"text": "[User is listening]" + close_context}
                                    ],
                                }
                            )
                            try:
                                closing_response = await chat_fn(messages)
                                messages.append(
                                    {
                                        "role": "model",
                                        "parts": [{"text": closing_response}],
                                    }
                                )
                                print(f"[Agent] {closing_response}")
                                print(f"        [Stage: close]")
                                print()
                            except Exception as e:
                                print(f"[Error getting closing: {e}]")
                            print("[Call ended]")
                            break

                # Check if call should end (for cases where we started in CLOSE)
                if current_stage == CallStage.CLOSE:
                    print("[Call ended]")
                    break

            except Exception as e:
                print(f"[Error] {e}")
                print()

    except KeyboardInterrupt:
        print("\n[Test ended]")
    except Exception as e:
        print(f"[Error] {e}")


if __name__ == "__main__":
    asyncio.run(test_agent_locally())
