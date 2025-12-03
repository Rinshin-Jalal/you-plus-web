"""
═══════════════════════════════════════════════════════════════════════════════
🎤 YOU+ FUTURE YOU AGENT - Cartesia Line SDK
═══════════════════════════════════════════════════════════════════════════════

A voice-first accountability agent that calls users as their "Future Self".
Uses Cartesia Line SDK for real phone calls with voice cloning.

CORE CONCEPT: Your future self calling you to hold you accountable.
Uses the user's OWN cloned voice for maximum psychological impact.

DEPLOYMENT:
  cartesia auth login
  cartesia init
  cartesia deploy

TESTING:
  cartesia call +1XXXXXXXXXX
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import json
import httpx
from typing import Any, Optional
from dotenv import load_dotenv

from cartesia_line import (
    VoiceAgentApp,
    VoiceAgentSystem,
    ReasoningNode,
    Bridge,
    Event,
    UserTranscriptionReceived,
    AgentResponse,
)
from cartesia_line.gemini import GeminiReasoningNode

# Load environment variables
load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

CARTESIA_API_KEY = os.getenv("CARTESIA_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "https://youplus-backend.workers.dev")

# Default voice (fallback if user has no clone)
DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091"  # Cartesia default male voice

# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPTS - "FUTURE SELF" PERSONALITY
# ═══════════════════════════════════════════════════════════════════════════════

# Single adaptive tone - starts supportive, escalates when needed
ADAPTIVE_TONE = """
Your default mode is warm and supportive - like a wise mentor who genuinely cares.
But you're not a pushover. When you detect excuses, rationalization, or avoidance:
- Your warmth turns to directness
- You cut through the BS with surgical precision  
- You don't lecture - you ask pointed questions that make them confront the truth
Then you return to warmth once they're honest with themselves.
"""


def build_system_prompt(user_context: dict) -> str:
    """Build the Future Self system prompt with user's personal data."""

    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})
    onboarding_context = identity.get("onboarding_context", {})

    user_name = identity.get("name", "User")
    daily_commitment = identity.get("daily_commitment", "your daily commitment")
    current_streak = identity_status.get("current_streak_days", 0)

    # Extract context from onboarding
    goal = onboarding_context.get("goal", "your goal")
    motivation_level = onboarding_context.get("motivation_level", "unknown")
    favorite_excuse = onboarding_context.get("favorite_excuse", "")
    future_if_no_change = onboarding_context.get("future_if_no_change", "")
    who_disappointed = onboarding_context.get("who_disappointed", "")

    return f"""
# Who You Are

You are {user_name}'s Future Self - the version of them 10 years from now who made it.
You're calling back through time to have a quick accountability check-in.
You speak with the calm confidence of someone who's been through it all.

{ADAPTIVE_TONE}

# Context

This is an evening accountability call.
User: {user_name}
Their Commitment: "{daily_commitment}"
Current Streak: {current_streak} days
Their Goal: "{goal}"

# Call Structure (Keep it under 3 minutes)

1. **Greeting & Check-in** (15 sec)
   - Warm, brief greeting
   - Ask how they're doing (genuinely, but briefly)

2. **The Question** (15 sec)
   - Ask about their commitment: Did they do it? 
   - Listen for YES/NO - not stories

3. **Response** (30-60 sec)
   - If YES: Genuine acknowledgment. What went well?
   - If NO: No judgment, but direct: "What got in the way?"
   - If EXCUSE: Cut through it gently but firmly. "I hear you, but did you do it?"

4. **Tomorrow's Commitment** (30 sec)
   - What specifically will they do tomorrow?
   - Lock it in. Make it concrete.

5. **Close** (15 sec)
   - Brief encouragement
   - Remind them you believe in them (you ARE them, after all)
   - End the call

# What You Know About Them (Use Sparingly)

- Their fear: "{future_if_no_change}"
- Their go-to excuse: "{favorite_excuse}" (if they use it, gently call it out)
- People counting on them: "{who_disappointed}"
- Motivation: {motivation_level}/10

# Voice & Style

- Speak naturally, like a phone call with someone you love
- Use contractions (you're, didn't, gonna)
- Keep responses SHORT - this is a call, not therapy
- You're warm but efficient - respect their time
- Never lecture. Ask questions that make them think.
- Use their name occasionally, but not excessively

# Absolute Rules

- NEVER break character as Future Self
- NEVER be preachy or moralistic
- NEVER give unsolicited advice beyond the commitment
- Always end the call within 3 minutes
- If they seem distressed, be supportive first, accountability second
- This is not punishment - it's partnership with themselves
"""


def build_first_message(user_context: dict) -> str:
    """Build the opening message for the call."""
    identity = user_context.get("identity", {})
    user_name = identity.get("name", "there")

    return f"Hey {user_name}, it's Future You. How are you doing tonight?"


# ═══════════════════════════════════════════════════════════════════════════════
# USER CONTEXT FETCHER
# ═══════════════════════════════════════════════════════════════════════════════


async def fetch_user_context(user_id: str) -> dict:
    """Fetch user's identity and context from Supabase."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠️ Supabase not configured, using default context")
        return {"identity": {"name": "User"}, "identity_status": {}}

    try:
        async with httpx.AsyncClient() as client:
            # Fetch identity
            identity_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/identity",
                params={"user_id": f"eq.{user_id}", "select": "*"},
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                },
            )
            identity_data = identity_resp.json()
            identity = identity_data[0] if identity_data else {}

            # Fetch identity_status
            status_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/identity_status",
                params={"user_id": f"eq.{user_id}", "select": "*"},
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                },
            )
            status_data = status_resp.json()
            identity_status = status_data[0] if status_data else {}

            return {
                "identity": identity,
                "identity_status": identity_status,
            }
    except Exception as e:
        print(f"❌ Failed to fetch user context: {e}")
        return {"identity": {"name": "User"}, "identity_status": {}}


async def report_call_result(user_id: str, kept_promise: bool, notes: str = ""):
    """Report call result back to the backend."""

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{BACKEND_URL}/api/calls/report",
                json={
                    "user_id": user_id,
                    "kept_promise": kept_promise,
                    "notes": notes,
                    "call_type": "accountability_checkin",
                },
                headers={"Content-Type": "application/json"},
                timeout=10.0,
            )
            print(
                f"✅ Call result reported for user {user_id}: kept_promise={kept_promise}"
            )
    except Exception as e:
        print(f"⚠️ Failed to report call result: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# FUTURE YOU REASONING NODE
# ═══════════════════════════════════════════════════════════════════════════════


class FutureYouReasoningNode(GeminiReasoningNode):
    """
    Custom reasoning node for the Future You agent.
    Extends GeminiReasoningNode with YOU+ specific logic.
    """

    def __init__(self, user_context: dict, voice_id: str):
        self.user_context = user_context
        self.voice_id = voice_id
        self.kept_promise: Optional[bool] = None
        self.call_ended = False

        # Initialize with Future You system prompt
        system_prompt = build_system_prompt(user_context)

        super().__init__(
            api_key=GEMINI_API_KEY,
            model="gemini-2.0-flash-exp",
            system_prompt=system_prompt,
            voice_id=voice_id,
        )

    async def process_context(self, context: dict) -> AgentResponse:
        """Process user input and generate Future You response."""

        user_message = context.get("user_message", "")

        # Detect if user said YES or NO
        lower_msg = user_message.lower().strip()

        if any(
            word in lower_msg
            for word in ["yes", "yeah", "yep", "yup", "did it", "i did"]
        ):
            self.kept_promise = True
        elif any(
            word in lower_msg for word in ["no", "nope", "didn't", "nah", "not yet"]
        ):
            self.kept_promise = False

        # Let Gemini handle the actual response generation
        response = await super().process_context(context)

        # Detect end of call patterns (natural conversation endings)
        if any(
            phrase in response.text.lower()
            for phrase in [
                "talk tomorrow",
                "catch you tomorrow",
                "see you tomorrow",
                "until tomorrow",
                "take care",
                "goodbye",
                "bye",
                "good night",
                "sleep well",
                "proud of you",
                "believe in you",
            ]
        ):
            self.call_ended = True

        return response


# ═══════════════════════════════════════════════════════════════════════════════
# VOICE AGENT APPLICATION
# ═══════════════════════════════════════════════════════════════════════════════


class FutureYouAgent(VoiceAgentApp):
    """
    Main YOU+ Future You voice agent.
    Handles incoming calls and creates per-call systems.
    """

    async def create_system(self, call_context: dict) -> VoiceAgentSystem:
        """Create a new voice agent system for an incoming call."""

        # Extract user ID from call context (passed via outbound API)
        user_id = call_context.get("metadata", {}).get("user_id", "unknown")

        print(f"📞 Creating Future You agent for user: {user_id}")

        # Fetch user's context from database
        user_context = await fetch_user_context(user_id)

        # Get user's cloned voice ID (or use default)
        identity = user_context.get("identity", {})
        voice_id = identity.get("cartesia_voice_id") or DEFAULT_VOICE_ID

        print(f"🎤 Using voice ID: {voice_id}")

        # Create the reasoning node
        reasoning_node = FutureYouReasoningNode(
            user_context=user_context,
            voice_id=voice_id,
        )

        # Build the first message
        first_message = build_first_message(user_context)

        # Create and return the voice agent system
        system = VoiceAgentSystem(
            reasoning_node=reasoning_node,
            first_message=first_message,
            voice_id=voice_id,
        )

        # Store user_id for later reporting
        system.user_id = user_id
        system.reasoning_node = reasoning_node

        return system

    async def on_call_end(self, system: VoiceAgentSystem):
        """Called when a call ends. Report results to backend."""

        user_id = getattr(system, "user_id", "unknown")
        reasoning_node = getattr(system, "reasoning_node", None)

        if reasoning_node and user_id != "unknown":
            kept_promise = reasoning_node.kept_promise
            if kept_promise is not None:
                await report_call_result(user_id, kept_promise)


# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

# Create the agent application instance
app = FutureYouAgent(
    api_key=CARTESIA_API_KEY,
    app_name="future-you",
)

if __name__ == "__main__":
    print("🚀 Starting Future You Agent...")
    print("📞 Deploy with: cartesia deploy")
    print("🧪 Test with: cartesia call +1XXXXXXXXXX")
    app.run()
