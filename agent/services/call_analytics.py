"""
Call analytics saving and retrieval.

This module sends call data to the backend webhook, which then:
1. Saves analytics to the database
2. Updates user streak and status
3. Triggers gamification (XP, achievements)
4. Emits secondary events (promise.kept, streak.updated, etc.)
"""

import os
import uuid
import aiohttp
from typing import Optional

# Backend webhook URL - the central event-driven backend
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8787")


async def save_call_analytics(
    call_summary, transcript_summary: Optional[str] = None
) -> bool:
    """
    Send call analytics to the backend webhook for processing.

    The backend will:
    - Save to call_analytics table
    - Update user status (streak, total calls, last_call_at)
    - Award XP via gamification handlers
    - Check for achievements
    - Emit secondary events (promise.kept/broken, streak.updated)

    Args:
        call_summary: CallSummary event from CallSummaryAggregator
        transcript_summary: Optional human-readable summary of the call

    Returns:
        True if sent successfully, False otherwise
    """
    webhook_url = f"{BACKEND_URL}/webhook/call/completed"

    try:
        # Build payload matching the CallCompletedSchema in backend
        payload = {
            "user_id": call_summary.user_id,
            "call_id": str(uuid.uuid4()),  # Generate unique call ID
            "call_duration_seconds": call_summary.call_duration_seconds,
            "promise_kept": call_summary.promise_kept,
            "tomorrow_commitment": call_summary.tomorrow_commitment,
            "commitment_time": call_summary.commitment_time,
            "commitment_is_specific": call_summary.commitment_is_specific,
            "sentiment_trajectory": call_summary.sentiment_trajectory,
            "excuses_detected": call_summary.excuses_detected,
            "quotes_captured": call_summary.quotes_captured,
            "call_type": call_summary.call_type,
            "mood": call_summary.mood,
            "call_quality_score": call_summary.call_quality_score,
        }

        # Add transcript summary if provided (backend can store this too)
        if transcript_summary:
            payload["transcript_summary"] = transcript_summary

        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(
                        f"📊 Call analytics sent to backend for {call_summary.user_id}"
                    )
                    print(f"   Event type: {result.get('eventType', 'unknown')}")
                    return True
                else:
                    error_text = await resp.text()
                    print(f"⚠️ Backend webhook failed: {resp.status} - {error_text}")
                    return False

    except aiohttp.ClientError as e:
        print(f"❌ Failed to connect to backend webhook: {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to send call analytics: {e}")
        return False


async def notify_call_started(user_id: str, call_id: str) -> bool:
    """
    Notify the backend that a call has started.

    Args:
        user_id: The user's ID
        call_id: Unique identifier for this call

    Returns:
        True if sent successfully, False otherwise
    """
    webhook_url = f"{BACKEND_URL}/webhook/call/started"

    try:
        payload = {
            "user_id": user_id,
            "call_id": call_id,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status == 200:
                    print(f"📞 Call started notification sent for {user_id}")
                    return True
                else:
                    print(f"⚠️ Call started webhook failed: {resp.status}")
                    return False

    except Exception as e:
        print(f"❌ Failed to send call started notification: {e}")
        return False


async def notify_call_missed(user_id: str, scheduled_for: Optional[str] = None) -> bool:
    """
    Notify the backend that a scheduled call was missed.

    Args:
        user_id: The user's ID
        scheduled_for: When the call was scheduled (ISO timestamp)

    Returns:
        True if sent successfully, False otherwise
    """
    webhook_url = f"{BACKEND_URL}/webhook/call/missed"

    try:
        payload = {
            "user_id": user_id,
        }
        if scheduled_for:
            payload["scheduled_for"] = scheduled_for

        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status == 200:
                    print(f"📵 Call missed notification sent for {user_id}")
                    return True
                else:
                    print(f"⚠️ Call missed webhook failed: {resp.status}")
                    return False

    except Exception as e:
        print(f"❌ Failed to send call missed notification: {e}")
        return False
