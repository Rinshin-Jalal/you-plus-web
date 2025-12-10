"""
Call analytics saving and retrieval.
"""

import os
import aiohttp
from typing import Optional

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


async def save_call_analytics(
    call_summary, transcript_summary: Optional[str] = None
) -> bool:
    """
    Save call analytics to database for insights and tracking.

    Args:
        call_summary: CallSummary event from CallSummaryAggregator
        transcript_summary: Optional human-readable summary of the call

    Returns:
        True if saved successfully, False otherwise
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot save call analytics")
        return False

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "user_id": call_summary.user_id,
                "call_type": call_summary.call_type,
                "mood": call_summary.mood,
                "call_duration_seconds": call_summary.call_duration_seconds,
                "call_quality_score": call_summary.call_quality_score,
                "promise_kept": call_summary.promise_kept,
                "tomorrow_commitment": call_summary.tomorrow_commitment,
                "commitment_time": call_summary.commitment_time,
                "commitment_is_specific": call_summary.commitment_is_specific,
                "sentiment_trajectory": call_summary.sentiment_trajectory,
                "excuses_detected": call_summary.excuses_detected,
                "quotes_captured": call_summary.quotes_captured,
            }

            # Add transcript summary if provided
            if transcript_summary:
                payload["transcript_summary"] = transcript_summary

            async with session.post(
                f"{SUPABASE_URL}/rest/v1/call_analytics",
                json=payload,
                headers=headers,
            ) as resp:
                if resp.status in (200, 201):
                    print(f"📊 Saved call analytics for {call_summary.user_id}")
                    return True
                else:
                    print(f"⚠️ Failed to save call analytics: {resp.status}")
                    return False

    except Exception as e:
        print(f"❌ Failed to save call analytics: {e}")
        return False
