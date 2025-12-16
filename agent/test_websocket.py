import asyncio
import json
import logging
from urllib.parse import urlencode
import websockets

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def test_websocket_connection():
    # 1. Construct URL with query params
    base_url = "ws://localhost:8000/ws"

    # Based on VoiceAgentApp.create_chat_session and websocket_endpoint logic:
    # It expects: call_id, from, to, agent_call_id, metadata (json string)
    params = {
        "call_id": "test-call-123",
        "from": "+15550001111",
        "to": "+15550002222",
        "agent_call_id": "agent-call-test-1",
        "metadata": json.dumps({"user_id": "test_user", "env": "dev"}),
    }

    url = f"{base_url}?{urlencode(params)}"
    logger.info(f"Connecting to: {url}")

    try:
        async with websockets.connect(url) as websocket:
            logger.info("✅ Connected to WebSocket server!")

            # 2. Receive initial messages (if any) or wait for a bit
            # The agent might start speaking or log something immediately upon connection.

            # 3. Simulate User Speaking (State Change)
            logger.info("Sending: User Started Speaking")
            user_speaking_msg = {"type": "user_state", "value": "speaking"}
            await websocket.send(json.dumps(user_speaking_msg))

            await asyncio.sleep(1)  # simulate duration

            # 4. Simulate Transcription
            transcript_text = "Hello, can you hear me?"
            logger.info(f"Sending Transcription: '{transcript_text}'")
            transcription_msg = {"type": "message", "content": transcript_text}
            await websocket.send(json.dumps(transcription_msg))

            # 5. Simulate User Stopped Speaking
            logger.info("Sending: User Stopped Speaking")
            user_idle_msg = {"type": "user_state", "value": "idle"}
            await websocket.send(json.dumps(user_idle_msg))

            # 6. Listen for responses
            logger.info("Listening for responses...")
            try:
                while True:
                    # Set a timeout for receiving messages so we don't hang forever in this test
                    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(response)
                    logger.info(f"📩 Received: {data}")

                    if data.get("type") == "agent_speech":
                        logger.info(f"🗣️ Agent Speech: {data.get('content')}")

                    if data.get("type") == "end_call":
                        logger.info("Call ended by server.")
                        break

            except asyncio.TimeoutError:
                logger.info("No more messages received within timeout.")

    except ConnectionRefusedError:
        logger.error("❌ Connection refused. Is the server running on localhost:8000?")
    except Exception as e:
        logger.error(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_websocket_connection())
