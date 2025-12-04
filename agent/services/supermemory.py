"""
Supermemory Integration for YOU+ Agent
======================================

Uses the official Supermemory Python SDK for:
- User Profiles (v4 API) - static + dynamic facts about users
- Memories (v3 API) - storing onboarding data, call transcripts

The agent fetches the user's profile before each call to get
comprehensive context without manual field extraction.

Profile API: POST /v4/profile
- Returns { static: string[], dynamic: string[] }
- static = long-term facts (goal, fears, patterns)
- dynamic = recent context (current projects, recent calls)
"""

import os
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime

# Import the SDK with alias to avoid collision with our module name
import supermemory as sm_sdk  # type: ignore[import-not-found]

SUPERMEMORY_API_KEY = os.getenv("SUPERMEMORY_API_KEY")


@dataclass
class UserProfile:
    """
    User profile from Supermemory v4 API.

    Attributes:
        static: List of long-term facts (goal, patterns, fears)
        dynamic: List of recent context (last calls, current state)
    """

    static: List[str]
    dynamic: List[str]

    def to_prompt_context(self) -> str:
        """Format profile for injection into system prompt."""
        parts = []

        if self.static:
            parts.append("ABOUT THIS USER (long-term facts):")
            for fact in self.static:
                parts.append(f"- {fact}")

        if self.dynamic:
            parts.append("\nCURRENT CONTEXT (recent activity):")
            for fact in self.dynamic:
                parts.append(f"- {fact}")

        return "\n".join(parts) if parts else "No profile information available yet."


class SupermemoryService:
    """
    Supermemory client for the YOU+ agent using official SDK.

    Usage:
        from services.supermemory import supermemory

        # Get profile before call (one API call, comprehensive context)
        profile = await supermemory.get_user_profile(user_id)

        # Store onboarding data
        await supermemory.add_onboarding_profile(user_id, onboarding_data)

        # Store call transcript after call
        await supermemory.add_call_transcript(user_id, transcript, outcomes)
    """

    def __init__(self):
        self.enabled = bool(SUPERMEMORY_API_KEY)
        if not self.enabled:
            print("Warning: SUPERMEMORY_API_KEY not set, memory features disabled")
        self._client = None  # type: ignore[assignment]

    @property
    def client(self):  # type: ignore[return]
        """Lazy init the async client."""
        if self._client is None:
            self._client = sm_sdk.AsyncSupermemory(api_key=SUPERMEMORY_API_KEY)  # type: ignore[attr-defined]
        return self._client

    # =========================================================================
    # USER PROFILES (v4 API)
    # =========================================================================

    async def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """
        Get user's profile from Supermemory v4 API.

        This is the PRIMARY way to get user context. Returns:
        - static: Long-term facts (goal, patterns, fears, demographics)
        - dynamic: Recent context (last few calls, current state)

        The profile is automatically maintained by Supermemory based on
        all memories for this user (onboarding, call transcripts, etc).
        """
        if not self.enabled:
            return None

        try:
            response = await self.client.profile.get(container_tag=user_id)

            static_facts = response.profile.static if response.profile else []
            dynamic_facts = response.profile.dynamic if response.profile else []

            print(
                f"Fetched profile for {user_id}: {len(static_facts)} static, {len(dynamic_facts)} dynamic facts"
            )

            return UserProfile(
                static=static_facts or [],
                dynamic=dynamic_facts or [],
            )

        except Exception as e:
            print(f"Supermemory profile error: {e}")
            return None

    async def get_profile_with_search(
        self, user_id: str, query: str
    ) -> tuple[Optional[UserProfile], List[Dict[str, Any]]]:
        """
        Get profile AND search results in one call.

        Use when you need both comprehensive context AND specific memories.
        Example: "What excuses has this user made before?"
        """
        if not self.enabled:
            return None, []

        try:
            response = await self.client.profile.get(
                container_tag=user_id,
                q=query,
            )

            profile = None
            if response.profile:
                profile = UserProfile(
                    static=response.profile.static or [],
                    dynamic=response.profile.dynamic or [],
                )

            search_results = []
            if response.search_results and response.search_results.results:
                search_results = [
                    {"content": r.content, "metadata": r.metadata}
                    for r in response.search_results.results
                ]

            return profile, search_results

        except Exception as e:
            print(f"Supermemory profile+search error: {e}")
            return None, []

    # =========================================================================
    # ADD MEMORIES (v3 API)
    # =========================================================================

    async def add_memory(
        self,
        container_tag: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """
        Add a memory to Supermemory.

        Memories are automatically processed to:
        - Extract facts for the user's profile
        - Create searchable embeddings
        - Build relationships between memories

        Args:
            container_tag: User ID (groups all user's memories together)
            content: Text content of the memory
            metadata: Optional metadata (type, timestamp, etc.)

        Returns:
            Memory ID if successful, None otherwise
        """
        if not self.enabled:
            return None

        try:
            response = await self.client.add(
                content=content,
                container_tags=[container_tag],
                metadata=metadata or {},
            )

            memory_id = response.id if response else None
            if memory_id:
                print(f"Added memory for {container_tag}: {memory_id}")
            return memory_id

        except Exception as e:
            print(f"Supermemory add error: {e}")
            return None

    # =========================================================================
    # HIGH-LEVEL METHODS FOR YOU+ SPECIFIC USE CASES
    # =========================================================================

    async def add_onboarding_profile(self, user_id: str, data: Dict[str, Any]) -> bool:
        """
        Store user's onboarding profile as a memory.

        Called once when onboarding completes.
        Supermemory will parse this into their User Profile automatically.
        """
        content = self._format_onboarding_profile(data)
        memory_id = await self.add_memory(
            container_tag=user_id,
            content=content,
            metadata={
                "type": "onboarding_profile",
                "source": "onboarding_flow",
                "version": "1.0",
                "created_at": datetime.now().isoformat(),
            },
        )
        return memory_id is not None

    async def add_call_transcript(
        self,
        user_id: str,
        call_number: int,
        streak_day: int,
        call_type: str,
        mood: str,
        transcript: List[Dict[str, str]],
        outcomes: Dict[str, Any],
    ) -> bool:
        """
        Store call transcript and outcomes as a memory.

        Called after each call completes.
        Supermemory will extract insights and update the user's profile.
        """
        # Format transcript as readable text
        transcript_text = "\n".join(
            [
                f"{'AGENT' if msg.get('role') == 'assistant' else 'USER'}: {msg.get('content', '')}"
                for msg in transcript
            ]
        )

        excuses_list = outcomes.get("excuses", [])
        excuses_str = ", ".join(excuses_list) if excuses_list else "none"

        content = f"""
CALL #{call_number} - DAY {streak_day}
Call Type: {call_type}
Mood: {mood}
{"=" * 60}

FULL TRANSCRIPT:
{transcript_text}

{"=" * 60}

CALL OUTCOMES:
- Promise Kept: {outcomes.get("promise_kept", "not assessed")}
- Tomorrow's Commitment: "{outcomes.get("tomorrow_commitment", "none")}"
- Commitment Time: {outcomes.get("commitment_time", "unspecified")}
- Commitment Is Specific: {outcomes.get("commitment_specific", False)}

DETECTED PATTERNS:
- Excuses Made: {excuses_str}
- Key Quote: "{outcomes.get("key_quote", "")}"

AGENT OBSERVATIONS:
{outcomes.get("observations", "No additional observations.")}
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
                "excuses_count": len(excuses_list),
                "timestamp": datetime.now().isoformat(),
            },
        )

        return memory_id is not None

    async def add_voice_transcript(
        self, user_id: str, recording_type: str, transcript: str
    ) -> bool:
        """
        Store a voice recording transcript as a memory.

        The actual audio is stored in voice_samples table.
        This stores the TEXT content for Supermemory to learn from.
        """
        content = f"""
VOICE RECORDING - {recording_type.upper().replace("_", " ")}
{"=" * 60}

User's own words (transcribed from voice):

"{transcript}"

---
This is what the user said when asked about {recording_type.replace("_", " ")}.
These are their authentic words and emotional expression.
"""

        memory_id = await self.add_memory(
            container_tag=user_id,
            content=content,
            metadata={
                "type": "voice_transcript",
                "recording_type": recording_type,
                "source": "onboarding_voice",
                "timestamp": datetime.now().isoformat(),
            },
        )

        return memory_id is not None

    # =========================================================================
    # FORMATTING HELPERS
    # =========================================================================

    def _format_onboarding_profile(self, data: Dict[str, Any]) -> str:
        """Format onboarding data as a rich text document for Supermemory."""

        # Extract fields with defaults (handle both camelCase and snake_case)
        goal = data.get("goal", "Not specified")
        goal_deadline = data.get("goal_deadline") or data.get(
            "goalDeadline", "No deadline"
        )
        motivation_level = data.get("motivation_level") or data.get(
            "motivationLevel", 5
        )

        attempt_count = data.get("attempt_count") or data.get("attemptCount", 0)
        how_did_quit = (
            data.get("how_did_quit")
            or data.get("lastAttemptOutcome")
            or data.get("last_attempt_outcome", "Unknown")
        )
        quit_pattern = (
            data.get("quit_pattern")
            or data.get("quitTime")
            or data.get("quit_time", "Unknown")
        )
        favorite_excuse = data.get("favorite_excuse") or data.get(
            "favoriteExcuse", "Not shared"
        )
        biggest_obstacle = data.get("biggest_obstacle") or data.get(
            "biggestObstacle", "Not shared"
        )

        who_disappointed = data.get("who_disappointed") or data.get(
            "whoDisappointed", "Not shared"
        )
        biggest_fear = data.get("biggest_fear") or data.get("biggestFear", "Not shared")
        what_spent = data.get("what_spent") or data.get("whatSpent", "Not shared")
        success_vision = data.get("success_vision") or data.get(
            "successVision", "Not shared"
        )
        future_if_no_change = data.get("future_if_no_change") or data.get(
            "futureIfNoChange", "Not shared"
        )
        witness = data.get("witness", "No one")

        age = data.get("age", "Unknown")
        gender = data.get("gender", "Unknown")
        location = data.get("location", "Unknown")

        belief_level = data.get("belief_level") or data.get("beliefLevel", 5)
        daily_commitment = data.get("daily_commitment") or data.get(
            "dailyCommitment", "Not specified"
        )

        return f"""
USER ONBOARDING PROFILE
=======================
Created: {datetime.now().isoformat()}

GOAL & MOTIVATION
-----------------
Goal: {goal}
Deadline: {goal_deadline}
Motivation Level: {motivation_level}/10
Belief Level: {belief_level}/10
Daily Commitment: {daily_commitment}

FAILURE PATTERNS (CRITICAL - USE FOR CALLOUTS)
----------------------------------------------
Times Tried Before: {attempt_count}
How They Usually Quit: {how_did_quit}
When They Usually Quit: {quit_pattern}
Favorite Excuse: "{favorite_excuse}"
Biggest Obstacle: {biggest_obstacle}

EMOTIONAL TRIGGERS (USE STRATEGICALLY)
--------------------------------------
Who They've Disappointed: {who_disappointed}
Biggest Fear: {biggest_fear}
What They've Already Wasted: {what_spent}
Vision of Success: "{success_vision}"
Future If Nothing Changes: "{future_if_no_change}"
Who's Watching/Witness: {witness}

DEMOGRAPHICS
------------
Age: {age}
Gender: {gender}
Location: {location}

---
This profile was created during onboarding. It represents the user's
starting point and should evolve as they progress through their journey.
The agent should use this information strategically - not all at once,
but when it's most impactful.
"""


# Singleton instance for easy import
supermemory_service = SupermemoryService()
