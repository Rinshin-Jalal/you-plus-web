"""
LLM Analysis Functions
======================

Background analysis functions for:
- Excuse detection
- Sentiment analysis
- Commitment extraction
- Promise detection
- Stage/turn detection

Uses the shared LLM client from core.llm_client.
"""

import json
from typing import Optional

from loguru import logger

# Import the shared LLM client (fast_call for quick analysis tasks)
from core.llm_client import fast_call

# Default max tokens - enough for most JSON responses
DEFAULT_MAX_TOKENS = 512


async def llm_analyze(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.0,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> Optional[str]:
    """
    Quick LLM call for analysis tasks using fast 20B model.
    Used for: stage transitions, excuse detection, sentiment, etc.

    Args:
        prompt: The user message/query
        system_prompt: Optional system instructions
        temperature: 0.0 for deterministic, higher for creative
        max_tokens: Max response length

    Returns:
        LLM response text or None on error
    """
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        result = await fast_call(  # Use fast model for analysis
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=5,  # Faster timeout for quick analysis
        )
        return result.strip() if result else None
    except Exception as e:
        logger.error(f"Fast LLM call failed: {e}")
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
