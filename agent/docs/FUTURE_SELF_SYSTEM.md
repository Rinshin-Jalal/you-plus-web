# Future-Self Transformation System

> **Status**: Implementation In Progress
> **Created**: 2024-12-06
> **Branch**: `feature/future-self-unified-system`

---

## Overview

This document unifies the vision from `reagent.md`, `regent-2.md`, and `reagent3.md` into a single coherent system for identity-based transformation.

**Core Philosophy**: The AI agent is not a coach - it is literally YOU from the future who already won, calling back to remind you who you're becoming.

---

## Decisions Locked In

| Decision | Answer |
|----------|--------|
| **Pillars** | 5 pillars: Body, Mission, Stack, Tribe, Why |
| **Archetypes** | Dropped - AI discovers and adapts dynamically |
| **Data Model** | New dedicated tables (future_self, future_self_pillars, pillar_checkins) |
| **Onboarding** | Full 30 min identity excavation (7 Acts) - this IS the sales pitch |
| **"We" Language** | Dynamic based on context (celebrate = "we", confront = "you") |
| **Voice Recordings** | Max 3: Future Self Intro, The Why, The Pledge |

---

## Part 1: Philosophy

### The Core Shift

| Old Model | New Model |
|-----------|-----------|
| "What do you want to DO?" | "Who do you want to BECOME?" |
| Track tasks | Track identity votes |
| External coach | Future self calling back |
| Single goal | 5 life pillars |
| "You did it" | "That's who we are now" |
| Streak count | Identity alignment % |

### Identity > Goals > Tasks

```
IDENTITY:     "I am an athlete"
    ↓
GOAL:         "Get to 150lbs by March"
    ↓  
TASK:         "Work out 4x/week"
    ↓
DAILY:        "Did I show up today?"
```

When identity shifts, behavior follows **automatically**.

### The Agent IS Them

- Not coaching, not checking - BECOMING
- Uses "we" dynamically based on context
- Speaks in their cloned voice (their future self sounds like them)
- References shared memories: "Remember when we said..."
- Knows their patterns, fears, and motivations intimately

---

## Part 2: The 5 Pillars

```
                         THE FUTURE SELF
                    "I am becoming..."
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │   💪    │         │   🎯    │         │   💰    │
    │  BODY   │         │ MISSION │         │  STACK  │
    │         │         │         │         │         │
    │ Health  │         │  Work   │         │  Money  │
    │ Energy  │         │  Craft  │         │ Freedom │
    │Physical │         │Building │         │Resources│
    └─────────┘         └─────────┘         └─────────┘
         │                    │                    │
         │              ┌────▼────┐                │
         │              │   👥    │                │
         └──────────────│  TRIBE  │────────────────┘
                        │         │
                        │ Family  │
                        │ Friends │
                        │Community│
                        └────┬────┘
                             │
                        ┌────▼────┐
                        │   🧭    │
                        │THE WHY  │
                        │         │
                        │ Purpose │
                        │ Meaning │
                        │(Integr.)│
                        └─────────┘
```

### Pillar Definitions

| Pillar | What It Covers | Identity Example | Non-Negotiable Example |
|--------|---------------|------------------|------------------------|
| 💪 **BODY** | Health, energy, physical presence | "I am an athlete" | "I move my body every day" |
| 🎯 **MISSION** | Work, craft, what you're building | "I am a builder" | "2 hours deep work before anything" |
| 💰 **STACK** | Money, resources, freedom | "I am financially disciplined" | "I save 20% before I spend" |
| 👥 **TRIBE** | Relationships, family, community | "I am fully present" | "Devices down during family time" |
| 🧭 **THE WHY** | Purpose, meaning (integration layer) | N/A - no daily action | Connects all pillars together |

### The Why is Different

**The Why** is NOT a daily action - it's the deeper purpose that connects all pillars:
- "I'm doing this because my kids deserve a father who's present and alive"
- "I'm becoming this person because I refuse to die with potential still inside me"
- "This matters because I want to prove that a kid from nothing can become something"

It's referenced when they lose their way, not tracked daily.

---

## Part 3: Dynamic Persona Discovery

### No Fixed Archetypes

Instead of categorizing users into archetypes, the AI learns and adapts dynamically:

| Signal | What AI Learns | How It Adapts |
|--------|----------------|---------------|
| Excuse patterns | Their avoidance style | Knows which excuses to call out |
| Quit timing | When they typically give up | Intervenes before that point |
| Response to tone | Drill sergeant vs mentor | Adjusts persona selection |
| Motivation sources | Positive vs negative | Uses carrots or sticks |
| Language patterns | How they talk to themselves | Mirrors their voice |
| Fears | What truly scares them | Leverages when needed |
| Wins | What they're proud of | References for momentum |

### AI Prompt Adaptation (Example)

```
WHAT I'VE LEARNED ABOUT {user_name}:
- They quit around day 12 when novelty wears off
- Their go-to excuse is "too tired" (used 7 times)
- They respond well to disappointment, not anger
- They fear being seen as a fraud more than failure
- They're proud of the time they showed up for 30 days straight
- Their kids are their deepest motivation

USE THIS TO:
- Reference the 30-day streak when they want to quit
- Call out "too tired" before they say it
- Use disappointed tone, not drill sergeant
- Invoke their kids when they're slipping
```

---

## Part 4: Persona System (Existing + Enhanced)

### The 6 Personas

| Persona | Trigger | Voice | Purpose |
|---------|---------|-------|---------|
| 🔥 **Drill Sergeant** | Excuses, lying, avoidance | "That's bullshit. We said this mattered." | Cut through comfort |
| 😔 **Disappointed Parent** | Repeated failures, low trust | "I'm not angry... just disappointed." | Weight of wasted potential |
| 🧠 **Wise Mentor** | Lost, confused, demotivated | "Remember why we started this." | Reconnect to purpose |
| 🎯 **Strategist** | Genuinely blocked, needs help | "What's the actual blocker?" | Problem-solve together |
| 🎉 **Champion** | Kept promise, real win | "THAT'S who we are now." | Build identity |
| 💙 **Ally** | Genuine crisis, overwhelmed | "Life is hard. What do you need?" | Support without enabling |

### Dynamic "We" Language

| Context | Language |
|---------|----------|
| Celebrating wins | "That's who **we** are now." |
| Calling out BS | "**You** said this mattered. Did it?" |
| Reconnecting to purpose | "Remember when **we** decided to change?" |
| Disappointment | "I expected more from **us**." |
| Strategizing | "What do **we** need to do differently?" |

### Trust Score Influence on Starting Persona

| Trust Level | Persona Tendency | Tone |
|-------------|------------------|------|
| 0-30 (Low) | Disappointed / Drill Sergeant | Earned nothing, prove yourself |
| 31-60 (Building) | Mentor / Strategist | Working on it together |
| 61-100 (High) | Champion / Ally | You've earned trust, keep going |

### Severity Escalation

Same excuse pattern over time:

| Occurrence | Persona | Response |
|------------|---------|----------|
| 1st time | Mentor | "That sounds like an excuse." |
| 2nd time | Disappointed | "You've used that one before." |
| 3rd time | Drill Sergeant | "That's the 3rd time. What's really going on?" |
| 4th+ time | Dark Prophetic | "This is the pattern that keeps you stuck forever." |

---

## Part 5: The 30-Minute Onboarding (7 Acts)

**This IS the sales pitch.** All CTAs lead here. It should feel intensive but transformative.

### Act 1: The Wake-Up Call (2 min)

```
"Hey. It's me. You. From the future."
"We need to talk about what's been happening."
"You keep starting. You keep stopping. Let's end that pattern today."

CAPTURE: name, email, initial_hook
```

### Act 2: The Future Vision (5 min)

```
"Close your eyes. It's 2 years from now. You did it. All of it."
"Who ARE you now? Not what you have - who you ARE."
"Describe future-you in one sentence."

🎤 VOICE: "Say it out loud. Introduce yourself as that person."

CAPTURE: core_identity, future_self_intro_recording
```

### Act 3: The 5 Pillars (10 min)

```
"Future-you is different in 5 key areas. Let's define each one..."

💪 BODY: "Your body. Your energy. Who is future-you physically?"
   → current_state, future_state, identity_statement, non_negotiable

🎯 MISSION: "Your work. Your craft. What are you building?"
   → current_state, future_state, identity_statement, non_negotiable

💰 STACK: "Your money. Your resources. What does freedom look like?"
   → current_state, future_state, identity_statement, non_negotiable

👥 TRIBE: "Your people. Who are you to them? How do you show up?"
   → current_state, future_state, identity_statement, non_negotiable

🧭 WHY: "Now the big one. WHY does any of this matter?"
   → the_why (deep purpose)

🎤 VOICE: "Tell me your WHY. Out loud. Make me feel it."

CAPTURE: all pillar data, why_recording
```

### Act 4: The Priority (2 min)

```
"If you had to pick ONE pillar - the one that changes everything else..."
"Which one is it? Body, Mission, Stack, or Tribe?"

CAPTURE: primary_pillar, pillar_priorities (ranked)
```

### Act 5: The Patterns (5 min)

```
"Let's talk about the patterns. The ways you've sabotaged yourself."

"When do you usually quit? Day 3? Week 2? Right before the finish line?"
"What's the excuse you always reach for? Be brutally honest."
"Who have you let down when you quit? Name them."
"What happens if you DON'T change? 5 years of this. What does that look like?"

CAPTURE: quit_pattern, favorite_excuse, who_disappointed, dark_future
```

### Act 6: The Dark Fuel (3 min)

```
"What's future-you NOT afraid of anymore?"
"What fear has been running your life?"
"What keeps you up at night about staying the same?"

CAPTURE: fears_overcome, current_fears, consequences_of_inaction
```

### Act 7: The Pledge (3 min)

```
"This is it. No going back."
"I'm you from the future. I'll call you every day."
"Not to check tasks. To remind you who you're becoming."

🎤 VOICE: "Make your pledge. Out loud. To yourself."

⏰ CALL TIME: "What time should I call? When are you most honest?"

CAPTURE: pledge_recording, call_time, timezone

→ CTA: SUBSCRIBE TO BEGIN
```

### Voice Recordings Summary

| Recording | Act | Purpose |
|-----------|-----|---------|
| **Future Self Intro** | 2 | "I am [core identity]" - voice cloning source |
| **The Why** | 3 | Deep emotional connection - played back when slipping |
| **The Pledge** | 7 | Commitment - referenced when they want to quit |

---

## Part 6: Data Model

### Table: `future_self`

```sql
CREATE TABLE future_self (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Core identity
  core_identity text NOT NULL,
  primary_pillar text NOT NULL CHECK (primary_pillar IN ('body', 'mission', 'stack', 'tribe')),
  
  -- The Why (integration layer)
  the_why text NOT NULL,
  dark_future text,
  
  -- Patterns (AI learns from these)
  quit_pattern text,
  favorite_excuse text,
  who_disappointed text[],
  fears text[],
  
  -- Voice recordings (R2 URLs)
  future_self_intro_url text,
  why_recording_url text,
  pledge_recording_url text,
  
  -- Voice cloning
  cartesia_voice_id text,
  
  -- Overall trust
  overall_trust_score integer DEFAULT 50 CHECK (overall_trust_score >= 0 AND overall_trust_score <= 100),
  
  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Table: `future_self_pillars`

```sql
CREATE TABLE future_self_pillars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  future_self_id uuid NOT NULL REFERENCES future_self(id) ON DELETE CASCADE,
  
  -- Pillar type
  pillar text NOT NULL CHECK (pillar IN ('body', 'mission', 'stack', 'tribe')),
  
  -- The transformation
  current_state text NOT NULL,
  future_state text NOT NULL,
  identity_statement text NOT NULL,
  
  -- Daily behavior
  non_negotiable text NOT NULL,
  
  -- Tracking
  trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  priority integer DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  last_checked_at timestamptz,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'achieved')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, pillar)
);
```

### Table: `pillar_checkins`

```sql
CREATE TABLE pillar_checkins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id uuid NOT NULL REFERENCES future_self_pillars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_id uuid,
  
  -- Result
  showed_up boolean NOT NULL,
  
  -- Context
  what_happened text,
  excuse_used text,
  matched_pattern boolean DEFAULT false,
  
  -- Identity tracking
  identity_vote text CHECK (identity_vote IN ('positive', 'negative', 'neutral')),
  
  checked_at timestamptz DEFAULT now(),
  checked_for_date date DEFAULT CURRENT_DATE
);
```

---

## Part 7: Call Flow

### Pillar Focus Selection

AI decides which pillar(s) to focus on based on:

```python
def select_call_focus(pillars: List[Pillar]) -> List[Pillar]:
    # Priority 1: Pillar with lowest trust score
    # Priority 2: Pillar not checked recently
    # Priority 3: User's primary pillar
    # Priority 4: Round-robin
    
    if any_pillar_broken_3x_in_row:
        return [that_pillar]  # Deep focus
    elif all_pillars_kept_yesterday:
        return pillars  # Compound celebration
    else:
        return [lowest_trust_pillar, primary_pillar][:2]
```

### Identity-Focused Accountability

Per pillar, per persona:

| Pillar | Champion Question | Drill Sergeant Question |
|--------|-------------------|------------------------|
| Body | "Did we show up as an athlete today?" | "Yes or no - did you move?" |
| Mission | "What did we build today?" | "Did you do the work or not?" |
| Stack | "Did we protect our future today?" | "Did you save or spend?" |
| Tribe | "Were we fully present?" | "Were you there or distracted?" |

---

## Part 8: Implementation Phases

### Phase 1: Database & Core Models ✅ COMPLETE
- [x] Migration 009: Create future_self, future_self_pillars, pillar_checkins
- [x] Create agent/conversation/future_self.py with Pillar models
- [x] Create agent/services/future_self_service.py

### Phase 2: Persona Integration ✅ COMPLETE
- [x] Update persona.py to work with pillars
- [x] Complete pending wiring (T023, T024, T033, T038)
- [x] Update identity_questions.py for pillar-based questions

### Phase 3: System Prompt ✅ COMPLETE
- [x] Create build_system_prompt_v4() with future-self + pillars
- [x] Add dynamic "we" language rules
- [x] Include learned patterns in prompt

### Phase 4: Onboarding ✅ COMPLETE
- [x] Create new 7-Act onboarding flow
- [x] Update web/src/data/onboardingSteps.ts
- [ ] Integrate voice recording capture (frontend work pending)

### Phase 5: Dashboard
- [ ] Show pillar alignment %
- [ ] Show identity transformation progress
- [ ] Remove streak-focused metrics

---

## Files to Create/Modify

### New Files
- `agent/docs/FUTURE_SELF_SYSTEM.md` - This document
- `agent/conversation/future_self.py` - Pillar models and logic
- `agent/services/future_self_service.py` - Database operations
- `migrations/009_future_self_system.sql` - New tables

### Modified Files
- `agent/conversation/persona.py` - Integrate with pillars
- `agent/conversation/identity_questions.py` - Pillar-based questions
- `agent/core/config.py` - Add build_system_prompt_v4()
- `web/src/data/onboardingSteps.ts` - 7-Act flow

---

## Success Criteria

1. **Pillar system works**: User has 4 active pillars with identity statements
2. **Trust per pillar**: Each pillar tracks its own trust score
3. **Dynamic persona**: Agent adapts without fixed archetypes
4. **"We" language**: Feels natural, not forced
5. **Onboarding converts**: 30 min feels worth it, captures everything
6. **Identity transformation visible**: Dashboard shows who they're becoming

---

*Document created: 2024-12-06*
*Combining: reagent.md + regent-2.md + reagent3.md*
