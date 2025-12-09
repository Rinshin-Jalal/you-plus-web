# Feature Specification: Mascot Gamification System

**Feature Branch**: `002-mascot-gamification`  
**Created**: 2025-12-09  
**Status**: Approved  
**Input**: Transform the YOU+ mascot from a loading indicator into a living companion that evolves with the user's accountability journey through XP, levels, achievements, accessories, and emotional feedback.

---

## Executive Summary

The Mascot Gamification System adds engagement and retention mechanics to YOU+ by:
1. **XP & Leveling** - Users earn XP for accountability actions, progressing through 100 levels
2. **Mascot Evolution** - The orange blob mascot evolves through 5 distinct stages as users level up
3. **Mascot Mood** - Real-time emotional state reflecting user behavior (celebrating → sad)
4. **Achievements** - 45+ unlockable achievements across 6 categories with rarity tiers
5. **Accessories** - Unlockable cosmetic items users can equip on their mascot
6. **Daily Challenges** - Rotating objectives for bonus XP
7. **Streak Shields** - Protection against accidental streak breaks
8. **Leaderboard** - Anonymous weekly XP rankings

---

## User Scenarios & Testing

### User Story 1 - View Progression Dashboard (Priority: P1)

As a user, I want to see my XP, level, streak, and mascot on my dashboard so I understand my progress.

**Why this priority**: Core visibility - users need to see gamification to engage with it.

**Independent Test**: User logs in and sees XP bar, level badge, streak counter, and mascot.

**Acceptance Scenarios**:

1. **Given** user has 450 total XP and is level 5, **When** they view the dashboard, **Then** they see:
   - Level badge showing "5"
   - XP bar showing progress toward level 6 (e.g., "50/125 XP")
   - Current streak with multiplier (e.g., "7 days 🔥 1.25x")
   - Mascot in appropriate evolution stage and mood

2. **Given** user is level 10 (stage 1 max), **When** they reach level 11, **Then**:
   - Level-up modal appears with celebration animation
   - Mascot evolves from Stage 1 (Spark) to Stage 2 (Ember)
   - User is notified of evolution

3. **Given** user earns XP, **When** the XP bar updates, **Then**:
   - XP bar animates smoothly
   - If level threshold crossed, level-up modal appears
   - Mascot mood updates if applicable

---

### User Story 2 - Earn XP from Actions (Priority: P1)

As a user, I want to earn XP when I complete accountability actions so I feel rewarded for engagement.

**Why this priority**: Core mechanic - XP drives all other gamification features.

**Independent Test**: User completes a pillar check-in and sees XP awarded.

**Acceptance Scenarios**:

1. **Given** user has 7-day streak (1.25x multiplier), **When** they complete a pillar check-in (showed_up = true), **Then**:
   - Base XP: 15
   - Multiplied XP: 18 (floor of 15 × 1.25)
   - XP transaction created with reason "pillar_checkin"
   - Total XP updated in user_progression

2. **Given** user completes all 4 pillars today, **When** the last pillar is checked, **Then**:
   - Pillar check-in XP awarded (15 × multiplier)
   - Bonus XP awarded (50 × multiplier) for "all_pillars_complete"
   - Two separate XP transactions created

3. **Given** user breaks a promise, **When** pillar check-in records showed_up = false, **Then**:
   - XP penalty: -10 (no multiplier on penalties)
   - XP transaction created with negative amount
   - Total XP cannot go below 0

---

### User Story 3 - Unlock Achievements (Priority: P2)

As a user, I want to unlock achievements for milestones so I have goals to work toward.

**Why this priority**: Adds long-term engagement and collection mechanics.

**Independent Test**: User reaches 7-day streak and unlocks "Week Warrior" achievement.

**Acceptance Scenarios**:

1. **Given** user has current_streak = 6, **When** they check in today (streak becomes 7), **Then**:
   - Achievement "week_warrior" is unlocked
   - XP bonus of 100 awarded
   - Toast notification appears (common rarity)
   - If achievement unlocks accessory, that accessory is added to user_accessories

2. **Given** user unlocks a "legendary" achievement, **When** unlock occurs, **Then**:
   - Full-screen celebration modal appears
   - Confetti animation plays
   - XP bonus awarded (500-2500 based on achievement)

3. **Given** user already has achievement "week_warrior", **When** streak reaches 7 again after breaking, **Then**:
   - Achievement is NOT re-unlocked
   - No duplicate XP awarded

---

### User Story 4 - Customize Mascot with Accessories (Priority: P2)

As a user, I want to equip accessories on my mascot so I can personalize my experience.

**Why this priority**: Personalization increases emotional connection.

**Independent Test**: User unlocks sunglasses accessory and equips it on mascot.

**Acceptance Scenarios**:

1. **Given** user has unlocked "sunglasses" accessory, **When** they open accessory shop, **Then**:
   - Sunglasses shown as unlocked with "Equip" button
   - Locked accessories shown with unlock requirements
   - Currently equipped accessories marked

2. **Given** user has no accessories equipped, **When** they equip "party_hat", **Then**:
   - party_hat.equipped = true in user_accessories
   - Mascot immediately renders with party hat
   - Accessory layer renders above base mascot SVG

3. **Given** user has "crown" (headwear) equipped, **When** they equip "party_hat" (also headwear), **Then**:
   - crown.equipped = false
   - party_hat.equipped = true
   - Only one accessory per category equipped at a time

---

### User Story 5 - Complete Daily Challenges (Priority: P3)

As a user, I want daily challenges to give me specific goals each day.

**Why this priority**: Adds variety and daily engagement hooks.

**Independent Test**: User sees today's challenge and completes it for bonus XP.

**Acceptance Scenarios**:

1. **Given** today's challenge is "Complete all Body pillar check-ins", **When** user views dashboard, **Then**:
   - Challenge card shows description, XP reward (75), and progress
   - Expiration time shown in user's timezone

2. **Given** challenge is "Complete all Body pillar check-ins" and user completes Body pillar, **When** check-in is recorded, **Then**:
   - Challenge automatically marked complete
   - XP bonus (75) awarded
   - Celebration toast shown

3. **Given** challenge expires at 23:59:59 user timezone, **When** user completes at 00:00:01 next day, **Then**:
   - Challenge NOT marked complete
   - New challenge already generated for new day

---

### User Story 6 - Streak Shield Protection (Priority: P2)

As a user, I want streak shields to protect me from accidental streak breaks.

**Why this priority**: Reduces frustration, increases retention.

**Independent Test**: User misses a day but streak is protected by shield.

**Acceptance Scenarios**:

1. **Given** user has current_streak = 14 and streak_shields = 2, **When** nightly cron detects missed day, **Then**:
   - streak_shields becomes 1
   - current_streak remains 14
   - Notification sent: "Streak Shield used! 🛡️ Your 14-day streak is protected."

2. **Given** user has current_streak = 29 and streak_shields = 1, **When** user checks in (streak becomes 30), **Then**:
   - streak_shields becomes 2 (earned new shield)
   - Achievement "monthly_master" unlocked
   - Notification: "You earned a Streak Shield! 🛡️"

3. **Given** user has streak_shields = 0, **When** nightly cron detects missed day, **Then**:
   - current_streak becomes 0
   - mascot_mood becomes "sad"
   - No shield consumed (none available)

4. **Given** user has streak_shields = 3 (max), **When** they reach another 30-day milestone, **Then**:
   - streak_shields remains 3 (capped)
   - Achievement still unlocked if applicable
   - No shield earned notification

---

### User Story 7 - View Leaderboard (Priority: P3)

As a user, I want to see where I rank compared to others for motivation.

**Why this priority**: Social proof and competition add motivation.

**Independent Test**: User views leaderboard and sees their rank.

**Acceptance Scenarios**:

1. **Given** user earned 450 XP this week, **When** they view leaderboard, **Then**:
   - See top 100 users (anonymous: level + mascot stage only)
   - See their own rank (e.g., "#47 this week")
   - See their own XP for the week

2. **Given** it's Monday 00:00:00 UTC, **When** weekly reset runs, **Then**:
   - Previous week's leaderboard is archived
   - All users start at 0 XP for new week
   - Ranks recalculated

---

### User Story 8 - Mascot Mood Reflects Behavior (Priority: P1)

As a user, I want my mascot's mood to reflect my behavior so I feel accountable.

**Why this priority**: Emotional feedback is core to mascot engagement.

**Independent Test**: User breaks streak and sees mascot become sad.

**Acceptance Scenarios**:

1. **Given** user just leveled up, **When** they view mascot (within 24h), **Then**:
   - Mascot mood = "celebrating"
   - Party animation plays
   - Confetti particles around mascot

2. **Given** user has 7+ day streak AND trust_score >= 70, **When** they view mascot, **Then**:
   - Mascot mood = "proud"
   - Confident stance animation
   - Subtle glow effect

3. **Given** user has mascot_energy = 0 (no engagement for days), **When** they view mascot, **Then**:
   - Mascot mood = "sleeping"
   - Eyes closed, "Zzz" animation
   - Muted colors

4. **Given** user's streak just broke today (streak was > 0, now 0), **When** they view mascot, **Then**:
   - Mascot mood = "sad"
   - Droopy expression
   - Slightly muted colors

---

## Edge Cases

### Account & Data

- **User deletes account**: All gamification data cascade deleted
- **User subscription lapses**: Gamification endpoints return 402, data preserved
- **User timezone changes**: Current challenge expires at OLD timezone, new challenge at NEW

### XP & Levels

- **Multi-level XP gain**: If XP spans multiple levels, user jumps to final level, single modal shown
- **XP below zero**: Total XP cannot go below 0
- **Concurrent XP awards**: Database transactions prevent race conditions
- **Level 100 reached**: User stays at level 100, XP continues accumulating (prestige future feature)

### Achievements

- **Duplicate achievement**: Cannot unlock same achievement twice
- **Achievement with accessory**: Accessory auto-unlocked when achievement unlocks
- **Retroactive achievements**: On first gamification load, check all achievements against current state

### Streaks & Shields

- **Multiple missed days**: Only 1 shield consumed per missed day (1 per night)
- **Shield at max (3)**: New shields not earned, no error
- **Timezone edge case**: Shield consumption at midnight in user's timezone, not UTC

### Mascot

- **No pillars setup**: Gamification still works (calls, streaks, levels)
- **Energy at 0**: Mascot shows sleeping, any engagement restores energy
- **Multiple mood triggers**: Priority order determines mood (celebrating > proud > happy > etc.)

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST award XP for: calls answered (25), calls completed (30), pillar check-ins kept (15), all pillars bonus (50), promises kept (20), achievements (50-2500), daily challenges (50-100)
- **FR-002**: System MUST apply streak multiplier to positive XP: 1.0x (0-2 days), 1.1x (3-6 days), 1.25x (7-13 days), 1.5x (14-29 days), 2.0x (30+ days)
- **FR-003**: System MUST NOT apply multiplier to negative XP (penalties)
- **FR-004**: System MUST calculate level using formula: XP required = floor(100 × 1.15^(level-1))
- **FR-005**: System MUST evolve mascot at level thresholds: Stage 2 at L11, Stage 3 at L26, Stage 4 at L51, Stage 5 at L76
- **FR-006**: System MUST calculate mascot mood in priority order: celebrating, proud, happy, sleeping, sad, concerned, neutral
- **FR-007**: System MUST decay mascot energy by 15 daily (nightly cron) if no engagement
- **FR-008**: System MUST restore mascot energy by 10 per engagement action (capped at 100)
- **FR-009**: System MUST grant 1 streak shield per 30-day streak milestone (max 3 stored)
- **FR-010**: System MUST consume streak shield automatically when streak would break
- **FR-011**: System MUST generate daily challenge at midnight user timezone
- **FR-012**: System MUST expire daily challenge at 23:59:59 user timezone
- **FR-013**: System MUST display toast notification for common/rare achievements
- **FR-014**: System MUST display full-screen modal for epic/legendary achievements
- **FR-015**: System MUST enforce one accessory per category equipped at a time
- **FR-016**: System MUST calculate weekly leaderboard ranks nightly
- **FR-017**: System MUST reset weekly leaderboard every Monday 00:00:00 UTC

### Non-Functional Requirements

- **NFR-001**: Gamification endpoints MUST respond in <200ms p95
- **NFR-002**: XP transactions MUST be atomic (all-or-nothing)
- **NFR-003**: Achievement checks MUST be eventual (async, retry on failure)
- **NFR-004**: Leaderboard MUST support 10k+ users without degradation
- **NFR-005**: All gamification endpoints MUST require active subscription (402 if not)

---

## Key Entities

- **UserProgression**: XP, level, streak, multiplier, mascot state, shields
- **Achievement**: Static definitions (key, name, rarity, requirements, rewards)
- **UserAchievement**: User's unlocked achievements with timestamps
- **XPTransaction**: Audit log of all XP changes
- **DailyChallenge**: User's daily challenge with completion status
- **MascotAccessory**: Static accessory definitions (key, category, rarity, asset)
- **UserAccessory**: User's unlocked and equipped accessories
- **WeeklyLeaderboard**: Aggregated weekly XP with rank

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 80% of active users check gamification dashboard daily
- **SC-002**: Average session length increases by 20% after gamification launch
- **SC-003**: 7-day retention increases by 15%
- **SC-004**: 50% of users unlock at least 5 achievements in first month
- **SC-005**: Mascot customization (accessory equip) used by 40% of users

### Technical Metrics

- **SC-006**: XP award latency <100ms p95
- **SC-007**: Zero data loss on XP transactions
- **SC-008**: Achievement unlock accuracy 100% (no missed unlocks)
- **SC-009**: Leaderboard calculation completes in <5 minutes for 10k users
