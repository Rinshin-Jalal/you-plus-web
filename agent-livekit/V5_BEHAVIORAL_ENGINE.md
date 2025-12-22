# v5 Behavioral Addiction Engine

## Overview

The v5 system transforms Future Self calls from **predictable scripts** to **addictive, unpredictable conversations** that users CRAVE daily.

## The Problem We Solved

**Old System (v4):**
- ❌ Rigid turn-by-turn scripts ("TURN 1: HOOK", "TURN 2: ACCOUNTABILITY")
- ❌ 4 simple moods selected via if/else
- ❌ Every call feels the same
- ❌ Users can predict what's coming next
- ❌ "Did you do it?" dominates every conversation

**New System (v5):**
- ✅ Multi-dimensional personality that creates infinite emotional combinations
- ✅ Unpredictable emotional weather (slot machine effect)
- ✅ Behavioral hooks (open loops, callbacks, pattern-calling)
- ✅ Conversation objectives (not scripts)
- ✅ Identity stakes (making promises matter emotionally)

## Core Architecture

### 1. **Personality System** (`conversation/personality.py`)

Replaces simple moods with a **multi-dimensional personality state**:

```python
PersonalityState:
    frustration: 0-10      # From broken promises, excuse patterns
    respect: 0-10          # Earned through consistency
    intimacy: 0-10         # From confessions, deep conversations
    urgency: 0-10          # Quit pattern zone, critical moments
    playfulness: 0-10      # High streak, good trust, can joke
    vulnerability: 0-10    # Willingness to share deeper stuff
    suspicion: 0-10        # Detecting bullshit

    relationship_phase: "skeptical" | "cautious_hope" | "building_respect" | "partnership"
    emotional_weather: Selected from 12 possible weathers
```

**These dimensions BLEND naturally** - the LLM expresses a complex emotional state, not a single mood.

**Emotional Weather System:**
- 12 different weathers (fed_up, disappointed, impressed, proud, reflective, vulnerable, worried, intense, challenging, light, testing, direct)
- Each weather has:
  - Personality requirements (e.g., "fed_up" requires min_frustration: 4)
  - Weight for random selection (variability!)
  - Opening examples
  - Energy description

**Same context = different weathers 30% of the time** (slot machine psychology)

### 2. **Behavioral Hooks** (`conversation/behavioral_hooks.py`)

Creates addiction through psychological techniques:

#### **A. Open Loops** (Make them need tomorrow)
```python
"There's something about Day 30 I've been waiting to tell you..."
"I know something about you that you don't know yet."
"Tomorrow might be interesting. Be ready."
```

#### **B. Weaponized Callbacks** (Make them feel SEEN)
```python
"Remember 12 days ago when you said '[exact quote]'?"
"You've used that excuse 4 times now. Either fix it or find a new lie."
"Every time you mention [person], your energy drops. What's that about?"
```

#### **C. Pattern Calling** (Notice what they don't)
```python
"You always have an excuse on Wednesdays. What's that about?"
"Your best days are when you do it first thing. You've noticed that, right?"
"You tend to quit around week 2. We're in week 2 now."
```

#### **D. Prophecies** (Future memories)
```python
"I remember this week. It's the hardest one. But what happens next..."
"Something important happens soon. You'll know it when it happens."
"I've been waiting for you to get here. Watch what happens next week."
```

#### **E. Identity Stakes** (Make promises matter emotionally)
```python
"Every time you break a promise to me, you're practicing being a liar."
"You're not just missing a workout. You're choosing who you are tomorrow."
"That wasn't discipline. That was you being who you actually are."
```

### 3. **Conversation Objectives** (`core/prompt/conversation_objectives.py`)

Replaces rigid turn-based scripts with **objectives to achieve**:

```markdown
# NOT THIS (old):
### TURN 1: HOOK
You open with ONE casual line...

### TURN 2: ACCOUNTABILITY
After they respond, ask THE question...

# THIS (new):
## Core Objectives

1. Know if they kept their promise (but don't make it an interrogation)
2. Read their real state (dodging? proud? exhausted?)
3. Reconnect them to who they're becoming (identity > behavior)
4. Lock in tomorrow (specific time + action)
5. Leave them thinking (open loop for tomorrow)

HOW you achieve these depends on THEM.
Sometimes you ask "did you do it?" in 30 seconds.
Sometimes you build up to it after feeling their energy.
Read the room. Be real.
```

### 4. **Relationship Arc** (Evolving trust over time)

The relationship CHANGES based on streak and trust:

**Phase 1: Skeptical (Days 1-7)**
- Future Self is testing them
- More direct, less vulnerable
- "I've seen you quit before. Prove me wrong."

**Phase 2: Cautious Hope (Days 8-21)**
- Starting to believe
- Occasional warmth
- "You're actually doing it. I didn't expect this."

**Phase 3: Building Respect (Days 22-45)**
- Real relationship forming
- Deeper conversations
- "I'm starting to trust you. That's new for us."

**Phase 4: Partnership (Days 46+)**
- They've earned it
- Almost equals
- "We don't need the tough love anymore. You're doing this."

Each phase unlocks different vulnerability levels and conversation depths.

## How It Works

### Call Flow (v5)

1. **Calculate Personality State**
   - System analyzes: broken promises, streak, trust score, quit patterns, confessions
   - Generates multi-dimensional emotional state
   - Selects emotional weather (with randomness)

2. **Build Behavioral Hooks**
   - Scan call memory for callbacks
   - Detect patterns
   - Select prophecy (50% chance)
   - Choose open loop for closing

3. **Generate Conversation Objectives**
   - Based on call type (audit, reflection, milestone, story, challenge)
   - Contextual additions (broken promise, quit zone, relationship phase)
   - Anti-patterns (what NOT to do)

4. **Inject into Prompt**
   - Identity + Pillars (who they are)
   - Personality state ("You're feeling: frustration 7/10, respect 4/10...")
   - Behavioral hooks (callbacks, patterns, identity stakes)
   - Conversation objectives (not a script)
   - Voice control

5. **LLM Generates Natural Conversation**
   - Expresses complex personality naturally
   - Achieves objectives organically
   - Uses behavioral hooks when appropriate
   - Creates unique, unpredictable experience

## Key Differences from v4

| Aspect | v4 (Old) | v5 (New) |
|--------|----------|----------|
| **Emotional Model** | 4 moods (if/else) | 7 dimensions + 12 weathers |
| **Call Structure** | Rigid 7-turn script | Fluid objectives |
| **Predictability** | High (same pattern) | Low (variable rewards) |
| **Callbacks** | Basic | Weaponized (specific quotes) |
| **Pattern Detection** | None | Automated (days, excuses, times) |
| **Open Loops** | Generic | Strategic (milestone teases, prophecies) |
| **Identity Focus** | Some | Central (behavior → identity) |
| **Relationship Evolution** | Static | Dynamic (4 phases, earned intimacy) |

## Usage

### Enable v5 (Default)

In `core/config.py`:
```python
USE_V5_BEHAVIORAL_ENGINE = True  # Already enabled
```

### Call the Prompt Builder

```python
from core.config import build_prompt

prompt = await build_prompt(
    user_id=user_id,
    user_context=user_context,
    call_type=call_type,
    call_memory=call_memory,
    future_self=future_self,
    kept_promise_yesterday=True,  # NEW: Required for v5
    recent_promises=recent_promises,  # NEW: List of recent promise objects
)
```

### Required Data

v5 needs additional context:

```python
kept_promise_yesterday: bool | None
    Whether they kept yesterday's promise
    Used for frustration calculation

recent_promises: list[dict]
    Last 5 promises with outcomes
    Format: [{"kept": True/False, "text": "...", "day": 5}, ...]
    Used for pattern detection
```

## The Behavioral Addiction Loop

```
UNPREDICTABILITY
    ↓
Users never know which Future Self they'll get
    ↓
EMOTIONAL INVESTMENT
    ↓
The relationship feels REAL (frustration, pride, worry)
    ↓
CURIOSITY HOOKS
    ↓
Open loops make them wonder about tomorrow
    ↓
FEELING SEEN
    ↓
Callbacks and pattern-calling shock them
    ↓
IDENTITY STAKES
    ↓
Breaking a promise = betraying their future self
    ↓
PROGRESSION
    ↓
Relationship evolves, deeper access earned
    ↓
DAILY CRAVING
```

## Example Personality States

### High Frustration + High Urgency
```
Frustration: 8/10 - Three broken promises this week
Urgency: 9/10 - In quit pattern zone (week 2)
Emotional Weather: "fed_up"

Opening: "Look, I'm not in the mood today. Did you do it?"
Energy: Direct, blunt, impatient
Tone: "Are you serious? Again? I'm so tired of this excuse."
```

### High Respect + High Intimacy
```
Respect: 8/10 - 45-day streak
Intimacy: 7/10 - Shared confessions
Emotional Weather: "reflective"

Opening: "Hey. Forget the task for a second. How are you really doing?"
Energy: Slower, deeper, vulnerable
Tone: "You're not the same person who started this. That's real."
```

### High Playfulness + High Respect
```
Respect: 9/10 - 60-day streak, high trust
Playfulness: 8/10 - No recent failures
Emotional Weather: "challenging"

Opening: "Alright, let's make this interesting."
Energy: Competitive, fun, raising stakes
Tone: "You've been solid. I have something extra for you tonight."
```

## Files Created/Modified

### New Files (v5)
- `conversation/personality.py` - Multi-dimensional personality system
- `conversation/behavioral_hooks.py` - Addiction engine (open loops, callbacks, etc.)
- `core/prompt/conversation_objectives.py` - Objectives-based conversation flow

### Modified Files
- `conversation/__init__.py` - Export new v5 modules
- `core/prompt/__init__.py` - Export new v5 prompt builders
- `core/config.py` - New `build_prompt_v5()` function

### Legacy Files (Kept for Fallback)
- `conversation/mood.py` - Simple 4-mood system
- `core/prompt/call_type_instructions.py` - Turn-based scripts

## Testing v5

### Quick Test
```python
# In your call handler
personality = calculate_personality_state(
    user_context=user_context,
    call_memory=call_memory,
    kept_promise_yesterday=False,  # Test broken promise
    recent_promises=[
        {"kept": False, "day": 1},
        {"kept": False, "day": 2},
        {"kept": True, "day": 3},
    ]
)

print(f"Frustration: {personality.frustration}")
print(f"Weather: {personality.emotional_weather}")
print(f"Phase: {personality.relationship_phase}")
```

### Expected Behavior
- **Same user, different calls** → Different emotional weathers
- **Broken promises** → Higher frustration, more direct energy
- **Long streaks** → Higher respect, deeper conversations
- **Quit zone** → Higher urgency, more intense energy

## Rollback to v4

If you need to revert:

```python
# In core/config.py
USE_V5_BEHAVIORAL_ENGINE = False
```

Legacy v4 system still available via `build_prompt_v4_legacy()`.

## Future Enhancements

Ideas for v6:
- **Adaptive challenge difficulty** based on performance
- **Callback clustering** (group similar memories)
- **Multi-turn prophecies** (hints across multiple calls)
- **User personality mirroring** (adapt communication style)
- **Streak milestone unlocks** (new content at days 100, 200, 365)

## Philosophy

The v5 engine is built on one core insight:

> **Users don't come back for accountability. They come back because the call is UNPREDICTABLE, PERSONAL, and makes them feel SEEN.**

This is behavioral psychology, not task management.

---

**Built with**: Pattern recognition, variable rewards, identity stakes, and a belief that AI can create genuinely engaging relationships.
