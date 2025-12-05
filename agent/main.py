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

import sys
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from dotenv import load_dotenv

load_dotenv()

from loguru import logger

from line import VoiceAgentApp

from core.handlers.pre_call import handle_call_request
from core.handlers.call import handle_new_call


# Create the Voice Agent App
app = VoiceAgentApp(call_handler=handle_new_call, pre_call_handler=handle_call_request)


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Future Self Agent (Multi-Agent Mode)...")
    logger.info(
        "Agents: FutureYou (speaking) + Excuse, ExcuseCallout, Sentiment, Commitment, Promise, Pattern, Quote (background)"
    )
    uvicorn.run(app, host="0.0.0.0", port=8000)
