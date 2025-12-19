import os
os.environ['LIVEKIT_URL'] = 'wss://test.livekit.cloud'
os.environ['LIVEKIT_API_KEY'] = 'test_key'
os.environ['LIVEKIT_API_SECRET'] = 'test_secret'

from livekit.agents import Agent
from livekit.plugins import silero

print("✅ All imports successful!")
print(f"Agent class: {Agent}")
print(f"Silero VAD: {silero.VAD}")
