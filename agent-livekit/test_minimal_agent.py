from livekit.agents import Agent
from livekit.plugins import silero, deepgram, cartesia, openai

class TestAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="You are a test agent",
            stt=deepgram.STT(model="nova-2"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=cartesia.TTS(),
            vad=silero.VAD.load(),
        )

print("✅ Creating agent...")
agent = TestAgent()
print(f"✅ Agent created successfully: {agent}")
print(f"   Instructions: {agent.instructions[:50]}...")
