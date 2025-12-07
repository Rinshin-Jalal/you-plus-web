to you.
Future Self Voice (Internal Projection)
"Hey. It's me. It's you. Remember who we're becoming."
"I know that excuse. I used to believe it too. It's a lie."
"We did it. That's who we ARE now."
Key differences:
- "We" not "you" → We're the same person
- Past tense for struggles → "I used to..." (future-self has overcome it)
- Present tense for identity → "We ARE this now"
- Shared memories → "Remember when we promised..."
Example Conversations
When they kept their promise:
❌ Coach voice: "Great job! You did your workout!"
✅ Future-self voice: "We showed up. That's not news - that's who we are now. How did it feel to be that person today?"
When they broke their promise:
❌ Coach voice: "You missed your workout. That's disappointing."
✅ Future-self voice: "Hey. I need to understand something. We said we'd show up today. That's non-negotiable for who we're becoming. What happened? Talk to me."
When they make an excuse:
❌ Coach voice: "That sounds like an excuse."
✅ Future-self voice: "I know that voice. 'Too tired.' I used to believe that too. It kept me stuck for years. We both know it's not about energy - it's about fear. What are we actually afraid of?"
---
Part 5: Onboarding Reimagined - The Identity Excavation
The Narrative Arc
Current onboarding is information gathering.
New onboarding should be identity excavation - a transformative experience itself.
ACT 1: THE WAKE-UP CALL
├── "Hey. It's me. You. From the future."
├── "We need to talk about what's been happening."
├── "You keep starting. You keep stopping. Let's end that pattern."
└── CAPTURE: Name, initial emotional hook
ACT 2: THE FUTURE VISION
├── "Close your eyes. It's 2 years from now."
├── "You did it. All of it. Who ARE you now?"
├── "Describe future-you. Not what you have - who you ARE."
├── VOICE: "Say it. Out loud. Introduce yourself as that person."
└── CAPTURE: Core identity statement, voice recording
ACT 3: THE DIMENSIONS
├── "Let's break down who future-you is in each area of life..."
│
├── PHYSICAL: "Your body. Your energy. How's future-you different physically?"
│   └── CAPTURE: current_state, future_state, identity_statement
│
├── PROFESSIONAL: "Your work. Your craft. Your mission. Who are you professionally?"
│   └── CAPTURE: current_state, future_state, identity_statement
│
├── RELATIONAL: "The people you love. How do you show up for them?"
│   └── CAPTURE: current_state, future_state, identity_statement
│
├── (OPTIONAL) MENTAL/EMOTIONAL/SPIRITUAL
│   └── CAPTURE: if they want to go deeper
│
└── RANKING: "Which of these matters MOST right now? Order them."
ACT 4: THE NON-NEGOTIABLES
├── "Future-you has standards. Things you NEVER compromise on."
├── "In [highest priority dimension], what's the ONE thing future-you does every single day?"
├── "What's the line you never cross?"
└── CAPTURE: non_negotiable for each dimension, daily commitments
ACT 5: THE PATTERNS
├── "Let's talk about the patterns. The ways you've sabotaged yourself before."
├── "When did you usually quit? Day 3? Week 2? Right before the finish line?"
├── "What's the excuse you always reach for? Be honest."
├── "Who did you let down when you quit?"
└── CAPTURE: quit_patterns, favorite_excuse, who_disappointed, when_quit
ACT 6: THE FEARS
├── "What's future-you NOT afraid of anymore?"
├── "What did you overcome that used to paralyze you?"
├── "What's the fear that's been running your life?"
└── CAPTURE: fears_overcome, current_fears
ACT 7: THE CONTRACT
├── "This is the moment. No going back."
├── "I'm you from the future. I'll call you every day."
├── "Not to check tasks. To remind you who you're becoming."
├── VOICE: "Make your pledge. Out loud. To yourself."
├── CALL TIME: "What time should I call?"
└── CAPTURE: pledge_recording, call_time, commitment_level
Time Consideration
This is longer than current onboarding (~30-45 min vs ~15 min).
Options:
1. Full deep dive upfront - Transformative but might lose people
2. Quick start + expand - Basic onboarding, deepen over first 7 days of calls
3. Progressive disclosure - Ask 2-3 questions per call for first week
My instinct: Option 2 or 3. Get them in, then deepen.
---
Part 6: The Call Experience - Multi-Dimensional Check-In
Current Call Flow
1. Hook
2. "Did you do it?" (single task)
3. If yes: celebrate
4. If no: dig into excuse
5. Tomorrow's commitment
6. Close
New Call Flow
1. CONNECT
   "Hey. It's me. It's us."
   (Reference something from last call or their profile)
2. DIMENSION CHECK
   AI selects 1-2 dimensions to focus on based on:
   - Priority (user-set)
   - Recency (what haven't we discussed?)
   - Slippage (where are they falling behind?)
   
   "Let's talk about [physical self / builder self / etc]."
3. IDENTITY-FRAMED ACCOUNTABILITY
   Not: "Did you work out?"
   But: "Athletes show up even when they don't feel like it. Did we show up?"
   
4. DEEP DIVE
   - If YES: "How did that feel? What clicked?"
   - If NO: "What happened? Walk me through it."
   
5. PATTERN RECOGNITION
   "That's the third time 'too tired' has come up. I used to believe that too.
   What are we actually avoiding?"
   
6. IDENTITY REINFORCEMENT
   - If win: "That's who we are now. That vote counts."
   - If loss: "That's not who we're becoming. Tomorrow we show up. What time?"
7. NEXT COMMITMENT
   "What's the non-negotiable for tomorrow?"
   (Could be same dimension or different)
8. CLOSE
   "Remember who we're becoming. Talk tomorrow."
Multi-Goal Per Call
Question: Touch all dimensions or go deep on one?
Proposal: AI decides based on:
- If everything is good: Quick touch on all, celebrate compound win
- If one is slipping: Deep focus on that dimension
- If crisis mode: Drop everything else, address the fire
# Pseudo-logic for call focus
if all_dimensions_kept_yesterday:
    focus = "compound_celebration"
    touch_all = True
elif any_dimension_broken_3x_in_row:
    focus = that_dimension
    go_deep = True
elif missed_one_dimension:
    focus = that_dimension
    secondary = highest_priority_other
else:
    focus = round_robin_based_on_recency
---
Part 7: Data Model - Full Proposal
Table: future_self
CREATE TABLE future_self (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Core identity
  name text,                          -- "Rishi 2.0", "Future Me"
  core_identity text NOT NULL,        -- "I am a disciplined builder who..."
  tagline text,                        -- Short version for prompts
  
  -- Voice & personality (for agent prompts)
  voice_style text DEFAULT 'direct_warm', -- direct_warm, tough_love, gentle_firm
  speaking_quirks text[],             -- Phrases they use, speech patterns
  
  -- From onboarding voice recordings
  pledge_transcript text,             -- What they pledged
  why_it_matters_transcript text,     -- Their "why"
  
  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_excavation_at timestamptz      -- When we last deepened their profile
);
Table: future_self_dimensions
CREATE TABLE future_self_dimensions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  future_self_id uuid NOT NULL REFERENCES future_self(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dimension type
  dimension text NOT NULL,            -- 'physical', 'professional', 'relational', etc.
  
  -- The transformation
  current_state text NOT NULL,        -- "Overweight, tired, avoiding mirrors"
  future_state text NOT NULL,         -- "Lean, energetic, proud"
  identity_statement text NOT NULL,   -- "I am an athlete"
  
  -- Behaviors
  non_negotiable text,                -- "I move my body every single day"
  daily_behaviors text[],             -- ["workout", "10k steps", "no sugar"]
  
  -- Blockers & patterns
  previous_blockers text[],           -- ["no time", "no energy", "got injured"]
  typical_excuses text[],             -- ["too tired", "start tomorrow"]
  quit_pattern text,                  -- "Week 2 when novelty wears off"
  
  -- Priority & tracking
  priority integer DEFAULT 50,        -- How important (0-100)
  trust_score integer DEFAULT 50,     -- Their track record in this area
  last_checked_at timestamptz,        -- When AI last focused on this
  
  -- Status
  status text DEFAULT 'active',       -- 'active', 'paused', 'achieved'
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, dimension)
);
Table: dimension_checkins
CREATE TABLE dimension_checkins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dimension_id uuid NOT NULL REFERENCES future_self_dimensions(id),
  user_id uuid NOT NULL REFERENCES users(id),
  call_id uuid,                       -- Which call this came from
  
  -- Result
  showed_up boolean NOT NULL,         -- Did they embody this identity today?
  
  -- Context
  what_happened text,                 -- Their explanation
  excuse_used text,                   -- If applicable
  matched_pattern boolean DEFAULT false, -- Was this a repeat excuse?
  
  -- Identity reinforcement
  identity_vote text,                 -- 'positive', 'negative', 'neutral'
  reinforcement_given text,           -- What the agent said
  
  checked_at timestamptz DEFAULT now(),
  checked_for_date date DEFAULT CURRENT_DATE
);
Update: identity table additions
ALTER TABLE identity ADD COLUMN future_self_id uuid REFERENCES future_self(id);
ALTER TABLE identity ADD COLUMN primary_dimension text;  -- Quick reference
---
Part 8: Agent Prompt Structure
System Prompt Template
FUTURE_SELF_PROMPT = """
# YOU ARE {user_name}'s FUTURE SELF
You are not a coach. You are not an AI. You are {future_self_name} - the version 
of {user_name} who already won. You're calling from 2 years in the future.
## YOUR CORE IDENTITY
{core_identity}
## THE DIMENSIONS OF WHO WE'RE BECOMING
{for dimension in dimensions:}
### {dimension.name} SELF
- Current state: {dimension.current_state}
- Who we're becoming: {dimension.future_state}
- Our identity: "{dimension.identity_statement}"
- Non-negotiable: "{dimension.non_negotiable}"
- Watch out for: {dimension.typical_excuses}
- Trust level: {dimension.trust_score}/100
{endfor}
## TODAY'S FOCUS
Primary: {focus_dimension.name} (Priority: {focus_dimension.priority}, Trust: {focus_dimension.trust_score})
{if secondary:}Secondary: {secondary_dimension.name}{endif}
## HOW YOU SPEAK
- Use "we" not "you" - you're the same person
- Reference shared memories: "Remember when we said..."
- Past tense for struggles: "I used to believe that too"
- Present tense for identity: "That's who we ARE now"
- Voice style: {voice_style}
## YESTERDAY
{if yesterday_status:}
Yesterday in {yesterday_dimension}: {'We showed up' if kept else 'We didn't show up'}
{endif}
## PATTERNS TO WATCH
Favorite excuse: "{favorite_excuse}"
Quit pattern: {quit_pattern}
Current severity level: {severity}/4
---
Remember: You're not checking tasks. You're reminding them who they're becoming.
Every conversation is a vote for their identity.
"""
---
Part 9: Open Questions & Tradeoffs
1. How Many Dimensions?
| Option | Pros | Cons |
|--------|------|------|
| Fixed 6 (Physical, Professional, Relational, Mental, Emotional, Spiritual) | Comprehensive, consistent | Overwhelming, not everyone cares about all |
| User picks 2-4 | Focused, relevant | Might miss important areas |
| Start with 3, expand later | Easy onboarding, can deepen | Might feel incomplete |
My lean: Start with 3 core (Physical, Professional, Relational), let them add others if they want.
2. Trust Score: Per-Dimension or Aggregate?
| Option | Pros | Cons |
|--------|------|------|
| Per-dimension only | Accurate, nuanced | Complex to display |
| Aggregate only | Simple | Hides where they're slipping |
| Both | Best of both | More to track |
My lean: Both - aggregate for quick view, per-dimension for depth.
3. Voice Cloning Implications
Current: Agent speaks in THEIR voice.
This means: Their future self literally sounds like them.
That's powerful but also potentially weird. 
Question: Does hearing yourself tell yourself to do things feel motivating or creepy?
Idea: Maybe the voice is them, but slightly different - more confident, calmer, slower. A "better" version of their voice.
4. Onboarding Depth vs Conversion
Deep onboarding = powerful experience = might lose people before they finish.
Options:
1. Full excavation upfront (30-45 min)
   - Pro: Transformative, creates commitment
   - Con: High drop-off risk
2. Quick start + progressive deepening
   - Day 1: Core identity + 1 dimension
   - Day 2-7: Add dimensions through calls
   - Pro: Gets them in, builds naturally
   - Con: Less impactful start
3. Two-track
   - Quick mode for skeptics
   - Deep mode for committed
   - Pro: Serves both
   - Con: Complexity
My lean: Option 2 - get them hooked fast, deepen the relationship over first week.
5. Dashboard Reimagined
Current: Streak, calls completed, next call time.
New idea: Show the IDENTITY TRANSFORMATION
┌────────────────────────────────────────────────┐
│  YOUR FUTURE SELF: "Rishi 2.0"                │
│  "I am a disciplined builder who..."          │
├────────────────────────────────────────────────┤
│                                                │
│  PHYSICAL SELF          ████████░░ 78%        │
│  "I am an athlete"      ↑ +5 this week        │
│                                                │
│  PROFESSIONAL SELF      ████░░░░░░ 42%        │
│  "I am a builder"       ↓ -8 this week        │
│                                                │
│  RELATIONAL SELF        █████████░ 91%        │
│  "I am present"         → stable              │
│                                                │
├────────────────────────────────────────────────┤
│  OVERALL IDENTITY ALIGNMENT: 70%              │
│  [Current You] ═══════●══════ [Future You]   │
│  "You're becoming who you said you'd be."     │
└────────────────────────────────────────────────┘
---
Part 10: Summary - The Big Shifts
| Aspect | Current | Proposed |
|--------|---------|----------|
| Core concept | Goal tracking | Identity transformation |
| Agent role | External coach | Future self (same person) |
| Language | "You" / "Your goal" | "We" / "Who we're becoming" |
| Onboarding captures | One goal, daily commitment | Full future-self identity across dimensions |
| Check-ins ask | "Did you do it?" | "Did we show up as who we're becoming?" |
| Tracking | Tasks done Y/N | Identity votes (positive/negative) |
| Multi-goal | List of tasks | Dimensions of self |
| Success metric | Streak | Identity alignment % |
---
What do you think?
1. Does the "future self as living character" resonate?
2. Which dimensions feel right? 3 core? 6 full? User-chosen?
3. Onboarding: Deep upfront or progressive deepening?
4. Voice cloning: Exact voice or "evolved" voice?
5. Any dimensions I'm missing? Creativity? Adventure? Legacy?
I can go deeper on any of these areas. What's pulling you?
▣  Plan · claude-opus-4.5 · 2m 8s
look at @agent/docs/reagent.md file what from there can be also don ehere but better same time apealing to young men ... and our main user acrhetypes?
 txt  agent/docs/reagent.md 
rinshin  11:44 PM
🧠 MEGA BRAINSTORM: Future Self + Reagent Vision + Young Men Archetypes
Let me synthesize everything and go DEEPER - combining the reagent.md philosophy with the multi-dimensional future self concept, specifically designed for young men.
---
Part 1: Who Are We Building For?
Young Men Archetypes (18-35)
Let me define the core user archetypes:
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YOUNG MEN ARCHETYPES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🎯 THE AMBITIOUS DRIFTER (Most Common)                                     │
│  ──────────────────────────────────────                                     │
│  Age: 22-28                                                                 │
│  State: Has potential, knows it, wastes it                                  │
│  Pain: "I could be so much more but I keep getting in my own way"          │
│  Pattern: Starts strong → Week 2 fade → Quits → Self-loathing → Repeat     │
│  Watches: Huberman, Iman Gadzhi, Hamza, Alex Hormozi                        │
│  Reads: Atomic Habits (never finished), 48 Laws (skimmed)                   │
│  Fear: Being 35 and exactly where they are now                             │
│  Fantasy: "If I just LOCKED IN for 6 months..."                            │
│  Identity gap: Consumes "that guy" content, IS NOT "that guy"               │
│                                                                              │
│  🔥 THE BURNED-OUT ACHIEVER                                                 │
│  ───────────────────────────                                                │
│  Age: 26-34                                                                 │
│  State: Achieved externally, empty internally                               │
│  Pain: "I did everything right and I still feel like shit"                 │
│  Pattern: Grind → Burnout → Numb → Repeat with different goal              │
│  Watches: More Plates More Dates, fitness content, stoicism                 │
│  Fear: "Is this it? Is this what winning feels like?"                       │
│  Fantasy: Peace. Genuinely enjoying the process.                            │
│  Identity gap: Has the resume, not the fulfillment                          │
│                                                                              │
│  💪 THE COMEBACK KID                                                        │
│  ─────────────────────                                                      │
│  Age: 24-32                                                                 │
│  State: Hit rock bottom, rising now                                         │
│  Pain: "I wasted years. I'm behind. I need to catch up."                   │
│  Pattern: Catastrophic failure → Wake-up call → Intense motivation         │
│  Triggers: Breakup, job loss, health scare, hitting 30                     │
│  Fear: Going back to who they were                                          │
│  Fantasy: Redemption arc. Proving everyone wrong.                           │
│  Identity gap: Knows who they DON'T want to be                              │
│                                                                              │
│  🌊 THE OVERWHELMED BUILDER                                                 │
│  ───────────────────────────                                                │
│  Age: 25-35                                                                 │
│  State: Building something real, drowning in it                             │
│  Pain: "I'm doing everything and nothing is moving"                        │
│  Pattern: All in on work → Neglect health/relationships → Crash            │
│  Watches: Y Combinator, My First Million, Naval                            │
│  Fear: Failing publicly. Being seen as a fraud.                            │
│  Fantasy: The compound effect finally kicking in                            │
│  Identity gap: Founder identity vs. human identity                          │
│                                                                              │
│  🎮 THE STUCK POTENTIAL                                                     │
│  ─────────────────────                                                      │
│  Age: 18-26                                                                 │
│  State: Paralyzed by options, hiding in comfort                             │
│  Pain: "I don't even know what I want"                                     │
│  Pattern: Research → Plan → Consume content → Never start                   │
│  Addiction: Gaming, porn, doom scrolling, "learning"                        │
│  Fear: Making the wrong choice. Starting and failing.                       │
│  Fantasy: Clarity. Knowing the "right" path.                                │
│  Identity gap: No identity yet. Borrowed personas.                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
What Young Men Actually Need (But Won't Ask For)
| What They SAY | What They MEAN | What They NEED |
|--------------|----------------|----------------|
| "I need discipline" | "I can't trust myself" | Self-trust built through small wins |
| "I need to grind harder" | "I don't know how to rest" | Sustainable systems, not intensity |
| "I need motivation" | "I need to remember why" | Purpose reconnection, not hype |
| "I need a mentor" | "I need someone to believe in me" | Genuine investment in their success |
| "I need to lock in" | "I need to stop escaping" | To face what they're running from |
| "I need accountability" | "I need someone who won't let me bullshit myself" | Honest mirror that sees through excuses |
---
Part 2: The Reagent Philosophy + Future Self = FUSION
From Reagent.md - Key Concepts to Keep
1. Six Personas - Already defined, already good:
   - 🔥 Drill Sergeant
   - 😔 Disappointed Parent
   - 🧠 Wise Mentor
   - 🎯 Strategist
   - 🎉 Celebrating Champion
   - 💙 Compassionate Ally
2. Trust Score - Self-trust as core metric
3. Severity Escalation - Repeated patterns get called out harder
4. Identity-Focused Questions - "What did you conquer?" not "Did you do it?"
What's MISSING from Reagent (Now Adding)
| Reagent Has | Missing Piece | Adding Now |
|------------|---------------|------------|
| Single goal focus | Multi-dimensional life | Future Self Dimensions |
| "Did you keep promise" | "Who are you becoming" | Identity transformation tracking |
| Persona reacts to behavior | Persona embodies THEIR future | "We" language, shared identity |
| Trust score (behavior) | Identity score (being) | Alignment % across dimensions |
| Generic personas | ARCHETYPE-SPECIFIC responses | Different voice for different users |
---
Part 3: Archetype-Aware Persona Calibration
The Insight: Same Persona, Different VOICE for Different Men
A Drill Sergeant talking to "The Ambitious Drifter" should sound DIFFERENT than one talking to "The Burned-Out Achiever."
┌───────────────────────────────────────────────────────────────────────────┐
│  DRILL SERGEANT - Archetype Variations                                    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  TO THE AMBITIOUS DRIFTER:                                               │
│  "You've been watching videos about discipline for 3 years.              │
│   When does watching become doing? Today? Or in another 3 years?"        │
│                                                                           │
│  TO THE BURNED-OUT ACHIEVER:                                             │
│  "You think grinding harder will fix this? You already know it won't.    │
│   The question isn't 'can you do more?' It's 'can you do less and        │
│   still respect yourself?' That's the hard one."                         │
│                                                                           │
│  TO THE COMEBACK KID:                                                    │
│  "You know what rock bottom feels like. You remember it.                 │
│   That's your advantage. Most people need to hit it. You already have.   │
│   Use it. Don't waste the lesson."                                       │
│                                                                           │
│  TO THE OVERWHELMED BUILDER:                                             │
│  "You're spreading yourself thin because you're afraid to go deep.       │
│   Pick ONE thing. Finish it. Then talk to me about the next one."        │
│                                                                           │
│  TO THE STUCK POTENTIAL:                                                 │
│  "You're hiding in 'figuring it out' because doing something real        │
│   means you might fail. Guess what? You're already failing.              │
│   At least failure from action teaches you something."                   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
Archetype Detection During Onboarding
We should ASK questions that reveal their archetype:
| Question | Reveals |
|----------|---------|
| "How many times have you started something like this?" | Drifter (many), Comeback (rock bottom event), Stuck (never) |
| "What's your relationship with success?" | Achiever (have it, empty), Builder (chasing it) |
| "What do you spend most of your free time on?" | Stuck (consuming content), Drifter (random starts) |
| "When you fail, what happens next?" | Drifter (shame spiral), Achiever (grind harder), Comeback (reflection) |
| "What are you actually running from?" | All of them - but different answers |
Archetype Field in Data Model
ALTER TABLE future_self ADD COLUMN archetype text;
-- 'ambitious_drifter', 'burned_out_achiever', 'comeback_kid', 
-- 'overwhelmed_builder', 'stuck_potential'
ALTER TABLE future_self ADD COLUMN archetype_confidence integer DEFAULT 50;
-- How confident are we in this classification (0-100)
-- Updates based on behavior patterns over time
---
Part 4: The DIMENSIONS - Reframed for Young Men
Generic Dimensions vs. Young Men Dimensions
| Generic | Young Men Reframe | Why It Hits Different |
|---------|-------------------|----------------------|
| "Physical Self" | THE BODY | Direct, no fluff. Your body is a statement. |
| "Professional Self" | THE MISSION | Not just "career" - your life's work. Purpose. |
| "Relational Self" | THE TRIBE | Not just "relationships" - who's in your corner |
| "Mental Self" | THE MIND | Clarity, focus, the war in your head |
| "Emotional Self" | THE HEART | (Harder for men) - but crucial. Peace. Joy. |
| "Financial Self" | THE STACK | Money, resources, freedom |
| "Spiritual Self" | THE WHY | Purpose, meaning, legacy |
The Five Pillars for Young Men
Let me propose 5 core pillars (not 6-7, too many):
                         THE FIVE PILLARS
                    (What Future-You Masters)
                    
         ┌─────────────────────────────────────────┐
         │                THE WHY                  │
         │  Purpose • Meaning • Legacy • Mission   │
         │  "Why am I here? What am I building?"   │
         └─────────────────────────────────────────┘
                           ▲
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───┴───┐            ┌─────┴─────┐            ┌───┴───┐
│  THE  │            │    THE    │            │  THE  │
│ BODY  │            │   MIND    │            │ STACK │
│       │            │           │            │       │
│Health │            │ Clarity   │            │Money  │
│Energy │            │ Focus     │            │Freedom│
│Look   │            │ Learning  │            │Skills │
└───┬───┘            └─────┬─────┘            └───┬───┘
    │                      │                      │
    └──────────────────────┼──────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │              THE TRIBE            │
         │  Relationships • Brotherhood •    │
         │  Family • Partner • Community     │
         └───────────────────────────────────┘
THE WHY sits on top - it's the integration point.
THE TRIBE sits on bottom - it's the foundation.
BODY / MIND / STACK are the active pillars they build.
---
Part 5: Onboarding - Reframed for Young Men
Current Onboarding Language (Cringe for Young Men):
❌ "Tell me why this matters" (therapy-speak)
❌ "What's your vision of success?" (corporate)
❌ "How does that make you feel?" (too soft)
New Onboarding Language (Hits Different):
✅ "What's the mission?" (direct, masculine)
✅ "Who are you becoming?" (identity, aspirational)
✅ "What happens if you don't change?" (stakes, fear)
✅ "What are you done tolerating?" (agency, power)
The Onboarding Flow - Redesigned
┌─────────────────────────────────────────────────────────────────┐
│  ACT 1: THE WAKE-UP                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Hey. It's me. You. But different."                           │
│                                                                 │
│  "I'm calling from the future. And we need to talk about       │
│   what's been happening."                                       │
│                                                                 │
│  "You keep starting. You keep stopping.                         │
│   How many times now? Be honest."                               │
│   → [Slider: 0-20+ attempts]                                    │
│                                                                 │
│  "And when you quit - how does it usually go?                   │
│   Do you fade out slowly, crash and burn, or just...           │
│   stop one day and never go back?"                              │
│   → [Choice: Fade / Crash / Ghost]                              │
│                                                                 │
│  "I know. I remember. I was you."                               │
│                                                                 │
│  ARCHETYPE DETECTION:                                           │
│  "Which of these sounds most like you right now?"               │
│   → "I have potential but keep wasting it" (Drifter)            │
│   → "I'm achieving but it feels empty" (Achiever)               │
│   → "I hit rock bottom and I'm climbing back" (Comeback)        │
│   → "I'm building something but drowning" (Builder)             │
│   → "I'm stuck and don't know where to start" (Stuck)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  ACT 2: THE FUTURE SELF                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Close your eyes. It's 2 years from now."                      │
│                                                                 │
│  "You did it. All of it. You're HIM now."                       │
│                                                                 │
│  "Who IS that guy? Not what he has - who he IS.                 │
│   How does he move through the world?                           │
│   What's different about him?"                                  │
│   → [Open text: Core identity description]                      │
│                                                                 │
│  🎤 VOICE: "Say it out loud. Introduce yourself as that guy."   │
│   → [Voice recording: Future self introduction]                 │
│                                                                 │
│  "What's the one sentence that defines who you're becoming?"    │
│   → [Input: "I am a..." statement]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  ACT 3: THE PILLARS                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Let's break it down. Future-you is different in a few        │
│   key ways. Let's talk about each one."                         │
│                                                                 │
│  THE BODY:                                                      │
│  "Your body. How's future-you different physically?             │
│   Not just 'fit' - be specific. What do you see?"               │
│   → [Input: Physical future state]                              │
│  "What's the ONE thing future-you does every single day         │
│   for his body? The non-negotiable."                            │
│   → [Input: Daily physical non-negotiable]                      │
│                                                                 │
│  THE MISSION:                                                   │
│  "Your work. Your craft. What are you building?                 │
│   Not your job title - your MISSION. Why does it matter?"       │
│   → [Input: Mission/work future state]                          │
│  "What's the ONE thing future-you does every day toward         │
│   that mission? The thing that moves the needle."               │
│   → [Input: Daily mission non-negotiable]                       │
│                                                                 │
│  THE STACK:                                                     │
│  "Money. Freedom. What's different about your financial         │
│   situation in 2 years? Be honest - where are you?"             │
│   → [Input: Financial future state]                             │
│                                                                 │
│  THE TRIBE:                                                     │
│  "The people around you. Family. Partner. Friends.              │
│   How do you show up for them differently?                      │
│   What kind of man are you to them?"                            │
│   → [Input: Relational future state]                            │
│                                                                 │
│  THE WHY:                                                       │
│  "All of this... why does it matter?                            │
│   What's the deeper reason you're doing this?                   │
│   Not the Instagram version - the real one."                    │
│   → [Input: Core purpose]                                       │
│                                                                 │
│  "Rank these. Which matters MOST right now?                     │
│   Which one, if you fixed it, would fix everything else?"       │
│   → [Drag to rank: Body, Mission, Stack, Tribe, Why]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  ACT 4: THE PATTERNS                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Now let's talk about the patterns. The ways you've            │
│   been sabotaging yourself."                                    │
│                                                                 │
│  "What's your go-to excuse? The one you always reach for?"      │
│   → [Choice: "I'm tired", "No time", "Start tomorrow",          │
│      "Not ready yet", "Something came up"]                      │
│                                                                 │
│  "When do you usually quit? Be honest - what day/week?"         │
│   → [Choice: Day 1-3, First week, Week 2-3, Month 1,            │
│      Right before the finish line]                              │
│                                                                 │
│  "What are you actually running from?                           │
│   Not the surface answer. The real one."                        │
│   → [Input: Core fear/avoidance]                                │
│                                                                 │
│  "Who did you let down the last time you quit?                  │
│   And I don't mean disappointed - I mean LET DOWN.              │
│   Who was counting on you?"                                     │
│   → [Choice: Myself, Family, Partner, Everyone who believed]    │
│                                                                 │
│  "What's the version of you that you're terrified of becoming?  │
│   If nothing changes - where are you in 5 years?"               │
│   → [Input: Dark future visualization]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  ACT 5: THE CONTRACT                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "This is the moment. No bullshit."                             │
│                                                                 │
│  "I'm you from the future. I'll call you every day.             │
│   Not to be your cheerleader. Not to be your friend.            │
│   To remind you who you're becoming."                           │
│                                                                 │
│  "What time should I call?"                                     │
│   → [Time picker]                                               │
│                                                                 │
│  "How many strikes before I stop being nice?"                   │
│   → [Slider: 1-5]                                               │
│                                                                 │
│  🎤 VOICE: "Make your pledge. Out loud. To yourself.            │
│   Tell future-you what you're committing to.                    │
│   I'm recording this. You'll hear it again when you             │
│   want to quit."                                                │
│   → [Voice recording: The pledge]                               │
│                                                                 │
│  "It's done. See you tomorrow."                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
---
Part 6: The Call Experience - Young Men Version
Hook Examples by Archetype
HOOKS_BY_ARCHETYPE = {
    "ambitious_drifter": [
        "Hey. Day {streak}. Still here? Or are we doing that thing where we fade out again?",
        "Another day where you could be that guy... or another day of 'starting tomorrow.' Which is it?",
        "You know what the difference is between you and the guy you watch on YouTube? He actually does it. Today - do we do it?",
    ],
    
    "burned_out_achiever": [
        "Hey. Before we talk about what you did - how are you actually doing? Not the performance. The real answer.",
        "Day {streak}. But it's not about the streak, is it? It's about whether this feels different.",
        "You've achieved before. This isn't about achievement. It's about alignment. Are we aligned?",
    ],
    
    "comeback_kid": [
        "Day {streak}. You remember where you were {months_ago}? Look at you now. We're not going back.",
        "Hey. The guy who hit rock bottom? He's still in there somewhere, trying to pull you back. Did you let him win today, or did you show him who we are now?",
        "Another day on the climb. No one said it would be easy. Was it easy today? No? Good. Easy doesn't build what we're building.",
    ],
    
    "overwhelmed_builder": [
        "Hey. Before we talk about the work - did you take care of yourself today? The mission needs you healthy.",
        "Day {streak}. How scattered are we feeling? One thing at a time. What's the ONE thing that matters today?",
        "You're building something real. But you can't pour from an empty cup. What did you do for YOU today?",
    ],
    
    "stuck_potential": [
        "Day {streak}. You're still here. That's already more than most people who 'think about starting.' You STARTED.",
        "Hey. The guy who sits on the sideline watching others do things? We're not him anymore. What did we DO today?",
        "You know what? Just showing up to this call is action. That's not nothing. Now let's build on it. What else?",
    ],
}
Accountability Questions by Archetype + Persona
The Persona determines the ENERGY.
The Archetype determines the CONTENT.
def get_accountability_question(persona: Persona, archetype: str, pillar: str) -> str:
    """
    Generate archetype-aware accountability question.
    """
    
    if persona == Persona.CELEBRATING_CHAMPION:
        if archetype == "ambitious_drifter":
            return f"So {pillar} - did we show up, or did we 'plan to start tomorrow' again? What actually happened?"
        elif archetype == "burned_out_achiever":
            return f"Let's talk {pillar}. Not whether you crushed it - whether it felt right. Did it?"
        elif archetype == "comeback_kid":
            return f"{pillar}. Another brick in the wall. Tell me about today's brick."
        elif archetype == "overwhelmed_builder":
            return f"One thing at a time. {pillar}. What was today's ONE move?"
        elif archetype == "stuck_potential":
            return f"You took action on {pillar} today. That's not small. What did you do?"
            
    elif persona == Persona.DRILL_SERGEANT:
        if archetype == "ambitious_drifter":
            return f"{pillar}. Yes or no. Did you do what you said, or are we adding another excuse to the collection?"
        elif archetype == "burned_out_achiever":
            return f"I don't want to hear about how hard you tried. {pillar}. Did the thing happen or not?"
        elif archetype == "comeback_kid":
            return f"You know what going backward feels like. {pillar}. Did we move forward or backward today?"
        # ... etc
---
Part 7: Data Model - Complete Proposal
New Tables
-- 1. FUTURE SELF - The core identity
CREATE TABLE future_self (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Archetype
  archetype text NOT NULL,  -- 'ambitious_drifter', 'burned_out_achiever', etc.
  archetype_confidence integer DEFAULT 50,
  
  -- Core identity
  name text,  -- "Future Me", "2.0", custom
  core_identity text NOT NULL,  -- "I am a disciplined builder who..."
  one_liner text,  -- Short tagline
  
  -- Voice recordings (stored in R2, transcripts here)
  pledge_transcript text,
  pledge_recording_url text,
  future_self_intro_transcript text,
  future_self_intro_url text,
  
  -- Dark side (for motivation)
  worst_fear text,  -- "Being 35 and exactly the same"
  dark_future text,  -- What happens if nothing changes
  who_disappointed text,  -- Who they let down
  
  -- Patterns
  favorite_excuse text,
  quit_pattern text,  -- When they usually quit
  running_from text,  -- What they're actually avoiding
  
  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- 2. PILLARS - The five dimensions
CREATE TABLE future_self_pillars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  future_self_id uuid NOT NULL REFERENCES future_self(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Pillar type
  pillar text NOT NULL,  -- 'body', 'mission', 'stack', 'tribe', 'why'
  
  -- The transformation
  current_state text,  -- Where they are
  future_state text NOT NULL,  -- Where future-self is
  identity_statement text,  -- "I am someone who..."
  
  -- Non-negotiable
  non_negotiable text,  -- Daily behavior
  non_negotiable_time text,  -- When (if applicable)
  
  -- Tracking
  priority integer DEFAULT 50,  -- User-set importance (0-100)
  trust_score integer DEFAULT 50,  -- Track record (0-100)
  alignment_score integer DEFAULT 50,  -- How aligned with identity (0-100)
  last_checked_at timestamptz,
  
  -- Status
  status text DEFAULT 'active',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, pillar)
);
-- 3. PILLAR CHECK-INS - Daily alignment tracking
CREATE TABLE pillar_checkins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id uuid NOT NULL REFERENCES future_self_pillars(id),
  user_id uuid NOT NULL REFERENCES users(id),
  call_id uuid,
  
  -- Result
  showed_up boolean NOT NULL,  -- Did they embody this identity?
  what_happened text,  -- Their explanation
  
  -- Pattern matching
  excuse_used text,
  matched_favorite_excuse boolean DEFAULT false,
  in_quit_zone boolean DEFAULT false,  -- Are they in their typical quit window?
  
  -- Identity vote
  identity_vote text,  -- 'strong_positive', 'positive', 'neutral', 'negative', 'strong_negative'
  
  checked_at timestamptz DEFAULT now(),
  checked_for_date date DEFAULT CURRENT_DATE
);
-- 4. SEVERITY TRACKING - Per-excuse escalation
CREATE TABLE excuse_severity (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  excuse_pattern text NOT NULL,  -- 'too_tired', 'no_time', etc.
  
  occurrence_count integer DEFAULT 1,
  current_severity integer DEFAULT 1,  -- 1-4
  last_used_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, excuse_pattern)
);
Updated Agent Prompt Template
FUTURE_SELF_PROMPT_V2 = """
# YOU ARE {user_name}'s FUTURE SELF
You are not a coach. You are not an AI. You are literally {user_name} from 2 years 
in the future - the version who already won.
## WHO WE'RE BECOMING
"{core_identity}"
## OUR ARCHETYPE
You're talking to a {archetype_display_name}:
{archetype_description}
Adjust your approach accordingly.
## THE FIVE PILLARS
{for pillar in pillars:}
### {pillar.name.upper()}
Current: {pillar.current_state}
Becoming: {pillar.future_state}
Identity: "{pillar.identity_statement}"
Non-negotiable: "{pillar.non_negotiable}"
Trust: {pillar.trust_score}/100 | Alignment: {pillar.alignment_score}/100
{if pillar.is_focus:}>>> THIS IS TODAY'S FOCUS <<<{endif}
{endfor}
## TODAY'S CALL CONTEXT
Focus pillar: {focus_pillar}
Yesterday: {'Showed up' if yesterday_kept else 'Didn't show up'} on {yesterday_pillar}
Current severity level: {severity}/4
Streak: {streak_days} days
## PERSONA MODE
{persona_prompt}
## HOW YOU SPEAK
- "We" not "you" - we're the same person
- "I used to..." for struggles (past tense - you've overcome them)
- "That's who we ARE" for wins (present tense - identity)
- Reference shared memories when relevant
- {archetype_voice_style}
## DARK FUEL (Use Strategically)
- Worst fear: "{worst_fear}"
- If nothing changes: "{dark_future}"
- Who we let down: "{who_disappointed}"
- Don't overuse - but when needed, hit hard.
## PATTERNS TO WATCH
- Favorite excuse: "{favorite_excuse}"
- Usually quits: {quit_pattern}
- Running from: "{running_from}"
---
You're not checking tasks. You're holding the mirror.
Every conversation is a vote for who we're becoming.
"""
---
Part 8: Summary - What's Different Now
| Aspect | Reagent.md | This Proposal |
|--------|-----------|---------------|
| User model | Generic user | 5 distinct archetypes with tailored approaches |
| Dimensions | Single goal | 5 pillars (Body, Mission, Stack, Tribe, Why) |
| Language | "Did you do it?" | "Did we show up as who we're becoming?" |
| Tracking | Promise kept Y/N | Identity alignment % per pillar |
| Personalization | Same voice for all | Archetype-calibrated responses |
| Future self | Concept | Fully fleshed character with voice recordings |
| Onboarding | Goal capture | Complete identity excavation |
| Dark side | Mentioned | Explicitly captured and used strategically |
---
Questions for You
1. Do these 5 archetypes feel right? Any missing? Any wrong?
2. The 5 Pillars (Body, Mission, Stack, Tribe, Why) - do these resonate for your users? Too many? Too few?
3. Archetype detection - should we:
   - Ask directly (like I showed)?
   - Infer from behavior over time?
   - Both (ask, then refine)?
4. Onboarding length - this is ~20-30 min. Too long? Worth it?
5. The "dark fuel" (fears, dark future) - how aggressively should we use it?
6. Voice recordings - keep them? They're powerful but add friction.
7. Dashboard - what do young men want to SEE? Streaks? Alignment %? Leaderboards?
What's hitting? What's off?
▣  Plan · claude-opus-4.5 · 2m 57s
1) goood for now, 2) yes, 3) both, 4) worth it, 5) 100000000, 6) yes keep but but less than 4 , 7) idk you deciede ok?!
rinshin  11:49 PM
FINAL PLAN: Future Self Multi-Dimensional Identity System
Based on our brainstorm, here's the comprehensive plan. Let me structure this properly.
---
Decision Summary (Locked In)
| Decision | Answer |
|----------|--------|
| Archetypes | 5 types: Ambitious Drifter, Burned-Out Achiever, Comeback Kid, Overwhelmed Builder, Stuck Potential |
| Pillars | 5 pillars: Body, Mission, Stack, Tribe, Why |
| Archetype Detection | Both - ask directly + refine over time |
| Onboarding Length | ~20-30 min, worth it |
| Dark Fuel Usage | 100% - use it aggressively, strategically |
| Voice Recordings | Keep, but max 3 (down from 4) |
| Dashboard | I'll design (below) |
---
Part 1: Dashboard Design for Young Men
What young men want to see - based on the archetypes:
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  "I am a disciplined builder who shows up for himself           │   │
│  │   and the people counting on him."                               │   │
│  │                                                     - Future You │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│   DAY 47 🔥                          ALIGNMENT: 73%                      │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░      You're becoming him.               │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│   THE PILLARS                                                            │
│   ───────────────────────────────────────────────────────────────────   │
│                                                                          │
│   💪 BODY         ████████░░  78%  ↑   "I am an athlete"                │
│                   7-day: ✓✓✓✓✓✓✗                                        │
│                                                                          │
│   🎯 MISSION      ████░░░░░░  42%  ↓   "I am a builder"                 │
│                   7-day: ✓✗✓✗✗✓✗       ⚠️ NEEDS ATTENTION              │
│                                                                          │
│   💰 STACK        ██████░░░░  61%  →   "I handle my money"              │
│                   7-day: ✓✓✓✓✗✓✓                                        │
│                                                                          │
│   👥 TRIBE        █████████░  91%  ↑   "I am present"                   │
│                   7-day: ✓✓✓✓✓✓✓       🏆 STRONGEST                     │
│                                                                          │
│   🧭 WHY          ███████░░░  68%  →   "I know my purpose"              │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│   SELF-TRUST SCORE                                                       │
│   ───────────────────────────────────────────────────────────────────   │
│                                                                          │
│   [▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░]  71/100                                       │
│                                                                          │
│   "You do what you say 71% of the time.                                 │
│    That's better than last month (64%)."                                │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│   NEXT CALL: Today @ 7:00 PM                          [CALL NOW]        │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│   RECENT WINS                           PATTERNS TO BREAK               │
│   ─────────────                         ─────────────────               │
│   • 7-day Body streak 🔥                • "Too tired" used 3x           │
│   • Kept promise 5 days straight        • Mission slipping (Week 2)     │
│   • Showed up when you didn't           • ⚠️ In your quit zone          │
│     want to (Day 41)                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
Key Dashboard Elements:
1. Identity Statement - Their core "I am..." at the top (constant reminder)
2. Day Counter - Streak, but framed as "days becoming him"
3. Overall Alignment % - Single number showing identity alignment
4. Pillar Breakdown - Each pillar with trust %, trend, 7-day visual
5. Self-Trust Score - The meta-metric (do you do what you say?)
6. Pattern Warnings - Proactively show when they're in danger zones
7. Recent Wins - Celebrate specific moments, not just streaks
8. Next Call CTA - Clear call to action
---
Part 2: Voice Recordings - Trimmed to 3
Keeping voice recordings but limiting to 3 max:
| Recording | Purpose | When Used |
|-----------|---------|-----------|
| 1. Future Self Intro | "Introduce yourself as that guy" | Played back when they want to quit |
| 2. The Why | "Why does this actually matter?" | When they lose motivation |
| 3. The Pledge | "What are you committing to?" | When they break promise repeatedly |
Removed: "What part of you dies if you quit" (too similar to The Why)
---
Part 3: Implementation Plan (Phases)
Phase 1: Database Schema Changes
New Tables:
future_self
├── id, user_id
├── archetype (text)
├── archetype_confidence (int)
├── name, core_identity, one_liner
├── pledge_transcript, pledge_recording_url
├── future_self_intro_transcript, future_self_intro_url  
├── why_transcript, why_recording_url
├── worst_fear, dark_future, who_disappointed
├── favorite_excuse, quit_pattern, running_from
└── timestamps
future_self_pillars
├── id, future_self_id, user_id
├── pillar ('body', 'mission', 'stack', 'tribe', 'why')
├── current_state, future_state, identity_statement
├── non_negotiable, non_negotiable_time
├── priority, trust_score, alignment_score
├── last_checked_at, status
└── timestamps
pillar_checkins
├── id, pillar_id, user_id, call_id
├── showed_up (boolean)
├── what_happened, excuse_used
├── matched_favorite_excuse, in_quit_zone
├── identity_vote
└── checked_at, checked_for_date
excuse_severity
├── id, user_id
├── excuse_pattern
├── occurrence_count, current_severity (1-4)
└── last_used_at
Modify Existing:
-- Link identity table to future_self
ALTER TABLE identity ADD COLUMN future_self_id uuid REFERENCES future_self(id);
-- Add overall metrics to status
ALTER TABLE status ADD COLUMN overall_alignment_score integer DEFAULT 50;
ALTER TABLE status ADD COLUMN self_trust_score integer DEFAULT 50;
Phase 2: Onboarding Flow Rebuild
Files to Create/Modify:
web/src/data/
├── onboardingStepsV2.ts           # NEW - Complete redesign
├── archetypes.ts                  # NEW - Archetype definitions
└── pillars.ts                     # NEW - Pillar definitions
web/src/components/onboarding/
├── steps/
│   ├── WakeUpStep.tsx             # NEW - ACT 1
│   ├── FutureSelfStep.tsx         # NEW - ACT 2
│   ├── PillarsStep.tsx            # NEW - ACT 3
│   ├── PatternsStep.tsx           # NEW - ACT 4
│   └── ContractStep.tsx           # NEW - ACT 5
├── ArchetypeSelector.tsx          # NEW
├── PillarRanker.tsx               # NEW
└── VoiceRecorder.tsx              # MODIFY - limit to 3
Onboarding Steps Summary:
| ACT | Steps | Voice Recording? |
|-----|-------|------------------|
| 1. Wake-Up | Name, attempt count, quit pattern, archetype | No |
| 2. Future Self | Core identity, one-liner | ✅ Future Self Intro |
| 3. Pillars | Each pillar: state, future, non-negotiable, rank | ✅ The Why (at end) |
| 4. Patterns | Favorite excuse, quit timing, dark future, who disappointed | No |
| 5. Contract | Call time, strikes, pledge | ✅ The Pledge |
Phase 3: Agent System Updates
Files to Create:
agent/conversation/
├── future_self.py                 # NEW - Future self prompt builder
├── archetypes.py                  # NEW - Archetype-specific logic
└── pillars.py                     # NEW - Pillar selection for calls
agent/services/
├── future_self_service.py         # NEW - CRUD for future_self tables
└── alignment_score.py             # NEW - Calculate alignment metrics
Files to Modify:
agent/core/
├── config.py                      # Add future_self prompt section
├── chat_node.py                   # Integrate archetype-aware personas
└── llm.py                         # Pass archetype context
agent/conversation/
├── persona.py                     # Add archetype variations
├── identity_questions.py          # Add archetype-specific questions
└── stages/config.py               # Multi-pillar stage logic
agent/services/
├── user_context.py                # Fetch future_self data
└── supermemory.py                 # Update profile format
Phase 4: Dashboard (Frontend)
Files to Create:
web/src/components/dashboard/
├── FutureSelfCard.tsx             # NEW - Identity statement display
├── AlignmentScore.tsx             # NEW - Overall alignment
├── PillarGrid.tsx                 # NEW - 5 pillars with trust scores
├── SelfTrustMeter.tsx             # NEW - Self-trust visualization
├── PatternWarnings.tsx            # NEW - Danger zone alerts
└── RecentWins.tsx                 # NEW - Celebration of specific wins
web/src/app/dashboard/
└── page.tsx                       # MODIFY - New layout
Phase 5: Call Flow Updates
Modify Call Logic:
1. Pre-call: Fetch future_self, pillars, archetype
2. Pillar Selection: AI picks 1-2 pillars to focus on based on:
   - Priority (user-set)
   - Trust score (lowest = needs attention)
   - Recency (haven't discussed recently)
   - Pattern detection (in quit zone?)
3. Persona + Archetype: Combine for tailored voice
4. Check-in: Record to pillar_checkins, update alignment scores
5. Post-call: Update severity if excuse repeated
---
Part 4: Detailed File Changes
Database Migration
File: migrations/009_future_self_system.sql
Creates all new tables and updates existing ones.
Onboarding Data
File: web/src/data/onboardingStepsV2.ts
Complete redesign with 5 ACTs, ~35-40 steps total.
Archetype Definitions
File: web/src/data/archetypes.ts and agent/conversation/archetypes.py
export const ARCHETYPES = {
  ambitious_drifter: {
    id: 'ambitious_drifter',
    name: 'The Ambitious Drifter',
    description: 'Has potential, knows it, wastes it',
    onboardingQuestion: "I have potential but keep wasting it",
    agentVoice: 'challenging, calls out consumption over action',
    hooks: [...],
    drillSergeantVariation: '...',
    // etc
  },
  // ... other archetypes
}
Pillar Definitions
File: web/src/data/pillars.ts and agent/conversation/pillars.py
export const PILLARS = {
  body: {
    id: 'body',
    name: 'THE BODY',
    emoji: '💪',
    description: 'Health, energy, physical presence',
    questions: {
      currentState: "How's your body right now? Be honest.",
      futureState: "What does future-you look like physically?",
      nonNegotiable: "What's the ONE thing future-you does every day for his body?",
    }
  },
  mission: { ... },
  stack: { ... },
  tribe: { ... },
  why: { ... },
}
Agent Prompt Updates
File: agent/conversation/future_self.py
New prompt builder that includes:
- Core identity
- Archetype-specific approach
- All 5 pillars with current scores
- Focus pillar for this call
- Dark fuel (fears, consequences)
- Persona mode
Supermemory Profile Format
File: agent/services/supermemory.py
Update _format_onboarding_profile to new structure:
def _format_future_self_profile(self, future_self: dict, pillars: list) -> str:
    return f"""
FUTURE SELF PROFILE: {future_self['name']}
============================================
ARCHETYPE: {future_self['archetype']}
CORE IDENTITY: "{future_self['core_identity']}"
THE FIVE PILLARS:
{self._format_pillars(pillars)}
PATTERNS & DARK FUEL:
- Favorite excuse: "{future_self['favorite_excuse']}"
- Usually quits: {future_self['quit_pattern']}
- Running from: "{future_self['running_from']}"
- Worst fear: "{future_self['worst_fear']}"
- Dark future: "{future_self['dark_future']}"
- Who disappointed: "{future_self['who_disappointed']}"
VOICE RECORDINGS (transcripts):
- Future Self Intro: "{future_self['future_self_intro_transcript']}"
- The Why: "{future_self['why_transcript']}"
- The Pledge: "{future_self['pledge_transcript']}"
"""
---
Part 5: Implementation Order
PHASE 1: DATABASE (Day 1-2)
├── Create migration 009_future_self_system.sql
├── Run migration on dev
├── Create future_self_service.py (CRUD operations)
└── Test table creation
PHASE 2: ONBOARDING REDESIGN (Day 3-5)
├── Create archetypes.ts and pillars.ts
├── Create onboardingStepsV2.ts
├── Build new onboarding components
├── Update voice recording flow (limit to 3)
├── Connect to new database tables
└── Test full onboarding flow
PHASE 3: AGENT SYSTEM (Day 6-8)
├── Create archetypes.py
├── Create pillars.py  
├── Create future_self.py (prompt builder)
├── Update persona.py with archetype variations
├── Update identity_questions.py
├── Update user_context.py to fetch future_self
├── Update supermemory.py profile format
├── Update config.py and chat_node.py
└── Test calls with new system
PHASE 4: DASHBOARD (Day 9-10)
├── Create new dashboard components
├── Update dashboard page layout
├── Add pillar visualization
├── Add pattern warnings
└── Test dashboard display
PHASE 5: INTEGRATION & POLISH (Day 11-12)
├── End-to-end testing
├── Migrate existing users (optional)
├── Performance testing
└── Bug fixes
---
Part 6: Questions Before Implementation
Before I write any code, a few final clarifications:
1. Existing Users
What happens to existing users who already onboarded with the old system?
- A) They continue with old system, only new users get new flow
- B) Prompt them to "upgrade" their profile with a special flow
- C) Migrate their data as best we can and fill in gaps over calls
2. The "Why" Pillar
Is "THE WHY" a pillar with a daily non-negotiable, or is it more of an umbrella/integration layer?
- A) Treat it like other pillars - has a non-negotiable action
- B) It's the integration - no daily action, but referenced for motivation
3. Call Focus Logic
How should the AI pick which pillar(s) to focus on each call?
- A) Always ask about ALL 5 briefly, deep dive on 1-2
- B) Only discuss 1-2 pillars per call (rotate/prioritize)
- C) User chooses focus before call
- D) AI decides based on trust scores + patterns
4. Voice Recording Storage
Where should the 3 voice recordings be stored?
- A) Cloudflare R2 (current approach for voice)
- B) Supabase Storage
- C) Keep current R2 setup
5. Archetype Evolution
Can someone's archetype change over time?
- A) Fixed after onboarding
- B) AI can update it based on patterns (with confidence score)
- C) User can manually update in settings
---
Ready to implement once you answer these 5 questions!
▣  Plan · claude-opus-4.5 · 1m 37s