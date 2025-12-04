# Task 04: Update Agent to Use Supermemory Profile

## Objective

Replace all manual `onboarding.get("field")` calls with a single Supermemory profile fetch. The profile becomes the context - no field extraction needed.

## Current Code (BAD)

`agent/core/config.py` lines 91-125:

```python
identity = user_context.get("identity", {})
onboarding = identity.get("onboarding_context", {})

# Manual extraction of 20+ fields
goal = onboarding.get("goal", "")
goal_deadline = onboarding.get("goal_deadline", "")
motivation_level = onboarding.get("motivation_level", 5)
attempt_count = onboarding.get("attempt_count", 0)
attempt_history = onboarding.get("attempt_history", "")
favorite_excuse = onboarding.get("favorite_excuse", "")
how_did_quit = onboarding.get("how_did_quit", "")
quit_pattern = onboarding.get("quit_pattern", "")
biggest_obstacle = onboarding.get("biggest_obstacle", "")
who_disappointed = onboarding.get("who_disappointed", "")
future_if_no_change = onboarding.get("future_if_no_change", "")
success_vision = onboarding.get("success_vision", "")
what_spent = onboarding.get("what_spent", "")
biggest_fear = onboarding.get("biggest_fear", "")
witness = onboarding.get("witness", "")

# Then manually build sections
psych_profile_lines = []
if attempt_count and attempt_count > 0:
    psych_profile_lines.append(f"- Tried this {attempt_count} times before and failed")
# ... 50 more lines of this
```

## New Code (GOOD)

```python
from services.supermemory import supermemory

async def build_system_prompt(
    user_id: str,
    user_context: dict,
    call_type: CallType,
    mood: Mood,
    call_memory: dict,
    excuse_data: Optional[dict] = None,
) -> str:
    """
    Build the Future Self system prompt.
    
    Uses Supermemory profile for psychological context instead of
    manual field extraction.
    """
    identity = user_context.get("identity", {})
    identity_status = user_context.get("identity_status", {})
    
    # ─────────────────────────────────────────────────────────────────────────
    # CORE USER INFO (from identity table - minimal)
    # ─────────────────────────────────────────────────────────────────────────
    name = user_context.get("users", {}).get("name", "")
    name_ref = name if name else "you"
    commitment = identity.get("daily_commitment", "what you said you'd do")
    current_streak = identity_status.get("current_streak_days", 0)
    total_calls = identity_status.get("total_calls_completed", 0)
    
    # ─────────────────────────────────────────────────────────────────────────
    # PSYCHOLOGICAL PROFILE (from Supermemory - dynamic!)
    # ─────────────────────────────────────────────────────────────────────────
    profile = await supermemory.get_user_profile(user_id)
    
    if profile:
        # Profile contains everything - no extraction needed
        psychological_context = profile.static
        recent_context = profile.dynamic
    else:
        # Fallback if Supermemory unavailable
        psychological_context = "No profile available. Learn about them through this call."
        recent_context = ""
    
    # ─────────────────────────────────────────────────────────────────────────
    # BUILD THE PROMPT (much simpler now!)
    # ─────────────────────────────────────────────────────────────────────────
    return f"""
# YOU+ FUTURE SELF - THE NIGHTLY CALL

You are {name_ref}'s Future Self. The version that made it.

This is call #{total_calls + 1}. {"You've been doing this together for " + str(current_streak) + " days straight." if current_streak > 0 else "Fresh start. No streak yet."}

---

# WHO YOU'RE TALKING TO

Name: {name_ref}
Tonight's commitment: "{commitment}"
Current streak: {current_streak} days

---

# THEIR PSYCHOLOGICAL PROFILE

{psychological_context}

---

# RECENT CONTEXT

{recent_context if recent_context else "First call or no recent activity."}

---

# THIS CALL

**Type:** {call_type.name.upper()}
**Energy:** {call_type.energy}

{_build_call_type_instructions(call_type, current_streak, call_memory.get("narrative_arc", "early_struggle"))}

---

{get_mood_prompt_section(mood)}

---

{_build_callback_section(call_memory)}

{_build_open_loop_section(call_memory, current_streak)}

---

# CONVERSATION RULES
... (keep existing rules) ...
"""
```

## Key Changes

| Before | After |
|--------|-------|
| 20+ `.get()` calls | 1 `get_user_profile()` call |
| Manual section building | Profile IS the section |
| Hardcoded field names | Dynamic content from Supermemory |
| Static data | Evolving profile |

## Files to Update

### 1. `agent/core/config.py`

- Import supermemory service
- Make `build_system_prompt` async
- Replace onboarding extraction with profile fetch
- Simplify prompt building

### 2. `agent/core/main.py`

- Update call to `build_system_prompt` to be async
- Pass `user_id` to the function

### 3. `agent/core/llm.py` (if exists)

- Ensure async compatibility

## Fallback Behavior

If Supermemory is unavailable:
1. Log warning
2. Use minimal context from identity table
3. Agent will learn through conversation

```python
profile = await supermemory.get_user_profile(user_id)

if profile:
    psychological_context = profile.static
    recent_context = profile.dynamic
else:
    # Fallback - basic info only
    print(f"⚠️ No Supermemory profile for {user_id}, using minimal context")
    psychological_context = f"""
No detailed profile available. What we know:
- Name: {name}
- Commitment: {commitment}
- Streak: {current_streak} days

Learn about them through tonight's conversation.
"""
    recent_context = ""
```

## Testing

1. Run agent with Supermemory enabled
2. Verify profile is fetched (check logs)
3. Verify prompt contains full psychological context
4. Disable Supermemory - verify fallback works
5. Complete a call - verify profile updates

## Remove Dead Code

After this task, delete:
- All `onboarding.get("field")` lines
- `psych_profile_lines` building
- `triggers_lines` building
- Manual section construction

---

**Status: PENDING**
**Depends on: Task 02 (Supermemory service), Task 03 (onboarding integration)**
**Blocks: None**
