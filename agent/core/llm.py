"""
LLM Client for Background Agents
================================

Uses Groq's GPT-OSS-Safeguard-20B for fast, cheap inference on:
- Excuse detection
- Sentiment analysis
- Commitment extraction
- Promise detection
- Stage/turn detection

This is separate from the main speaking agent (which uses GPT-OSS-120B).
"""

import os
import json
import aiohttp
from typing import Optional
from pathlib import Path
from loguru import logger

# Load .env from agent directory
from dotenv import load_dotenv

AGENT_DIR = Path(__file__).parent.parent
load_dotenv(AGENT_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "openai/gpt-oss-safeguard-20b"  # Fast, cheap for background analysis
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Default max tokens - enough for most JSON responses
DEFAULT_MAX_TOKENS = 512


async def llm_analyze(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.0,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> Optional[str]:
    """
    Quick LLM call for analysis tasks.

    Args:
        prompt: The user message/query
        system_prompt: Optional system instructions
        temperature: 0.0 for deterministic, higher for creative
        max_tokens: Max response length

    Returns:
        LLM response text or None on error
    """
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set, LLM analysis disabled")
        return None

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

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
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    error = await resp.text()
                    logger.error(f"Groq API error {resp.status}: {error}")
                    return None
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return None


async def llm_json(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.0,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> Optional[dict]:
    """
    LLM call that expects JSON response.

    Args:
        prompt: The user message/query (should ask for JSON)
        system_prompt: Optional system instructions
        temperature: 0.0 for deterministic
        max_tokens: Max response length

    Returns:
        Parsed JSON dict or None on error
    """
    response = await llm_analyze(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    if not response:
        return None

    # Try to parse JSON from response
    try:
        # Handle markdown code blocks
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]

        return json.loads(response.strip())
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse LLM JSON response: {e}")
        logger.debug(f"Raw response: {response}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# SPECIALIZED ANALYSIS FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

EXCUSE_SYSTEM = """You analyze user responses in an accountability call to detect excuses.

Respond with JSON only:
{
  "has_excuse": true/false,
  "excuse_text": "the excuse they gave" or null,
  "excuse_type": "too_tired|no_time|busy|forgot|sick|work|tomorrow|stressed|family|weather|traffic|other" or null,
  "confidence": 0.0-1.0
}

An excuse is when someone explains why they DIDN'T do something they committed to.
NOT an excuse: positive responses, questions, or unrelated statements."""


async def analyze_excuse(
    user_text: str, favorite_excuse: Optional[str] = None
) -> Optional[dict]:
    """
    Detect if user is making an excuse.

    Returns:
        {has_excuse, excuse_text, excuse_type, confidence, matches_favorite}
    """
    prompt = f'User said: "{user_text}"'
    if favorite_excuse:
        prompt += f'\n\nNote: Their known favorite excuse is: "{favorite_excuse}"'

    result = await llm_json(prompt, EXCUSE_SYSTEM)

    if result and result.get("has_excuse"):
        # Check if matches favorite
        if favorite_excuse and result.get("excuse_text"):
            excuse_lower = result["excuse_text"].lower()
            fav_lower = favorite_excuse.lower()
            result["matches_favorite"] = (
                fav_lower in excuse_lower or excuse_lower in fav_lower
            )
        else:
            result["matches_favorite"] = False

    return result


SENTIMENT_SYSTEM = """You analyze user sentiment in an accountability call.

Respond with JSON only:
{
  "sentiment": "positive|negative|neutral|frustrated|defensive|vulnerable|breakthrough",
  "confidence": 0.0-1.0,
  "energy": "high|medium|low"
}

Sentiment meanings:
- positive: engaged, happy, proud
- negative: sad, disappointed in self
- neutral: flat, just answering
- frustrated: annoyed at the call/caller
- defensive: deflecting, making excuses, avoiding
- vulnerable: opening up, being honest about struggles
- breakthrough: having a realization, moment of clarity"""


async def analyze_sentiment(user_text: str) -> Optional[dict]:
    """
    Analyze user's emotional state.

    Returns:
        {sentiment, confidence, energy}
    """
    prompt = f'User said: "{user_text}"'
    return await llm_json(prompt, SENTIMENT_SYSTEM)


COMMITMENT_SYSTEM = """You extract commitments from user responses in an accountability call.

Respond with JSON only:
{
  "has_commitment": true/false,
  "commitment_text": "what they committed to" or null,
  "action": "the specific action" or null,
  "time": "when they'll do it" or null,
  "is_specific": true/false (has both action AND time)
}

A commitment is a promise to do something in the future.
Look for: "I will", "I'll", "I promise", "tomorrow", specific times like "7am", "at night"."""


async def analyze_commitment(user_text: str) -> Optional[dict]:
    """
    Extract tomorrow's commitment from user response.

    Returns:
        {has_commitment, commitment_text, action, time, is_specific}
    """
    prompt = f'User said: "{user_text}"'
    return await llm_json(prompt, COMMITMENT_SYSTEM)


PROMISE_SYSTEM = """You detect if user answered YES or NO to "did you do it?" in an accountability call.

Respond with JSON only:
{
  "answered": true/false,
  "kept_promise": true/false/null,
  "response_type": "yes|no|dodge|unclear",
  "excuse": "if no, what excuse did they give" or null,
  "confidence": 0.0-1.0
}

YES indicators: "yes", "yeah", "I did", "done", "completed", "absolutely"
NO indicators: "no", "didn't", "couldn't", "not yet", "failed"
DODGE: avoiding the question, changing subject, vague answers like "kind of", "sort of"."""


async def analyze_promise(
    user_text: str, conversation_context: Optional[str] = None
) -> Optional[dict]:
    """
    Detect if user kept their promise (yes/no to accountability question).

    Returns:
        {answered, kept_promise, response_type, excuse, confidence}
    """
    prompt = f'User said: "{user_text}"'
    if conversation_context:
        prompt = f"Context: {conversation_context}\n\n{prompt}"
    return await llm_json(prompt, PROMISE_SYSTEM)


QUOTE_SYSTEM = """You identify memorable/powerful quotes from user responses in an accountability call.

Respond with JSON only:
{
  "is_memorable": true/false,
  "quote_type": "vulnerability|breakthrough|commitment|fear|none",
  "quote_text": "the powerful part" or null,
  "callback_potential": "high|medium|low"
}

Memorable quotes are:
- vulnerability: admitting fears, struggles, past failures
- breakthrough: realizations, "I finally understand", clarity moments  
- commitment: strong promises with emotional weight
- fear: expressing what they're afraid of, what they'd lose

Short "yes/no" responses are NOT memorable."""


async def analyze_quote(user_text: str) -> Optional[dict]:
    """
    Check if user said something memorable worth saving for callbacks.

    Returns:
        {is_memorable, quote_type, quote_text, callback_potential}
    """
    if len(user_text.split()) < 5:  # Too short to be memorable
        return {
            "is_memorable": False,
            "quote_type": "none",
            "quote_text": None,
            "callback_potential": "low",
        }

    prompt = f'User said: "{user_text}"'
    return await llm_json(prompt, QUOTE_SYSTEM)


STAGE_SYSTEM = """You track conversation stage in an accountability call.

The stages are:
1. hook - Opening, building rapport (1-2 turns)
2. accountability - Asking "did you do it?" and getting answer (1-2 turns)
3. dig_deeper - Following up on their answer (2-3 turns)
4. emotional_peak - Creating impact moment (1 turn)
5. tomorrow_lock - Getting specific commitment for tomorrow (1-2 turns)
6. close - Ending the call (1 turn)

Respond with JSON only:
{
  "current_stage": "hook|accountability|dig_deeper|emotional_peak|tomorrow_lock|close",
  "should_advance": true/false,
  "next_stage": "the next stage" or null,
  "reason": "why advance or stay"
}"""


async def analyze_stage(
    user_text: str,
    current_stage: str,
    turn_count: int,
    got_promise_answer: bool = False,
    got_commitment: bool = False,
) -> Optional[dict]:
    """
    Determine if conversation should advance to next stage.

    Returns:
        {current_stage, should_advance, next_stage, reason}
    """
    prompt = f"""Current stage: {current_stage}
Turn count in this stage: {turn_count}
Got promise answer (yes/no): {got_promise_answer}
Got tomorrow commitment: {got_commitment}

User just said: "{user_text}"

Should we advance to the next stage?"""

    return await llm_json(prompt, STAGE_SYSTEM)
