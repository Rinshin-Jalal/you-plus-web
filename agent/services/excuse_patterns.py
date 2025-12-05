"""
Excuse pattern tracking and callout generation.
"""

import os
import aiohttp

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


def normalize_excuse_pattern(excuse_text: str) -> str:
    """
    Normalize an excuse to a pattern category.

    Examples:
        "I was too tired after work" -> "too_tired"
        "didn't have time yesterday" -> "no_time"
        "I forgot about it" -> "forgot"
    """
    text = excuse_text.lower()

    # Check family first (before sick, since "kids were sick" should be family)
    if "kid" in text or "family" in text or "wife" in text or "husband" in text:
        return "family"
    if "tired" in text:
        return "too_tired"
    if "time" in text and ("didn't" in text or "no " in text or "have" in text):
        return "no_time"
    if "busy" in text:
        return "busy"
    if "forgot" in text:
        return "forgot"
    if "sick" in text or "headache" in text or "ill" in text:
        return "sick"
    if "work" in text and ("late" in text or "stuck" in text or "busy" in text):
        return "work"
    if "tomorrow" in text or "next time" in text or "later" in text:
        return "tomorrow"
    if "stress" in text:
        return "stressed"
    if "weather" in text:
        return "weather"
    if "traffic" in text:
        return "traffic"

    return "other"


async def save_excuse_pattern(
    user_id: str,
    excuse_text: str,
    matches_favorite: bool,
    confidence: float,
    streak_day: int,
    call_type: str,
) -> bool:
    """
    Save a detected excuse pattern to the database.

    Args:
        user_id: User's UUID
        excuse_text: Raw text of the excuse
        matches_favorite: Whether it matches their onboarding favorite excuse
        confidence: Detection confidence (0.0-1.0)
        streak_day: Current streak day
        call_type: Type of call (audit, reflection, etc.)

    Returns:
        True if saved successfully
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot save excuse pattern")
        return False

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "user_id": user_id,
                "excuse_text": excuse_text[:500],  # Limit length
                "excuse_pattern": normalize_excuse_pattern(excuse_text),
                "matches_favorite": matches_favorite,
                "confidence": confidence,
                "streak_day": streak_day,
                "call_type": call_type,
                "was_called_out": False,  # Will be updated later if we call it out
            }

            async with session.post(
                f"{SUPABASE_URL}/rest/v1/excuse_patterns",
                json=payload,
                headers=headers,
            ) as resp:
                if resp.status in (200, 201):
                    pattern = normalize_excuse_pattern(excuse_text)
                    print(f"🎯 Saved excuse pattern '{pattern}' for {user_id}")
                    return True
                else:
                    error = await resp.text()
                    print(f"⚠️ Failed to save excuse pattern: {resp.status} - {error}")
                    return False

    except Exception as e:
        print(f"❌ Failed to save excuse pattern: {e}")
        return False


async def fetch_excuse_patterns(user_id: str) -> dict:
    """
    Fetch user's excuse patterns for callout context.

    Returns dict with:
        - patterns: List of {pattern, times_this_week, times_total, days_used, is_favorite}
        - top_excuse: Most used excuse this week
        - total_excuses_week: Total excuses this week
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, cannot fetch excuse patterns")
        return {"patterns": [], "top_excuse": None, "total_excuses_week": 0}

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            }

            # Call the stored function to get aggregated data
            async with session.post(
                f"{SUPABASE_URL}/rest/v1/rpc/get_excuse_callout_data",
                json={"p_user_id": user_id},
                headers={
                    **headers,
                    "Content-Type": "application/json",
                },
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()

                    if data:
                        total_week = sum(p.get("times_this_week", 0) for p in data)
                        top = data[0] if data else None

                        print(
                            f"📊 Found {len(data)} excuse patterns for {user_id}, {total_week} this week"
                        )

                        return {
                            "patterns": data,
                            "top_excuse": top.get("excuse_pattern") if top else None,
                            "total_excuses_week": total_week,
                        }

                # No patterns or error
                return {"patterns": [], "top_excuse": None, "total_excuses_week": 0}

    except Exception as e:
        print(f"❌ Failed to fetch excuse patterns: {e}")
        return {"patterns": [], "top_excuse": None, "total_excuses_week": 0}


def build_excuse_callout_section(excuse_data: dict) -> str:
    """
    Build a system prompt section with excuse pattern ammunition.

    This gives the AI context to call out patterns like:
    "That's the 3rd time this week you've used 'too tired'"
    """
    patterns = excuse_data.get("patterns", [])

    if not patterns:
        return ""

    lines = ["# 🎯 EXCUSE PATTERN AMMUNITION", ""]
    lines.append("Use this data to call them out when they make excuses:")
    lines.append("")

    for p in patterns[:5]:  # Top 5 patterns
        pattern = p.get("excuse_pattern", "unknown")
        times_week = p.get("times_this_week", 0)
        times_total = p.get("times_total", 0)
        days = p.get("days_used", [])
        is_fav = p.get("is_favorite", False)

        # Build the callout line
        fav_marker = " ⭐ FAVORITE" if is_fav else ""

        if times_week >= 2:
            lines.append(
                f"- **{pattern.upper()}**: Used {times_week}x THIS WEEK (days: {days}){fav_marker}"
            )
            lines.append(
                f"  → Callout: \"That's the {times_week}{'rd' if times_week == 3 else 'th'} time this week you've said '{pattern.replace('_', ' ')}'\""
            )
        elif times_total >= 3:
            lines.append(
                f"- **{pattern.upper()}**: Used {times_total}x total{fav_marker}"
            )
            lines.append(
                f"  → Callout: \"You've used '{pattern.replace('_', ' ')}' {times_total} times now. Is it ever true?\""
            )
        else:
            lines.append(f"- {pattern}: {times_total}x total{fav_marker}")

    lines.append("")
    lines.append(
        "When they make an excuse, CHECK if it matches a pattern above and CALL IT OUT."
    )
    lines.append("")

    return "\n".join(lines)
