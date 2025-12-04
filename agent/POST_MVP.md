# Agent Post-MVP Features

Future enhancements after core agent is stable.

---

## Event Transformation & Chained Processing

Reference: [Cartesia Docs - Event Transformation](https://docs.cartesia.ai/line/agent-patterns/event-transformation)

### Promise Detection Pipeline

Transform `UserTranscriptionReceived` → `PromiseResponse` event:

```python
class PromiseResponse(BaseModel):
    kept: bool | None
    excuse_detected: str | None
    confidence: float

def detect_promise_response(message) -> PromiseResponse:
    text = message.event.content.lower()
    
    if any(w in text for w in ["yes", "yeah", "did it", "completed"]):
        return PromiseResponse(kept=True, excuse_detected=None, confidence=0.9)
    elif any(w in text for w in ["no", "didn't", "couldn't"]):
        excuse = detect_known_excuse(text, user_context)
        return PromiseResponse(kept=False, excuse_detected=excuse, confidence=0.9)
    
    return PromiseResponse(kept=None, excuse_detected=None, confidence=0.5)

bridge.on(UserTranscriptionReceived)
    .map(detect_promise_response)
    .broadcast()
```

### Excuse Detection & Callout

Chain processing to detect and respond to excuses in real-time:

```python
bridge.on(UserTranscriptionReceived)
    .map(detect_promise_response)
    .filter(lambda p: p.excuse_detected)
    .map(trigger_excuse_callout)  # "That's your favorite excuse..."
    .broadcast()
```

### Sentiment Analysis

Real-time sentiment tracking during calls:

- Detect frustration/deflection patterns
- Adjust agent tone dynamically based on user state
- Log sentiment trajectory for call analytics

```python
class SentimentAnalysis(BaseModel):
    sentiment: str  # positive, negative, neutral, frustrated, deflecting
    confidence: float
    timestamp: datetime

bridge.on(UserTranscriptionReceived)
    .map(analyze_sentiment)
    .broadcast()

# React to frustration
bridge.on(SentimentAnalysis)
    .filter(lambda s: s.sentiment == "frustrated" and s.confidence > 0.8)
    .map(adjust_agent_tone)
```

### Call Summarization (Aggregation)

Aggregate all call events into `CallSummary` at end of call:

```python
class CallSummary(BaseModel):
    user_id: str
    kept_promise: bool | None
    tomorrow_commitment: str | None
    call_duration_seconds: int
    sentiment_trajectory: list[str]
    key_topics: list[str]

class CallAggregator:
    def __init__(self):
        self.events = []
    
    def aggregate(self, message):
        self.events.append(message.event)
        
        if isinstance(message.event, EndCall):
            return CallSummary(
                user_id=self.user_id,
                kept_promise=self._extract_promise_result(),
                tomorrow_commitment=self._extract_commitment(),
                call_duration_seconds=self._calculate_duration(),
                sentiment_trajectory=self._get_sentiments(),
                key_topics=self._extract_topics(),
            )
        return None

bridge.on([UserTranscriptionReceived, SentimentAnalysis, EndCall])
    .map(aggregator.aggregate)
    .filter(lambda s: s is not None)
    .broadcast()
```

### Multi-Stage Commitment Validation

Chain validators for commitment extraction:

```python
def extract_commitment(message):
    # Parse user's statement for time/action
    return Commitment(
        action=extract_action(message),
        time=extract_time(message),
        is_specific=has_time_and_action(message),
    )

def validate_commitment(commitment):
    # Ensure commitment is achievable
    commitment.is_valid = (
        commitment.is_specific and
        is_reasonable_time(commitment.time) and
        is_actionable(commitment.action)
    )
    return commitment

bridge.on(UserStoppedSpeaking)
    .map(extract_commitment)
    .filter(lambda c: c.is_specific)
    .map(validate_commitment)
    .filter(lambda c: c.is_valid)
    .broadcast(CommitmentConfirmed)
```

---

## Dynamic Voice Controls

### Experimental Emotion/Speed Controls

```python
return PreCallResult(
    metadata={"user_id": user_id, "user_context": user_context},
    config={
        "tts": {
            "voice": voice_id,
            "language": "en",
            "__experimental_controls": {
                "speed": "normal",
                "emotion": ["positivity:low"]  # Stern accountability tone
            }
        }
    },
)
```

### Language Support

Store user's preferred language in identity and use dynamically:

```python
identity = user_context.get("identity", {})
voice_id = identity.get("cartesia_voice_id") or DEFAULT_VOICE_ID
language = identity.get("preferred_language", "en")

return PreCallResult(
    config={
        "tts": {
            "voice": voice_id,
            "language": language,
        }
    },
)
```

---

## Call Rejection Logic

Add validation in `pre_call_handler`:

```python
async def handle_call_request(call_request: CallRequest):
    metadata = call_request.metadata or {}
    user_id = metadata.get("user_id")
    
    # Reject if no user_id
    if not user_id or user_id == "unknown":
        logger.warning("Rejecting call: no user_id")
        return None
    
    user_context = await fetch_user_context(user_id)
    
    # Reject if user doesn't exist
    if not user_context.get("identity"):
        logger.warning(f"Rejecting call: user {user_id} not found")
        return None
    
    # Reject if subscription expired
    identity_status = user_context.get("identity_status", {})
    if identity_status.get("subscription_status") == "expired":
        logger.warning(f"Rejecting call: user {user_id} subscription expired")
        return None
    
    # Reject if user paused calls
    if identity_status.get("calls_paused"):
        logger.warning(f"Rejecting call: user {user_id} paused calls")
        return None
    
    # Proceed with call
    voice_id = user_context.get("identity", {}).get("cartesia_voice_id") or DEFAULT_VOICE_ID
    
    return PreCallResult(
        metadata={"user_id": user_id, "user_context": user_context},
        config={"tts": {"voice": voice_id, "language": "en"}},
    )
```

---

## Analytics & Observability

### Custom Event Logging

```python
from line.user_bridge import register_observability_event

# Register custom events for logging
register_observability_event(bridge, harness, PromiseResponse)
register_observability_event(bridge, harness, SentimentAnalysis)
register_observability_event(bridge, harness, CallSummary)
```

### Metrics

```python
# Log metrics during call
await harness.log_metric("promise_kept", True)
await harness.log_metric("call_duration_seconds", 120)
await harness.log_metric("sentiment_score", 0.7)
```

---

## Priority Order

1. **Call Rejection Logic** - Prevent wasted calls
2. **Promise Detection Pipeline** - Better tracking
3. **Call Summarization** - Analytics
4. **Sentiment Analysis** - Adaptive responses
5. **Voice Controls** - Tone customization
6. **Language Support** - International users
