# Research & Design Decisions: Mascot Gamification System

**Feature**: 002-mascot-gamification  
**Date**: 2025-12-09  
**Status**: Complete

---

## Overview

This document captures the research and design decisions made for the Mascot Gamification System, including alternatives considered and rationale for choices.

---

## Decision 1: XP Economy Design

### Decision
Use a **time-to-level target** approach: active users reach Level 10 in ~8-15 days.

### Rationale
- Provides clear framework for deriving all XP values
- Ensures progression feels achievable but meaningful
- Avoids arbitrary number selection
- Enables easy rebalancing by adjusting target timeline

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Fixed XP per action (arbitrary) | No underlying logic; constant rebalancing needed |
| Match competitor values | Different engagement models; not directly comparable |
| User-adjustable difficulty | Over-complicates; users don't want to manage this |

### Implementation
```
Daily XP Budget (fully engaged): ~300 XP
Level 10 XP Required: ~1,750 XP
Days to Level 10: 1,750 / 300 = ~6 days (max engagement)
With casual engagement (50%): ~12 days
```

---

## Decision 2: Mascot Evolution Stages

### Decision
5 distinct evolution stages with unique SVG designs at level thresholds: 1, 11, 26, 51, 76.

### Rationale
- Creates clear visual progression milestones
- Matches typical game evolution systems (5 stages is standard)
- Thresholds align with XP curve inflection points
- Each stage represents meaningful time investment

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| 3 stages | Too few milestones; evolution too rare |
| 10 stages | Too many assets; evolution too frequent |
| Gradual morphing | Technically complex; less satisfying "aha" moments |
| Customizable evolution paths | Scope creep; save for future |

### Stage Names & Themes
| Stage | Name | Theme | Visual Concept |
|-------|------|-------|----------------|
| 1 | Spark | Beginning | Small, simple, curious |
| 2 | Ember | Growth | Larger, defined features, subtle glow |
| 3 | Flame | Competence | Full-sized, expressive, warm aura |
| 4 | Blaze | Mastery | Confident, radiant, defined presence |
| 5 | Inferno | Legend | Majestic, particle effects, legendary status |

---

## Decision 3: Mascot Mood System

### Decision
7 mood states with explicit priority ordering and threshold-based triggers.

### Rationale
- Provides clear, predictable behavior
- Priority order prevents conflicting moods
- Thresholds enable testing and debugging
- Covers full spectrum of user states

### Mood Priority Order
```
1. Celebrating (highest) - level up or achievement in last 24h
2. Proud - streak ≥7 AND trust ≥70
3. Happy - any XP earned today
4. Sleeping - energy = 0
5. Sad - streak just broken OR energy <20
6. Concerned - energy <50 OR missed yesterday with active streak
7. Neutral (lowest) - default state
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Continuous mood scale | Hard to visualize; discrete states easier for animation |
| User-set mood | Defeats purpose of behavioral feedback |
| AI-generated mood | Unpredictable; testing nightmare |

---

## Decision 4: Streak Shield Mechanics

### Decision
Auto-consume shields on missed days. Earn 1 shield per 30-day streak milestone. Max 3 stored.

### Rationale
- Auto-consume prevents "I forgot to use it" frustration
- 30-day earning cadence rewards long-term commitment
- Max 3 prevents hoarding and maintains stakes
- Simple UX; no user decision required

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Manual shield activation | UX friction; users forget and feel cheated |
| Purchase shields | Monetization not in scope; feels pay-to-win |
| Unlimited shields | Removes accountability stakes |
| No shields | Too punishing; causes user churn |

### Shield Logic
```
Nightly Cron:
  IF user.missed_yesterday AND user.current_streak > 0:
    IF user.streak_shields > 0:
      user.streak_shields -= 1
      # Streak preserved
      notify("Shield used! Streak protected.")
    ELSE:
      user.current_streak = 0
      user.mascot_mood = "sad"
```

---

## Decision 5: Achievement Notification UX

### Decision
Toast notifications for common/rare achievements. Full-screen modal for epic/legendary.

### Rationale
- Prevents notification fatigue from common unlocks
- Epic/legendary achievements deserve celebration
- Matches user expectations from other gamified apps
- Modal creates "moment" for major milestones

### Notification Types
| Rarity | Notification | Duration |
|--------|--------------|----------|
| Common | Toast (bottom) | 3s auto-dismiss |
| Rare | Toast (bottom) | 5s auto-dismiss |
| Epic | Full-screen modal | User dismisses |
| Legendary | Full-screen modal + confetti | User dismisses |

---

## Decision 6: Accessory Rendering

### Decision
SVG overlays rendered on top of mascot SVG with z-index layering.

### Rationale
- Smaller file sizes than image sprites
- Infinite scaling without quality loss
- Easier to animate with CSS
- Can be colored/themed dynamically
- Matches existing mascot SVG approach

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Pre-rendered sprite sheets | Large file sizes; every combination needs rendering |
| Canvas rendering | More complex; harder to animate |
| 3D model | Massive scope creep; overkill |

### Layer Order (z-index)
```
Background effects (0)
Mascot base SVG (10)
Body accessories (20)
Eyewear (30)
Headwear (40)
Foreground effects (50)
```

---

## Decision 7: Leaderboard Design

### Decision
Weekly leaderboard with pre-computed ranks, anonymous display (level + mascot stage only).

### Rationale
- Weekly reset keeps competition fresh
- Pre-computed ranks avoid expensive real-time queries
- Anonymous display protects privacy
- 24h rank staleness is acceptable

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Real-time ranking | O(n) query per user view; doesn't scale |
| All-time leaderboard | Intimidating for new users; never catch up |
| Daily leaderboard | Too volatile; not enough time to compete |
| Named leaderboard | Privacy concerns; potential harassment |

### Rank Calculation (Nightly)
```sql
WITH ranked AS (
  SELECT 
    user_id,
    xp_earned,
    ROW_NUMBER() OVER (ORDER BY xp_earned DESC) as rank
  FROM weekly_leaderboard
  WHERE week_start = current_week_start()
)
UPDATE weekly_leaderboard wl
SET rank = r.rank
FROM ranked r
WHERE wl.user_id = r.user_id;
```

---

## Decision 8: Daily Challenge Generation

### Decision
Generate personalized challenges at midnight user timezone, weighted toward user's weak pillars.

### Rationale
- Timezone-aware ensures fair 24h window
- Weakness weighting helps struggling users improve
- Variety prevents monotony
- Personalization increases relevance

### Challenge Types
| Type | Description | XP | Weight |
|------|-------------|-----|--------|
| pillar_focus | Complete specific pillar | 75 | High if pillar struggling |
| all_pillars | Complete all pillars | 100 | Medium |
| call_speed | Answer call within 30s | 50 | Low |
| no_excuse | Complete without excuse | 75 | High if excuse pattern |
| reflection | Add note to check-in | 50 | Low |

### Generation Algorithm
```python
def generate_challenge(user):
  weights = calculate_weights(user.pillar_stats, user.patterns)
  challenge_type = weighted_random(CHALLENGE_TYPES, weights)
  config = build_config(challenge_type, user)
  return DailyChallenge(
    type=challenge_type,
    config=config,
    xp_reward=XP_BY_TYPE[challenge_type],
    expires_at=user.midnight_tomorrow()
  )
```

---

## Decision 9: XP Transaction Architecture

### Decision
Event-driven architecture with atomic XP transactions and eventual achievement checks.

### Rationale
- Atomic transactions prevent XP data loss
- Eventual achievement checks allow async processing
- Decoupled services are easier to maintain
- Failure in achievements doesn't block XP

### Architecture
```
Action (pillar check-in)
    │
    ▼
┌─────────────────┐
│  XP Engine      │ ← Atomic transaction
│  (award XP)     │
└────────┬────────┘
         │ emit event
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Level Checker   │     │ Achievement     │
│ (async)         │     │ Checker (async) │
└─────────────────┘     └─────────────────┘
```

---

## Decision 10: Database Schema Design

### Decision
7 new tables with clear separation of static definitions and user state.

### Rationale
- Static tables (achievements, accessories) enable seeding and updates
- User state tables (user_achievements, user_accessories) track individual progress
- Transaction log (xp_transactions) enables auditing and debugging
- Separate weekly_leaderboard for performance

### Table Relationships
```
users
  └── user_progression (1:1)
  └── user_achievements (1:N) ─── achievements (N:1)
  └── user_accessories (1:N) ─── mascot_accessories (N:1)
  └── xp_transactions (1:N)
  └── daily_challenges (1:N)
  └── weekly_leaderboard (1:N)
```

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Should mascot evolution be reversible? | No - evolution is permanent, represents growth |
| Can users lose levels? | No - XP can decrease but level floor is maintained |
| What happens at Level 100? | Stay at 100, XP continues (prestige system future) |
| Multiple accessories same category? | No - one per category, swap replaces |

---

## Future Considerations

These items are explicitly out of scope but noted for future work:

1. **Prestige System** - Reset to Level 1 with permanent cosmetic reward
2. **Friend System** - Accountability partners, shared achievements
3. **Seasonal Events** - Time-limited achievements and accessories
4. **Guilds/Teams** - Group accountability with shared goals
5. **Custom Challenges** - User-created challenges for others
6. **Trading** - Exchange accessories with other users

---

## Decision 11: Pillar-Health-Based Mood with Shame System

### Date
2025-12-09

### Decision
The mascot mood reflects **real life progress** (pillar health), not just activity. 
Additionally, the mascot visually deteriorates when abandoned, creating healthy shame 
that motivates return and prevents the quitting cycle.

### Philosophy
> "The mascot is a mirror. It shows them what they did."

This answers Christensen's question: "Does this make the user a better version of 
themselves, or does this distract them from that goal?"

A user who shows up every day but isn't improving their pillars should NOT have a 
happy mascot. The mascot should be concerned — because it cares about the user, 
not the streak.

### Rationale
- YOU+ exists to stop the quitting cycle
- Users need to feel the cost of abandonment
- Shame without redemption = churn; shame with clear path back = growth
- The mascot's deteriorated state IS the accountability mechanism
- Recovery must be earned through action, not given freely

### Mood Priority Order (Updated)
```
1. Celebrating (highest) - just leveled up
2. Sleeping            - energy = 0 (abandoned)
3. Sad                 - streak broken OR avg pillar trust < 30
4. Concerned           - pillars declining OR returning after 3+ days OR any pillar < 30
5. Proud               - avg pillar trust >= 70 AND streak >= 7
6. Happy               - avg pillar trust >= 55 AND streak >= 3
7. Neutral (lowest)    - default state
```

### Key Change: Pillar Health > Activity
| Old System | New System |
|------------|------------|
| Trust score from status table | Average trust across active pillars |
| Streak determines mood | Streak + pillar health together |
| No abandonment penalty | Visual degradation when absent |

### Abandonment Visual System
| Days Absent | Visual Effect |
|-------------|---------------|
| 0-2 days | Normal appearance |
| 3-4 days | Colors dim (saturation decreases) |
| 5-6 days | Dim + dust particles appear |
| 7+ days | Dim + dust + cobwebs |

### Energy Decay (Asymmetric)
Degradation is FASTER than improvement. This creates healthy shame.

| Direction | Rate |
|-----------|------|
| **Decay (absent)** | |
| Days 1-2 | -15 energy/day |
| Days 3+ | -25 energy/day (accelerated) |
| **Restore (active)** | |
| Complete call | +25 energy |
| Pillar check-in | +10 energy |

### Example: User Ghosts for 6 Days
```
Day 0: Energy 100, vibrant colors, happy mascot
Day 1: Energy 85, normal
Day 2: Energy 70, normal
Day 3: Energy 45, colors dimming, mood = sad
Day 4: Energy 20, more faded
Day 5: Energy 0, sleeping mascot, dust particles
Day 6: Energy 0, sleeping, dusty, nearly colorless

User returns and completes a call:
  Energy: 0 → 25
  Mascot wakes up, mood = "sad" (not happy!)
  Colors still dim
  
User completes another call:
  Energy: 25 → 50
  Mood improves to "concerned"
  
User shows consistent behavior over days:
  Pillars improve → mood becomes "happy"
  Colors restore
  Dust/cobwebs disappear
```

### Why No "Welcome Back" Mood
Initially considered a warm "welcome_back" mood for returning users. Rejected because:
- It removes the cost of quitting
- Users need to see the damage they caused
- The mascot should look abandoned, not forgiving
- Redemption must be earned

### Configurable Thresholds
All thresholds are in `mood-calculator.ts` for easy tuning:

```typescript
export const MOOD_THRESHOLDS = {
  PILLAR_PROUD: 70,        // avg >= 70 can be proud
  PILLAR_HAPPY: 55,        // avg >= 55 can be happy
  PILLAR_CONCERNED: 40,    // avg < 40 = concerned
  PILLAR_SAD: 30,          // avg < 30 = sad
  LOWEST_PILLAR_ALERT: 30, // any pillar < 30 triggers concern
  STREAK_PROUD: 7,         // days for proud
  STREAK_HAPPY: 3,         // days for happy
  DAYS_DUST: 5,            // days until dust appears
  DAYS_COBWEBS: 7,         // days until cobwebs appear
};

export const ENERGY_CONFIG = {
  DECAY_STANDARD: 15,      // days 1-2 of absence
  DECAY_ACCELERATED: 25,   // days 3+ of absence
  RESTORE_CALL: 25,        // completing a call
  RESTORE_PILLAR: 10,      // pillar check-in
};
```

### Files Involved
- `migrations/013_mascot_abandonment.sql` - Database functions for decay/restore
- `backend/src/features/gamification/services/mood-calculator.ts` - Core mood logic
- `backend/src/features/gamification/services/xp-engine.ts` - Updated mood updates
- `web/src/components/gamification/Mascot/MascotAvatar.tsx` - Abandonment visuals
