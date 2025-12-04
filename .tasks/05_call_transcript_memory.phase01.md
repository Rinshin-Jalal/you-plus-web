# Task 05: Send Call Transcripts to Supermemory

## Objective

After each call completes, send the full transcript to Supermemory. This allows the user's profile to **evolve** based on what's learned during calls.

## Why This Matters

Currently, the user's profile is frozen at onboarding. But we learn SO much during calls:
- New excuses they make
- How they respond to pressure
- What actually motivates them
- Their real obstacles (vs what they said in onboarding)
- Breakthroughs and insights
- Quotes worth remembering

Supermemory will automatically:
1. Extract new facts from transcripts
2. Update the user profile
3. Create relationships between memories
4. Track changes over time

## Integration Point

After the call ends, in the call summary handling:

`agent/core/main.py` (or wherever calls are concluded)

## Implementation

### 1. Add Post-Call Memory Function

```python
# In agent/services/supermemory.py (add to existing service)

async def add_call_transcript(
    self,
    user_id: str,
    call_number: int,
    streak_day: int,
    call_type: str,
    mood: str,
    transcript: List[Dict[str, str]],  # [{"role": "agent", "content": "..."}, ...]
    outcomes: Dict[str, Any]
) -> bool:
    """
    Store call transcript and outcomes as a memory.
    
    Called after each call completes.
    Supermemory will extract insights and update the user's profile.
    """
    
    # Format transcript as readable text
    transcript_text = "\n".join([
        f"{'AGENT' if msg['role'] == 'assistant' else 'USER'}: {msg['content']}"
        for msg in transcript
    ])
    
    content = f"""
CALL #{call_number} - DAY {streak_day}
Call Type: {call_type}
Mood: {mood}
{'='*60}

FULL TRANSCRIPT:
{transcript_text}

{'='*60}

CALL OUTCOMES:
- Promise Kept: {outcomes.get('promise_kept', 'not assessed')}
- Tomorrow's Commitment: "{outcomes.get('tomorrow_commitment', 'none')}"
- Commitment Time: {outcomes.get('commitment_time', 'unspecified')}
- Commitment Is Specific: {outcomes.get('commitment_specific', False)}

DETECTED PATTERNS:
- Excuses Made: {', '.join(outcomes.get('excuses', [])) or 'none'}
- Emotional Peak: "{outcomes.get('emotional_peak', 'none captured')}"
- Key Quote: "{outcomes.get('key_quote', '')}"

AGENT OBSERVATIONS:
{outcomes.get('observations', 'No additional observations.')}
"""
    
    memory_id = await self.add_memory(
        container_tag=user_id,
        content=content,
        metadata={
            "type": "call_transcript",
            "call_number": call_number,
            "streak_day": streak_day,
            "call_type": call_type,
            "mood": mood,
            "promise_kept": outcomes.get("promise_kept"),
            "has_commitment": bool(outcomes.get("tomorrow_commitment")),
            "excuses_count": len(outcomes.get("excuses", [])),
            "timestamp": outcomes.get("timestamp", datetime.now().isoformat())
        }
    )
    
    return memory_id is not None
```

### 2. Call After Each Session

```python
# In agent/core/main.py or session handler

async def on_call_complete(
    user_id: str,
    call_summary: CallSummary,
    transcript: List[Dict[str, str]]
):
    """Called when a call session ends."""
    
    # 1. Save to call_analytics (existing)
    await save_call_analytics(call_summary)
    
    # 2. Update call_memory (existing)
    await upsert_call_memory(user_id, call_memory)
    
    # 3. NEW: Send to Supermemory
    await supermemory.add_call_transcript(
        user_id=user_id,
        call_number=call_summary.call_number,
        streak_day=call_summary.streak_day,
        call_type=call_summary.call_type,
        mood=call_summary.mood,
        transcript=transcript,
        outcomes={
            "promise_kept": call_summary.promise_kept,
            "tomorrow_commitment": call_summary.tomorrow_commitment,
            "commitment_time": call_summary.commitment_time,
            "commitment_specific": call_summary.commitment_is_specific,
            "excuses": call_summary.excuses_detected,
            "key_quote": call_summary.quotes_captured[0] if call_summary.quotes_captured else "",
            "emotional_peak": call_summary.emotional_peak,
            "timestamp": datetime.now().isoformat()
        }
    )
    
    print(f"📝 Call #{call_summary.call_number} saved to Supermemory")
```

## Transcript Collection

Make sure transcript is being collected during the call:

```python
# During call, collect messages
class CallSession:
    def __init__(self):
        self.transcript: List[Dict[str, str]] = []
    
    def add_message(self, role: str, content: str):
        self.transcript.append({
            "role": role,  # "assistant" or "user"
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
```

## What Supermemory Will Learn

From each call, Supermemory can extract:

| Insight Type | Example |
|--------------|---------|
| New excuse patterns | "User said 'I was too busy' - matches their favorite excuse" |
| Motivation triggers | "User responded strongly when reminded of their daughter" |
| Breakthrough moments | "User admitted they're scared of success, not failure" |
| Commitment reliability | "User has kept 3/5 promises this week" |
| Emotional patterns | "User gets defensive when asked directly about failures" |

## Profile Evolution

After 10 calls, the profile might evolve from:

**Day 1 (Onboarding only):**
```
Biggest Fear: "dying with regret"
Favorite Excuse: "too tired"
```

**Day 10 (After calls):**
```
Biggest Fear: "dying with regret" - but deeper: actually fears success
because of imposter syndrome (revealed in call #7)

Favorite Excuse: Claims "too tired" but actually uses "work was crazy" 
more often (3x this week). Pattern: uses excuses that shift blame 
to external factors.

Breakthroughs:
- Call #4: Admitted previous attempts failed because didn't really want it
- Call #7: Opened up about imposter syndrome
- Call #9: First time took full responsibility without excuses
```

## Testing

1. Complete a call with test user
2. Check Supermemory dashboard - transcript should be there
3. Fetch profile - should include insights from call
4. Complete 3 more calls
5. Profile should show evolution and patterns

---

**Status: PENDING**
**Depends on: Task 02 (Supermemory service)**
**Blocks: None**
