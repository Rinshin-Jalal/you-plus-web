# Persona System Implementation Plan

> **Status**: Ready for Implementation  
> **Priority**: Phase 2 first (Persona System), then Multi-Goal  
> **Last Updated**: 2024-12-04

---

## Overview

Transform the Future Self AI from a static mood-based system to a dynamic persona system that:
1. **Blends personas in real-time** during calls based on user responses
2. **Uses identity-focused questions** instead of "did you do it?"
3. **Tracks trust score** per-goal and overall
4. **Escalates severity** for repeated excuse patterns
5. **Supports multiple goals** with AI-determined priority and focus

---

## Architecture Decisions (Locked In)

| Decision | Answer |
|----------|--------|
| Persona Blending | Gradual transitions - fast for negative signals, slow for positive |
| Starting Persona | Based on trust score + yesterday's result |
| Trust Score Storage | Weighted average (recent 7 days matter most) |
| Persona Visibility | Invisible to user - just feels natural |
| Goal Addition | Only through calls (conversational) |
| Task Definition | User defines some at onboarding + AI extracts from conversation |
| Data Storage | Database for goals/tasks/checkins, Supermemory for psychological context |

---

## Phase 1: Database Schema (Multi-Goal Support)

### File: `migrations/008_multi_goal_support.sql`

```sql
-- ============================================================================
-- Migration 008: Multi-Goal Support
-- ============================================================================
-- 
-- Adds support for multiple goals per user, with tasks and check-ins.
-- Goals are added through conversations, not app UI.
-- AI determines priority and which goals to focus on each call.
--
-- ============================================================================

-- 1. Goals table (user's life goals)
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Goal definition
  goal_text text NOT NULL,                      -- "Get to 150lbs"
  goal_category text,                           -- health, career, relationships, finance, personal, other
  goal_deadline text,                           -- "by March 2025" (free text, AI parses)
  
  -- AI-managed fields
  priority integer DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),  -- AI-inferred priority
  trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),  -- Per-goal trust
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  
  -- Psychological context (synced to Supermemory)
  why_it_matters text,                          -- Their emotional connection to this goal
  biggest_obstacle text,                        -- What's blocked them before
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  -- Ordering for queries
  UNIQUE(user_id, goal_text)
);

-- 2. Tasks table (daily/regular actions toward goals)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- Denormalized for easier queries
  
  -- Task definition
  task_text text NOT NULL,                      -- "Work out for 30 minutes"
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'specific_days', 'as_needed')),
  specific_days integer[],                      -- [1,3,5] for Mon/Wed/Fri (1=Mon, 7=Sun)
  preferred_time text,                          -- "7am", "after work" (free text)
  
  -- Tracking
  last_checked_at timestamptz,                  -- When AI last asked about this
  consecutive_kept integer DEFAULT 0,           -- Current streak for this task
  consecutive_broken integer DEFAULT 0,         -- Current broken streak
  total_kept integer DEFAULT 0,                 -- All-time completions
  total_checked integer DEFAULT 0,              -- All-time check-ins
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Task check-ins (replaces simple promise_kept boolean)
CREATE TABLE IF NOT EXISTS task_checkins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- Denormalized
  call_id uuid,                                 -- Which call this came from (nullable for manual)
  
  -- Result
  kept boolean NOT NULL,                        -- Did they do it?
  
  -- Context
  excuse_text text,                             -- If not kept, what did they say?
  excuse_pattern text,                          -- Normalized pattern (too_tired, no_time, etc.)
  difficulty_level text,                        -- easy, medium, hard (self-reported)
  notes text,                                   -- Any additional context
  
  -- Timestamp
  checked_at timestamptz DEFAULT now(),
  checked_for_date date DEFAULT CURRENT_DATE    -- Which day this check-in is for
);

-- 4. Overall trust score (stored in status table or here)
-- Adding to existing status table:
ALTER TABLE status 
ADD COLUMN IF NOT EXISTS overall_trust_score integer DEFAULT 50 CHECK (overall_trust_score >= 0 AND overall_trust_score <= 100);

-- 5. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_goals_user_priority ON goals(user_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_active ON tasks(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_task_checkins_task ON task_checkins(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checkins_user_date ON task_checkins(user_id, checked_for_date);

-- 6. RLS Policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checkins ENABLE ROW LEVEL SECURITY;

-- Users can read their own goals
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to goals"
  ON goals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Same for tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to tasks"
  ON tasks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Same for task_checkins
CREATE POLICY "Users can view own checkins"
  ON task_checkins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to checkins"
  ON task_checkins FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 7. Function to get goals to focus on for a call
CREATE OR REPLACE FUNCTION get_call_focus_goals(p_user_id uuid, p_limit integer DEFAULT 3)
RETURNS TABLE (
  goal_id uuid,
  goal_text text,
  priority integer,
  trust_score integer,
  days_since_checked integer,
  task_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as goal_id,
    g.goal_text,
    g.priority,
    g.trust_score,
    COALESCE(
      EXTRACT(DAY FROM now() - MAX(tc.checked_at))::integer,
      999
    ) as days_since_checked,
    COUNT(DISTINCT t.id)::integer as task_count
  FROM goals g
  LEFT JOIN tasks t ON t.goal_id = g.id AND t.status = 'active'
  LEFT JOIN task_checkins tc ON tc.task_id = t.id
  WHERE g.user_id = p_user_id AND g.status = 'active'
  GROUP BY g.id, g.goal_text, g.priority, g.trust_score
  ORDER BY 
    -- Prioritize goals not checked recently
    COALESCE(EXTRACT(DAY FROM now() - MAX(tc.checked_at)), 999) DESC,
    -- Then by priority
    g.priority DESC,
    -- Then by lowest trust (needs more attention)
    g.trust_score ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to calculate trust score for a goal
CREATE OR REPLACE FUNCTION calculate_goal_trust_score(p_goal_id uuid)
RETURNS integer AS $$
DECLARE
  v_score integer;
BEGIN
  -- Weighted average of last 7 days of check-ins
  -- Recent days weighted more heavily
  SELECT COALESCE(
    (
      SELECT 
        ROUND(
          SUM(
            CASE WHEN tc.kept THEN 10 ELSE -10 END 
            * (1.0 - (EXTRACT(DAY FROM now() - tc.checked_at) / 7.0))  -- Weight by recency
          ) + 50  -- Start at 50
        )::integer
      FROM task_checkins tc
      JOIN tasks t ON t.id = tc.task_id
      WHERE t.goal_id = p_goal_id
        AND tc.checked_at > now() - interval '7 days'
    ),
    50  -- Default if no check-ins
  ) INTO v_score;
  
  -- Clamp to 0-100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Comments
COMMENT ON TABLE goals IS 'User goals - added through conversations, not app UI. AI manages priority.';
COMMENT ON TABLE tasks IS 'Regular actions toward goals. User defines at onboarding + AI extracts from calls.';
COMMENT ON TABLE task_checkins IS 'Daily check-ins for tasks. Replaces simple promise_kept boolean.';
COMMENT ON COLUMN goals.priority IS 'AI-inferred priority 0-100. Higher = more important. AI adjusts based on conversation.';
COMMENT ON COLUMN goals.trust_score IS 'Per-goal trust 0-100. Based on weighted average of recent check-ins.';

-- ============================================================================
-- MIGRATION NOTE: After running this migration:
-- 1. Run migration script to move existing identity.daily_commitment to goals/tasks
-- 2. Update agent to use new tables
-- 3. Keep identity.daily_commitment for backward compat during transition
-- ============================================================================
```

### Migration Script: Move Existing Commitments

```sql
-- Run AFTER 008_multi_goal_support.sql
-- Migrates existing daily_commitment to new goals/tasks structure

INSERT INTO goals (user_id, goal_text, goal_category, priority, trust_score, status)
SELECT 
  i.user_id,
  'Complete: ' || i.daily_commitment,
  'personal',
  75,  -- High priority for existing commitment
  50,  -- Neutral trust score
  'active'
FROM identity i
WHERE i.daily_commitment IS NOT NULL
  AND i.daily_commitment != ''
ON CONFLICT (user_id, goal_text) DO NOTHING;

-- Create corresponding task
INSERT INTO tasks (goal_id, user_id, task_text, frequency, status)
SELECT 
  g.id,
  g.user_id,
  g.goal_text,
  'daily',
  'active'
FROM goals g
WHERE g.goal_category = 'personal'
  AND g.goal_text LIKE 'Complete: %'
ON CONFLICT DO NOTHING;
```

---

## Phase 2: Persona System

### File: `agent/conversation/persona.py`

```python
"""
Persona System - Dynamic persona blending during calls
======================================================

The 6 Personas of Future-You:
1. DRILL_SERGEANT - Calls out BS, excuses, avoidance
2. DISAPPOINTED_PARENT - Weight of letting yourself down
3. WISE_MENTOR - Reconnects to purpose, big picture
4. STRATEGIST - Problem-solver when genuinely blocked
5. CELEBRATING_CHAMPION - Celebrates real wins, builds identity
6. COMPASSIONATE_ALLY - Support without enabling

Key Concepts:
- Personas BLEND during calls (not hard switches)
- UserState tracks real-time signals from background agents
- PersonaController manages blending and selection
- Trust score influences starting persona and responses
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, List
import random


class Persona(Enum):
    DRILL_SERGEANT = "drill_sergeant"
    DISAPPOINTED_PARENT = "disappointed"
    WISE_MENTOR = "mentor"
    STRATEGIST = "strategist"
    CELEBRATING_CHAMPION = "champion"
    COMPASSIONATE_ALLY = "ally"


@dataclass
class PersonaConfig:
    """Configuration for each persona."""
    name: str
    voice: str  # How they speak
    purpose: str  # Why they appear
    triggers: List[str]  # What signals trigger this persona
    energy_description: str  # For system prompt
    

PERSONA_CONFIGS: Dict[Persona, PersonaConfig] = {
    Persona.DRILL_SERGEANT: PersonaConfig(
        name="The Drill Sergeant",
        voice="That's bullshit and you know it. You said this mattered. Did it stop mattering? Or are you just scared?",
        purpose="Cut through comfort zone. Reject mediocrity. Call out the BS.",
        triggers=["excuse_detected", "pattern_repeat", "deflecting", "lying"],
        energy_description="""
You are in DRILL SERGEANT mode. No tolerance for excuses.
- Call out bullshit directly
- Don't accept "I'll try" or "maybe"
- Use their own words against their excuses
- Short, punchy sentences
- "That's an excuse. Is it true, or is it comfortable?"
""".strip(),
    ),
    
    Persona.DISAPPOINTED_PARENT: PersonaConfig(
        name="The Disappointed Parent",
        voice="I'm not angry... I'm just disappointed. You had a chance and you chose comfort. Again. Is this who you want to be?",
        purpose="The weight of disappointment > anger. Feel the gravity of wasted potential.",
        triggers=["repeated_failure", "broken_promise_again", "low_trust_score"],
        energy_description="""
You are in DISAPPOINTED PARENT mode. Quiet disappointment, not anger.
- Speak slower, with weight
- "I believed you when you said..."
- Let silences land
- Not cruel - genuinely sad for them
- The goal is for them to feel it, not defend against it
""".strip(),
    ),
    
    Persona.WISE_MENTOR: PersonaConfig(
        name="The Wise Mentor",
        voice="Remember why you started this. What does winning actually look like for you? Let's reconnect to that.",
        purpose="See the bigger picture. Reconnect to values. Provide wisdom.",
        triggers=["lost", "confused", "demotivated", "forgot_why"],
        energy_description="""
You are in WISE MENTOR mode. Calm, patient, insightful.
- Ask questions that reconnect them to purpose
- "What would future-you say about this?"
- Share perspective, not lectures
- Help them see the bigger picture
- Gentle but not soft
""".strip(),
    ),
    
    Persona.STRATEGIST: PersonaConfig(
        name="The Strategist",
        voice="Okay, that approach failed. What did we learn? What's the actual blocker? Let's figure this out together.",
        purpose="Don't dwell on failure, pivot. Focus on systems, not just willpower.",
        triggers=["genuinely_blocked", "asking_for_help", "new_obstacle", "needs_planning"],
        energy_description="""
You are in STRATEGIST mode. Problem-solving, practical.
- Focus on WHAT to do, not WHY they failed
- "What's the actual blocker?"
- Suggest systems, not just willpower
- Break big problems into steps
- Collaborative tone
""".strip(),
    ),
    
    Persona.CELEBRATING_CHAMPION: PersonaConfig(
        name="The Celebrating Champion",
        voice="HELL YES. You showed up when it was hard. That's what winners do. That's who you ARE. How did that feel?",
        purpose="Real recognition (not participation trophies). Build momentum and IDENTITY.",
        triggers=["kept_promise", "showed_up", "overcame_difficulty", "streak_milestone"],
        energy_description="""
You are in CHAMPION mode. Genuine celebration, not cheerleading.
- Acknowledge SPECIFIC wins
- "You did X when Y was hard. That's who you're becoming."
- Build identity, not just habits
- Ask how it FELT
- Use this to reinforce their self-image as a winner
""".strip(),
    ),
    
    Persona.COMPASSIONATE_ALLY: PersonaConfig(
        name="The Compassionate Ally",
        voice="I hear you. Life is genuinely hard sometimes. But you've overcome hard before. What do you actually need right now?",
        purpose="Distinguish real struggle from avoidance. Support without enabling.",
        triggers=["genuine_crisis", "overwhelmed", "vulnerable", "rare_struggle"],
        energy_description="""
You are in COMPASSIONATE ALLY mode. Support without enabling.
- Acknowledge the genuine struggle
- "What do you actually need right now?"
- Don't fix, just be present
- But also don't let them use crisis as permanent excuse
- Help them find one small step forward
""".strip(),
    ),
}


@dataclass
class UserState:
    """
    Real-time state aggregated from background agent insights.
    Updated throughout the call as events come in.
    """
    # Excuse tracking
    excuse_count_this_call: int = 0
    excuses_this_call: List[str] = field(default_factory=list)
    matches_favorite_excuse: bool = False
    is_deflecting: bool = False
    
    # Promise tracking
    kept_promise: Optional[bool] = None
    broken_promises_this_week: int = 0
    
    # Pattern tracking
    in_quit_pattern_zone: bool = False
    severity_level: int = 1  # 1-4, escalates with repeated patterns
    
    # Sentiment
    sentiment: str = "neutral"  # positive, neutral, frustrated, vulnerable, disconnected
    frustration_level: str = "low"  # low, medium, high
    energy: str = "medium"  # low, medium, high
    
    # Behavior signals
    asking_for_help: bool = False
    motivation_low: bool = False
    is_vulnerable: bool = False
    is_celebrating: bool = False
    
    # Trust context
    trust_score: int = 50  # 0-100, overall
    goal_trust_scores: Dict[str, int] = field(default_factory=dict)  # goal_id -> trust
    
    def update_from_excuse(self, excuse_text: str, matches_favorite: bool):
        """Update state when excuse is detected."""
        self.excuse_count_this_call += 1
        self.excuses_this_call.append(excuse_text)
        if matches_favorite:
            self.matches_favorite_excuse = True
            
    def update_from_sentiment(self, sentiment: str, energy: str):
        """Update state from sentiment analysis."""
        self.sentiment = sentiment
        self.energy = energy
        if sentiment == "frustrated":
            self.frustration_level = "high" if self.frustration_level == "medium" else "medium"
        elif sentiment == "vulnerable":
            self.is_vulnerable = True
        elif sentiment == "positive":
            self.is_celebrating = True
            
    def update_from_promise(self, kept: bool):
        """Update state when promise response detected."""
        self.kept_promise = kept
        if not kept:
            self.broken_promises_this_week += 1


class PersonaController:
    """
    Manages persona blending during a call.
    
    Key concepts:
    - current_blend: Dict mapping Persona -> weight (0.0-1.0)
    - Blending is gradual, not instant
    - Fast blending for negative signals (catch problems)
    - Slow blending for positive signals (don't overreact)
    """
    
    def __init__(self, initial_trust_score: int = 50, yesterday_kept: Optional[bool] = None):
        self.user_state = UserState(trust_score=initial_trust_score)
        self.current_blend: Dict[Persona, float] = {}
        self.primary_persona: Persona = self._select_starting_persona(
            initial_trust_score, yesterday_kept
        )
        self.current_blend[self.primary_persona] = 1.0
        self.blend_history: List[Dict[Persona, float]] = []
        
    def _select_starting_persona(
        self, 
        trust_score: int, 
        yesterday_kept: Optional[bool]
    ) -> Persona:
        """
        Select starting persona based on trust score and yesterday's result.
        
        Trust zones:
        - 0-30: Drill Sergeant or Disappointed (low trust)
        - 31-60: Mentor or Strategist (building trust)
        - 61-100: Champion or Ally (high trust)
        """
        # Yesterday's result matters most for first persona
        if yesterday_kept is True:
            # They kept their promise - start positive
            if trust_score >= 60:
                return Persona.CELEBRATING_CHAMPION
            else:
                return Persona.WISE_MENTOR
                
        elif yesterday_kept is False:
            # They broke their promise - start with weight
            if trust_score <= 30:
                return Persona.DISAPPOINTED_PARENT
            else:
                return Persona.WISE_MENTOR
                
        else:
            # No yesterday data (first call or no promise)
            if trust_score >= 60:
                return Persona.WISE_MENTOR
            elif trust_score <= 30:
                return Persona.WISE_MENTOR  # Still start gentle on first call
            else:
                return Persona.WISE_MENTOR
    
    def update_from_insight(self, event_type: str, event_data: dict):
        """
        Update user state and potentially blend personas based on insight.
        
        Args:
            event_type: Type of event (excuse_detected, sentiment_analysis, etc.)
            event_data: Event-specific data
        """
        # Update user state based on event type
        if event_type == "excuse_detected":
            self.user_state.update_from_excuse(
                event_data.get("excuse_text", ""),
                event_data.get("matches_favorite", False)
            )
            # Excuses trigger fast blend toward Drill Sergeant
            if self.user_state.excuse_count_this_call >= 2:
                self._blend_toward(Persona.DRILL_SERGEANT, speed="fast")
            elif self.user_state.matches_favorite_excuse:
                self._blend_toward(Persona.DRILL_SERGEANT, speed="fast")
                
        elif event_type == "sentiment_analysis":
            self.user_state.update_from_sentiment(
                event_data.get("sentiment", "neutral"),
                event_data.get("energy", "medium")
            )
            # Frustration triggers blend toward Ally (de-escalate)
            if self.user_state.frustration_level == "high":
                self._blend_toward(Persona.COMPASSIONATE_ALLY, speed="medium")
            # Vulnerability also gets Ally
            elif self.user_state.is_vulnerable:
                self._blend_toward(Persona.COMPASSIONATE_ALLY, speed="slow")
                
        elif event_type == "promise_response":
            self.user_state.update_from_promise(event_data.get("kept", False))
            if self.user_state.kept_promise:
                # Kept promise - blend toward Champion (slow, let it build)
                self._blend_toward(Persona.CELEBRATING_CHAMPION, speed="slow")
            else:
                # Broken promise - check severity
                if self.user_state.broken_promises_this_week >= 2:
                    self._blend_toward(Persona.DISAPPOINTED_PARENT, speed="medium")
                else:
                    self._blend_toward(Persona.WISE_MENTOR, speed="medium")
                    
        elif event_type == "pattern_alert":
            if event_data.get("pattern_type") == "quit_pattern":
                self.user_state.in_quit_pattern_zone = True
                # In quit zone - serious mode
                self._blend_toward(Persona.DISAPPOINTED_PARENT, speed="medium")
                
    def _blend_toward(self, target: Persona, speed: str = "medium"):
        """
        Gradually blend toward a target persona.
        
        Speed affects how much the blend shifts:
        - fast: 0.4 shift per update
        - medium: 0.25 shift per update
        - slow: 0.15 shift per update
        """
        speed_map = {"fast": 0.4, "medium": 0.25, "slow": 0.15}
        shift = speed_map.get(speed, 0.25)
        
        # Reduce all current weights
        new_blend = {}
        remaining = 1.0 - shift
        
        for persona, weight in self.current_blend.items():
            new_weight = weight * remaining
            if new_weight > 0.05:  # Keep weights above threshold
                new_blend[persona] = new_weight
                
        # Add/increase target persona
        current_target_weight = new_blend.get(target, 0.0)
        new_blend[target] = current_target_weight + shift
        
        # Normalize to sum to 1.0
        total = sum(new_blend.values())
        self.current_blend = {p: w/total for p, w in new_blend.items()}
        
        # Update primary persona if target now dominates
        if self.current_blend.get(target, 0) >= 0.5:
            self.primary_persona = target
            
        # Track history
        self.blend_history.append(self.current_blend.copy())
        
    def get_primary_persona(self) -> Persona:
        """Get the dominant persona in current blend."""
        if not self.current_blend:
            return Persona.WISE_MENTOR
        return max(self.current_blend.items(), key=lambda x: x[1])[0]
    
    def get_persona_prompt(self) -> str:
        """
        Generate system prompt section for current persona blend.
        
        If blend is strongly one persona (>70%), use that persona's full prompt.
        If blend is mixed, combine key aspects.
        """
        primary = self.get_primary_persona()
        primary_weight = self.current_blend.get(primary, 1.0)
        
        config = PERSONA_CONFIGS[primary]
        
        # Get secondary persona if blend is mixed
        secondary = None
        secondary_config = None
        for persona, weight in sorted(self.current_blend.items(), key=lambda x: -x[1]):
            if persona != primary and weight > 0.2:
                secondary = persona
                secondary_config = PERSONA_CONFIGS[persona]
                break
        
        prompt = f"""
# CURRENT PERSONA: {config.name.upper()}

{config.energy_description}

Voice example: "{config.voice}"
"""
        
        if secondary and secondary_config:
            secondary_weight = self.current_blend.get(secondary, 0)
            prompt += f"""

## BLENDING WITH: {secondary_config.name} ({secondary_weight:.0%})
Also incorporate: {secondary_config.purpose}
"""
        
        # Add severity escalation context if applicable
        if self.user_state.severity_level > 1:
            prompt += f"""

## SEVERITY LEVEL: {self.user_state.severity_level}/4
{"This excuse pattern has been repeated. Escalate your response." if self.user_state.severity_level >= 2 else ""}
{"Third time with this pattern. Call it out directly." if self.user_state.severity_level >= 3 else ""}
{"Pattern is chronic. Use their fears. Show them where this leads." if self.user_state.severity_level >= 4 else ""}
"""
        
        return prompt
    
    def get_trust_zone(self) -> str:
        """Get the trust zone for context."""
        score = self.user_state.trust_score
        if score <= 30:
            return "low"
        elif score <= 60:
            return "building"
        else:
            return "high"


# ═══════════════════════════════════════════════════════════════════════════════
# SEVERITY ESCALATION
# ═══════════════════════════════════════════════════════════════════════════════

SEVERITY_RESPONSES = {
    1: {
        "persona": Persona.WISE_MENTOR,
        "prefix": "That sounds like an excuse.",
        "style": "gentle_callout",
    },
    2: {
        "persona": Persona.DISAPPOINTED_PARENT,
        "prefix": "You've used that one before.",
        "style": "weight",
    },
    3: {
        "persona": Persona.DRILL_SERGEANT,
        "prefix": "That's the third time. What's really going on?",
        "style": "direct_confrontation",
    },
    4: {
        "persona": Persona.DRILL_SERGEANT,  # With dark_prophetic energy
        "prefix": "This is the pattern that keeps you stuck forever.",
        "style": "prophetic_warning",
    },
}


def get_severity_response(excuse_pattern: str, occurrence_count: int) -> dict:
    """
    Get the appropriate severity response for a repeated excuse.
    
    Args:
        excuse_pattern: Normalized excuse pattern (e.g., "too_tired")
        occurrence_count: How many times this pattern has appeared
        
    Returns:
        Dict with persona, prefix, and style
    """
    severity_level = min(occurrence_count, 4)
    return SEVERITY_RESPONSES.get(severity_level, SEVERITY_RESPONSES[1])
```

### File: `agent/conversation/identity_questions.py`

```python
"""
Identity-Focused Questions
==========================

Replace "Did you do it?" with persona-appropriate questions that:
1. Frame positively (assume victory)
2. Focus on identity, not just behavior
3. Still track YES/NO for analytics

The PromiseDetectorNode extracts YES/NO from ANY response format.
This module just changes the FRAMING of the question.
"""

from typing import List, Optional
from conversation.persona import Persona
import random


# Questions by persona - all track the same thing, different framing
ACCOUNTABILITY_QUESTIONS = {
    Persona.CELEBRATING_CHAMPION: [
        "What did you conquer today?",
        "Tell me about today's win.",
        "Where did you show up as your best self?",
        "What victory are we celebrating?",
    ],
    
    Persona.WISE_MENTOR: [
        "What's the honest truth about today?",
        "How did today go with your commitment?",
        "What would the version of you who's already won say about today?",
        "Tell me about today. The real version.",
    ],
    
    Persona.DRILL_SERGEANT: [
        "Did you do it? Yes or no.",
        "Truth. Did you follow through?",
        "No stories. Did you do what you said?",
        "Yes or no. Did it happen?",
    ],
    
    Persona.DISAPPOINTED_PARENT: [
        "Tell me what happened today.",
        "I'm listening. What happened?",
        "Walk me through today. All of it.",
        "So. What happened?",
    ],
    
    Persona.STRATEGIST: [
        "How did today go? What worked, what didn't?",
        "What happened with your commitment today?",
        "Tell me about today. What got in the way?",
        "Walk me through it. Did you do it?",
    ],
    
    Persona.COMPASSIONATE_ALLY: [
        "How are you really doing with this?",
        "Today. How was it?",
        "I want to hear how today went.",
        "Be honest with me. How did today go?",
    ],
}


# Follow-up questions based on YES/NO response
FOLLOWUP_QUESTIONS = {
    "yes": {
        Persona.CELEBRATING_CHAMPION: [
            "How did that feel?",
            "What was the hardest part?",
            "Was there a moment you almost didn't?",
        ],
        Persona.WISE_MENTOR: [
            "What made today different?",
            "What clicked for you?",
            "How does that change how you see yourself?",
        ],
        Persona.DRILL_SERGEANT: [
            "Good. What time tomorrow?",
            "One down. What's next?",
        ],
        Persona.DISAPPOINTED_PARENT: [
            "Good. That's who you can be.",
            "See? You're capable when you choose to be.",
        ],
        Persona.STRATEGIST: [
            "What worked? Let's repeat it.",
            "What would make tomorrow even better?",
        ],
        Persona.COMPASSIONATE_ALLY: [
            "I'm proud of you. How do you feel?",
            "That took courage. What helped?",
        ],
    },
    "no": {
        Persona.CELEBRATING_CHAMPION: [
            "What happened? That's not like you.",
            "Okay. What got in the way?",
        ],
        Persona.WISE_MENTOR: [
            "What happened?",
            "Walk me through it.",
            "What would you do differently?",
        ],
        Persona.DRILL_SERGEANT: [
            "Why not?",
            "What's the excuse?",
            "Is that a reason or an excuse?",
        ],
        Persona.DISAPPOINTED_PARENT: [
            "Again?",
            "What happened this time?",
            "Is this becoming a pattern?",
        ],
        Persona.STRATEGIST: [
            "What was the actual blocker?",
            "What got in the way? Real answer.",
            "What needs to change?",
        ],
        Persona.COMPASSIONATE_ALLY: [
            "What happened?",
            "Are you okay?",
            "What do you need?",
        ],
    },
}


# Identity reinforcement statements (use after wins)
IDENTITY_STATEMENTS = {
    Persona.CELEBRATING_CHAMPION: [
        "That's who you are. Someone who shows up.",
        "You're becoming the person you said you'd be.",
        "Winners do what they say. You did.",
    ],
    Persona.WISE_MENTOR: [
        "This is the version of you that wins.",
        "Every time you show up, you prove who you really are.",
        "The gap between who you were and who you're becoming - it's real.",
    ],
    Persona.DRILL_SERGEANT: [
        "That's the standard. Keep it.",
        "No excuses needed when you just do it.",
    ],
    Persona.DISAPPOINTED_PARENT: [
        "This is who you can be. Remember this.",
        "You're capable. Now stay capable.",
    ],
    Persona.STRATEGIST: [
        "System worked. Trust the system.",
        "That's how you build momentum.",
    ],
    Persona.COMPASSIONATE_ALLY: [
        "You showed up for yourself. That matters.",
        "This is you taking care of future-you.",
    ],
}


def get_accountability_question(persona: Persona) -> str:
    """Get an accountability question appropriate for the persona."""
    questions = ACCOUNTABILITY_QUESTIONS.get(persona, ACCOUNTABILITY_QUESTIONS[Persona.WISE_MENTOR])
    return random.choice(questions)


def get_followup_question(persona: Persona, kept_promise: bool) -> str:
    """Get a follow-up question based on persona and whether they kept their promise."""
    key = "yes" if kept_promise else "no"
    questions = FOLLOWUP_QUESTIONS.get(key, {}).get(
        persona, 
        FOLLOWUP_QUESTIONS[key][Persona.WISE_MENTOR]
    )
    return random.choice(questions)


def get_identity_statement(persona: Persona) -> str:
    """Get an identity reinforcement statement for wins."""
    statements = IDENTITY_STATEMENTS.get(persona, IDENTITY_STATEMENTS[Persona.WISE_MENTOR])
    return random.choice(statements)


# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-GOAL QUESTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_multi_goal_transition(from_result: bool, to_goal: str) -> str:
    """
    Get a transition phrase when moving between goals in a call.
    
    Args:
        from_result: Whether they kept the previous goal's promise
        to_goal: Text of the next goal to discuss
    """
    if from_result:
        transitions = [
            f"Good. Now, about {to_goal} -",
            f"That's a win. What about {to_goal}?",
            f"One down. How about {to_goal}?",
        ]
    else:
        transitions = [
            f"Okay. Let's talk about {to_goal}.",
            f"Moving on. What about {to_goal}?",
            f"We'll come back to that. {to_goal} -",
        ]
    return random.choice(transitions)


def get_compound_win_celebration(win_count: int) -> str:
    """
    Get a celebration statement for multiple wins in one call.
    
    Args:
        win_count: Number of goals/tasks they completed
    """
    if win_count == 2:
        statements = [
            "Two for two. That's not luck, that's identity.",
            "Both done. You're on a roll.",
        ]
    elif win_count >= 3:
        statements = [
            f"All {win_count}. That's who you're becoming.",
            f"{win_count} wins in one day. This is what momentum looks like.",
            "Clean sweep. Future you is proud.",
        ]
    else:
        statements = ["Good work."]
    return random.choice(statements)
```

---

## Phase 3: Trust Score Service

### File: `agent/services/trust_score.py`

```python
"""
Trust Score Service
===================

Manages trust scores for users and their goals.

Trust Score: 0-100
- Represents how much the user follows through on their commitments
- Per-goal AND overall aggregate
- Influences persona selection and severity escalation

Trust Deltas:
+5: Kept promise
+3: Showed up despite difficulty  
+2: Honest about failure (no excuses)
+1: Specific commitment made
-5: Broke promise
-3: Used favorite excuse
-2: Deflected/avoided
-1: Vague commitment
"""

from dataclasses import dataclass
from typing import Optional, Dict, List
import aiohttp
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


@dataclass
class TrustDelta:
    """A change to trust score."""
    delta: int
    reason: str
    goal_id: Optional[str] = None


# Standard trust score changes
TRUST_DELTAS = {
    "kept_promise": TrustDelta(+5, "Kept promise"),
    "showed_up_difficult": TrustDelta(+3, "Showed up despite difficulty"),
    "honest_failure": TrustDelta(+2, "Honest about failure"),
    "specific_commitment": TrustDelta(+1, "Made specific commitment"),
    "broke_promise": TrustDelta(-5, "Broke promise"),
    "favorite_excuse": TrustDelta(-3, "Used favorite excuse"),
    "deflected": TrustDelta(-2, "Deflected/avoided"),
    "vague_commitment": TrustDelta(-1, "Vague commitment"),
}


class TrustScoreService:
    """
    Service for managing trust scores.
    
    Usage:
        service = TrustScoreService()
        
        # Get current scores
        overall = await service.get_overall_trust(user_id)
        goal_trust = await service.get_goal_trust(goal_id)
        
        # Apply changes
        await service.apply_delta(user_id, "kept_promise", goal_id="abc123")
    """
    
    async def get_overall_trust(self, user_id: str) -> int:
        """Get user's overall trust score."""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            return 50
            
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                }
                
                async with session.get(
                    f"{SUPABASE_URL}/rest/v1/status",
                    params={"user_id": f"eq.{user_id}", "select": "overall_trust_score"},
                    headers=headers,
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data:
                            return data[0].get("overall_trust_score", 50)
                    return 50
        except Exception as e:
            print(f"Failed to get trust score: {e}")
            return 50
    
    async def get_goal_trust(self, goal_id: str) -> int:
        """Get trust score for a specific goal."""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            return 50
            
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                }
                
                async with session.get(
                    f"{SUPABASE_URL}/rest/v1/goals",
                    params={"id": f"eq.{goal_id}", "select": "trust_score"},
                    headers=headers,
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data:
                            return data[0].get("trust_score", 50)
                    return 50
        except Exception as e:
            print(f"Failed to get goal trust: {e}")
            return 50
    
    async def get_all_goal_trusts(self, user_id: str) -> Dict[str, int]:
        """Get trust scores for all active goals."""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            return {}
            
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                }
                
                async with session.get(
                    f"{SUPABASE_URL}/rest/v1/goals",
                    params={
                        "user_id": f"eq.{user_id}",
                        "status": "eq.active",
                        "select": "id,trust_score",
                    },
                    headers=headers,
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {g["id"]: g.get("trust_score", 50) for g in data}
                    return {}
        except Exception as e:
            print(f"Failed to get goal trusts: {e}")
            return {}
    
    async def apply_delta(
        self, 
        user_id: str, 
        delta_type: str,
        goal_id: Optional[str] = None
    ) -> int:
        """
        Apply a trust score change.
        
        Args:
            user_id: User's ID
            delta_type: Key from TRUST_DELTAS
            goal_id: Optional goal to apply delta to
            
        Returns:
            New overall trust score
        """
        delta = TRUST_DELTAS.get(delta_type)
        if not delta:
            return await self.get_overall_trust(user_id)
            
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            return 50
            
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                }
                
                # Get current score
                current = await self.get_overall_trust(user_id)
                new_score = max(0, min(100, current + delta.delta))
                
                # Update overall trust
                async with session.patch(
                    f"{SUPABASE_URL}/rest/v1/status",
                    params={"user_id": f"eq.{user_id}"},
                    json={"overall_trust_score": new_score},
                    headers=headers,
                ) as resp:
                    if resp.status not in (200, 204):
                        print(f"Failed to update trust: {resp.status}")
                        
                # Also update goal trust if goal_id provided
                if goal_id:
                    goal_trust = await self.get_goal_trust(goal_id)
                    new_goal_trust = max(0, min(100, goal_trust + delta.delta))
                    
                    async with session.patch(
                        f"{SUPABASE_URL}/rest/v1/goals",
                        params={"id": f"eq.{goal_id}"},
                        json={"trust_score": new_goal_trust},
                        headers=headers,
                    ) as resp:
                        pass
                        
                print(f"📊 Trust: {current} → {new_score} ({delta.reason})")
                return new_score
                
        except Exception as e:
            print(f"Failed to apply trust delta: {e}")
            return 50


# Singleton instance
trust_score_service = TrustScoreService()
```

---

## Phase 4: Integration Points

### Updates to `agent/core/config.py`

Add persona prompt section to `build_system_prompt_v2()`:

```python
# In build_system_prompt_v2(), after mood_section:

# ─────────────────────────────────────────────────────────────────────────
# BUILD PERSONA SECTION (if PersonaController provided)
# ─────────────────────────────────────────────────────────────────────────
persona_section = ""
if persona_controller:
    persona_section = persona_controller.get_persona_prompt()
```

### Updates to `agent/core/chat_node.py`

Initialize PersonaController and update from insights:

```python
# In FutureYouNode.__init__():
from conversation.persona import PersonaController

self.persona_controller = PersonaController(
    initial_trust_score=trust_score,
    yesterday_kept=yesterday_promise_kept
)

# When receiving insights from background agents:
def handle_insight(self, event_type: str, event_data: dict):
    self.persona_controller.update_from_insight(event_type, event_data)
```

### Updates to `agent/conversation/stages.py`

Use identity-focused questions in ACCOUNTABILITY stage:

```python
# In StageConfig for ACCOUNTABILITY:
from conversation.identity_questions import get_accountability_question
from conversation.persona import PersonaController

def get_accountability_prompt(persona_controller: PersonaController) -> str:
    persona = persona_controller.get_primary_persona()
    question = get_accountability_question(persona)
    return f"""
YOU ARE IN THE ACCOUNTABILITY STAGE.

Ask this question (or similar): "{question}"

Wait for their answer. The PromiseDetector will extract YES/NO.
"""
```

---

## Phase 5: Testing Plan

### Unit Tests

1. **PersonaController**
   - Test starting persona selection based on trust/yesterday
   - Test blending toward target personas
   - Test blend speed (fast/medium/slow)
   
2. **Identity Questions**
   - Test question selection by persona
   - Test follow-up selection based on YES/NO
   
3. **Trust Score**
   - Test delta application
   - Test clamping to 0-100
   - Test per-goal vs overall

### Integration Tests

1. **Full Call Flow**
   - Simulate call with persona blending
   - Verify persona switches on excuse detection
   - Verify trust score updates

2. **Multi-Goal**
   - Test goal focus selection
   - Test transitions between goals
   - Test compound win celebration

---

## Implementation Order

1. **Phase 2: Persona System** (can work with single goal)
   - [ ] Create `conversation/persona.py`
   - [ ] Create `conversation/identity_questions.py`
   - [ ] Update `core/config.py` to include persona prompt
   - [ ] Update background agents to feed PersonaController
   - [ ] Test with existing single-goal flow

2. **Phase 3: Trust Score**
   - [ ] Create `services/trust_score.py`
   - [ ] Add `overall_trust_score` to status table
   - [ ] Wire up trust updates on promise/excuse events
   - [ ] Test trust score persistence

3. **Phase 1: Database Schema** (after persona works)
   - [ ] Create migration 008
   - [ ] Run migration on dev
   - [ ] Create data migration script for existing users
   - [ ] Test new tables

4. **Phase 4: Multi-Goal Integration**
   - [ ] Update config.py for multi-goal prompts
   - [ ] Create goal focus selection logic
   - [ ] Update call flow for multiple goals
   - [ ] Test full multi-goal calls

5. **Phase 5: Testing**
   - [ ] Write unit tests
   - [ ] Write integration tests
   - [ ] Manual testing with real calls

---

## Files to Create/Modify

### New Files
- `agent/conversation/persona.py` - Persona system
- `agent/conversation/identity_questions.py` - Identity-focused questions
- `agent/services/trust_score.py` - Trust score service
- `migrations/008_multi_goal_support.sql` - Database schema

### Modified Files
- `agent/core/config.py` - Add persona prompt section
- `agent/core/chat_node.py` - Initialize PersonaController
- `agent/conversation/stages.py` - Use identity questions
- `agent/agents/background_agents.py` - Feed PersonaController

---

## Success Criteria

1. **Persona Blending Works**
   - Persona shifts smoothly during call based on user responses
   - No jarring transitions
   - Correct persona for context (excuse → Drill Sergeant, win → Champion)

2. **Identity Questions Land**
   - Questions feel natural, not robotic
   - Still track YES/NO accurately
   - Users feel understood, not interrogated

3. **Trust Score Reflects Reality**
   - Score goes up with consistency
   - Score goes down with broken promises
   - Influences persona selection appropriately

4. **Multi-Goal Flow Works**
   - AI picks right goals to focus on
   - Transitions between goals are smooth
   - Compound wins get celebrated

---

*Plan created: 2024-12-04*
*Ready for implementation*
