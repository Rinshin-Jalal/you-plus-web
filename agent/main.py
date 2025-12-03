"""
YOU+ Future Self Agent - Cartesia Line SDK
============================================

A voice-first accountability agent that calls users as their "Future Self".
Uses Cartesia Line SDK for real phone calls with voice cloning.

DEPLOYMENT:
  cartesia auth login
  cartesia deploy

TESTING:
  cartesia call +1XXXXXXXXXX --metadata '{"user_id": "uuid"}'
"""

import os
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

from chat_node import FutureYouNode
from config import build_system_prompt, build_first_message, fetch_user_context
from google import genai

from line import Bridge, CallRequest, VoiceAgentApp, VoiceAgentSystem
from line.events import (
    UserStartedSpeaking,
    UserStoppedSpeaking,
    UserTranscriptionReceived,
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    gemini_client = None

# Default voice (fallback if user has no clone)
# NOTE: Voice ID is configured in Cartesia dashboard, not passed to with_speaking_node()
DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091"


async def handle_new_call(system: VoiceAgentSystem, call_request: CallRequest):
    """Handle an incoming call and set up the Future Self agent."""

    # Extract user_id from call metadata (passed via outbound API)
    metadata = call_request.metadata or {}
    user_id = metadata.get("user_id", "unknown")

    print(f"📞 Incoming call for user: {user_id}")

    # Fetch user's context from database
    user_context = await fetch_user_context(user_id)

    # Get user's cloned voice ID (for logging - voice is configured in Cartesia dashboard)
    identity = user_context.get("identity", {})
    voice_id = identity.get("cartesia_voice_id")
    if voice_id:
        print(f"🎤 User has cloned voice: {voice_id}")

    # Build personalized system prompt
    system_prompt = build_system_prompt(user_context)

    # Create the conversation node
    conversation_node = FutureYouNode(
        system_prompt=system_prompt,
        gemini_client=gemini_client,
        user_id=user_id,
        user_context=user_context,
    )

    # Set up the bridge for event handling
    conversation_bridge = Bridge(conversation_node)
    system.with_speaking_node(conversation_node, bridge=conversation_bridge)

    # Wire up events
    conversation_bridge.on(UserTranscriptionReceived).map(conversation_node.add_event)

    (
        conversation_bridge.on(UserStoppedSpeaking)
        .interrupt_on(
            UserStartedSpeaking, handler=conversation_node.on_interrupt_generate
        )
        .stream(conversation_node.generate)
        .broadcast()
    )

    # Start the call
    await system.start()

    # Send the personalized first message
    first_message = build_first_message(user_context)
    await system.send_initial_message(first_message)

    # Wait for the call to end
    await system.wait_for_shutdown()

    # Report call result to backend
    await conversation_node.report_call_result()


app = VoiceAgentApp(handle_new_call)

if __name__ == "__main__":
    print("🚀 Starting Future Self Agent...")
    print("📞 Deploy with: cartesia deploy")
    print("🧪 Test with: cartesia call +1XXXXXXXXXX")
    app.run()
