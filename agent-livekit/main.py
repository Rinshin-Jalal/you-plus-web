"""
YOU+ Future Self Agent - LiveKit Agents SDK
=============================================

A voice-first accountability agent that talks to users as their "Future Self".
Uses LiveKit Agents for real-time voice conversations.

Multi-Agent Architecture:
- FutureYouAgent: Main speaking agent (talks to user)
- Background analyzers: Excuse detection, sentiment analysis, commitment extraction

DEPLOYMENT:
  python main.py dev       # Run in development mode
  python main.py start     # Run in production mode

TESTING:
  Connect to LiveKit room with metadata: {"user_id": "uuid"}

This module is the entry point for the LiveKit agent.
"""

import os
import sys
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from dotenv import load_dotenv

load_dotenv()

from loguru import logger
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, AgentSession
from livekit.plugins import silero, deepgram, cartesia

from core.agent import FutureYouAgent
from core.handlers.session import handle_session


def validate_environment():
    """
    Validate required environment variables at startup.
    Logs warnings for missing optional vars, errors for required ones.
    """
    required_vars = {
        "LIVEKIT_URL": "Required for LiveKit connection",
        "LIVEKIT_API_KEY": "Required for LiveKit authentication",
        "LIVEKIT_API_SECRET": "Required for LiveKit authentication",
        "BEDROCK_API_KEY": "Required for LLM inference",
    }

    optional_vars = {
        "CARTESIA_API_KEY": "Required for text-to-speech and speech-to-text",
        "SUPABASE_URL": "Required for user data persistence",
        "SUPABASE_SERVICE_KEY": "Required for user data persistence",
        "SUPERMEMORY_API_KEY": "Optional - enables memory features",
    }

    missing_required = []

    for var, description in required_vars.items():
        if not os.getenv(var):
            logger.error(f"Missing required env var: {var} - {description}")
            missing_required.append(var)

    for var, description in optional_vars.items():
        if not os.getenv(var):
            logger.warning(f"Missing optional env var: {var} - {description}")

    if missing_required:
        logger.error(
            f"Cannot start: missing required environment variables: {missing_required}"
        )
        raise EnvironmentError(
            f"Missing required environment variables: {missing_required}"
        )

    logger.info("Environment validation passed")


def prewarm(proc: JobProcess):
    """
    Prewarm function called when the worker starts.
    Used to load models that are slow to initialize.
    """
    logger.info("Prewarming: Loading VAD model...")
    proc.userdata["vad"] = silero.VAD.load()
    logger.info("Prewarm complete")


async def entrypoint(ctx: JobContext):
    """
    Main entrypoint for each job (voice session).
    Called when a participant joins a room that matches our dispatch rules.
    """
    logger.info(f"Job started: room={ctx.room.name}")

    # Connect to the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for a participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Handle the voice session
    await handle_session(ctx, participant)


if __name__ == "__main__":
    # Validate environment before starting
    validate_environment()

    logger.info("Starting Future Self Agent (LiveKit)...")
    logger.info(
        "Agents: FutureYou (speaking) + Excuse, Sentiment, Commitment, Promise, Quote (background)"
    )

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
