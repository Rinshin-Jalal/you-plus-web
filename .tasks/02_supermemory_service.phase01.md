# Task 02: Create Supermemory Service

## Objective

Create a Python service that wraps Supermemory API for the agent. This is the foundation for all memory operations.

## File to Create

`agent/services/supermemory.py`

## API Reference

Based on Supermemory docs:
- Add memories: `POST /v3/memories`
- Get profile: `GET /v3/user/{container_tag}/profile`
- Search: `POST /v3/search`

## Implementation

```python
"""
Supermemory Integration for YOU+ Agent
======================================

Handles all memory operations:
- Store onboarding data as memories
- Store call transcripts
- Fetch user profiles for prompt building
- Search specific memories when needed
"""

import os
import aiohttp
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

SUPERMEMORY_API_KEY = os.getenv("SUPERMEMORY_API_KEY")
SUPERMEMORY_BASE_URL = "https://api.supermemory.ai/v3"


@dataclass
class UserProfile:
    """User profile from Supermemory."""
    static: str  # Long-term facts (goal, fear, patterns)
    dynamic: str  # Recent context (last call, current streak)
    raw: Dict[str, Any]  # Full API response


@dataclass
class Memory:
    """A single memory from Supermemory."""
    id: str
    content: str
    metadata: Dict[str, Any]
    relevance: float


class SupermemoryService:
    """
    Supermemory client for the YOU+ agent.
    
    Usage:
        memory = SupermemoryService()
        
        # Store onboarding data
        await memory.add_onboarding_profile(user_id, onboarding_data)
        
        # Get profile before call
        profile = await memory.get_user_profile(user_id)
        
        # Store call transcript after call
        await memory.add_call_transcript(user_id, transcript, outcomes)
    """
    
    def __init__(self):
        if not SUPERMEMORY_API_KEY:
            print("⚠️ SUPERMEMORY_API_KEY not set, memory features disabled")
        self.headers = {
            "Authorization": f"Bearer {SUPERMEMORY_API_KEY}",
            "Content-Type": "application/json"
        }
    
    async def add_memory(
        self,
        container_tag: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Add a memory to Supermemory.
        
        Args:
            container_tag: User ID (groups all user's memories)
            content: Text content of the memory
            metadata: Optional metadata (type, timestamp, etc.)
            
        Returns:
            Memory ID if successful, None otherwise
        """
        if not SUPERMEMORY_API_KEY:
            return None
            
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "content": content,
                    "containerTags": [container_tag],
                    "metadata": metadata or {}
                }
                
                async with session.post(
                    f"{SUPERMEMORY_BASE_URL}/memories",
                    json=payload,
                    headers=self.headers
                ) as resp:
                    if resp.status in (200, 201):
                        data = await resp.json()
                        memory_id = data.get("id")
                        print(f"✅ Added memory for {container_tag}: {memory_id}")
                        return memory_id
                    else:
                        error = await resp.text()
                        print(f"❌ Failed to add memory: {resp.status} - {error}")
                        return None
                        
        except Exception as e:
            print(f"❌ Supermemory error: {e}")
            return None
    
    async def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """
        Get user's profile from Supermemory.
        
        This returns:
        - static: Long-term facts (goal, patterns, fears, demographics)
        - dynamic: Recent context (last few calls, current state)
        
        The profile is automatically maintained by Supermemory.
        """
        if not SUPERMEMORY_API_KEY:
            return None
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{SUPERMEMORY_BASE_URL}/user/{user_id}/profile",
                    headers=self.headers
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        print(f"📊 Fetched profile for {user_id}")
                        return UserProfile(
                            static=data.get("static", ""),
                            dynamic=data.get("dynamic", ""),
                            raw=data
                        )
                    else:
                        print(f"⚠️ No profile for {user_id}: {resp.status}")
                        return None
                        
        except Exception as e:
            print(f"❌ Supermemory profile error: {e}")
            return None
    
    async def search_memories(
        self,
        container_tag: str,
        query: str,
        limit: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Memory]:
        """
        Search user's memories.
        
        Use this for specific lookups like:
        - "What excuses has the user made?"
        - "What was said about their biggest fear?"
        """
        if not SUPERMEMORY_API_KEY:
            return []
            
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "query": query,
                    "containerTags": [container_tag],
                    "limit": limit,
                    "filters": filters or {}
                }
                
                async with session.post(
                    f"{SUPERMEMORY_BASE_URL}/search",
                    json=payload,
                    headers=self.headers
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        memories = [
                            Memory(
                                id=m.get("id", ""),
                                content=m.get("content", ""),
                                metadata=m.get("metadata", {}),
                                relevance=m.get("score", 0.0)
                            )
                            for m in data.get("results", [])
                        ]
                        print(f"🔍 Found {len(memories)} memories for '{query[:30]}...'")
                        return memories
                    else:
                        return []
                        
        except Exception as e:
            print(f"❌ Supermemory search error: {e}")
            return []
    
    # =========================================================================
    # HIGH-LEVEL METHODS FOR YOU+ SPECIFIC USE CASES
    # =========================================================================
    
    async def add_onboarding_profile(
        self,
        user_id: str,
        data: Dict[str, Any]
    ) -> bool:
        """
        Store user's onboarding profile as a memory.
        
        This is called once when onboarding completes.
        Supermemory will parse this into their User Profile.
        """
        content = self._format_onboarding_profile(data)
        memory_id = await self.add_memory(
            container_tag=user_id,
            content=content,
            metadata={
                "type": "onboarding_profile",
                "source": "onboarding_flow",
                "version": "1.0"
            }
        )
        return memory_id is not None
    
    async def add_call_transcript(
        self,
        user_id: str,
        call_number: int,
        streak_day: int,
        transcript: str,
        outcomes: Dict[str, Any]
    ) -> bool:
        """
        Store call transcript and outcomes as a memory.
        
        Called after each call completes.
        Supermemory will extract insights and update the profile.
        """
        content = f"""
CALL #{call_number} - DAY {streak_day}
{'='*50}

TRANSCRIPT:
{transcript}

OUTCOMES:
- Promise kept: {outcomes.get('promise_kept', 'unknown')}
- Tomorrow's commitment: "{outcomes.get('tomorrow_commitment', 'none')}" at {outcomes.get('commitment_time', 'unspecified')}
- Mood: {outcomes.get('mood', 'unknown')}
- Excuses detected: {', '.join(outcomes.get('excuses', [])) or 'none'}
- Key quote: "{outcomes.get('key_quote', '')}"
"""
        memory_id = await self.add_memory(
            container_tag=user_id,
            content=content,
            metadata={
                "type": "call_transcript",
                "call_number": call_number,
                "streak_day": streak_day,
                "promise_kept": outcomes.get("promise_kept"),
                "mood": outcomes.get("mood")
            }
        )
        return memory_id is not None
    
    def _format_onboarding_profile(self, data: Dict[str, Any]) -> str:
        """Format onboarding data as a rich text document for Supermemory."""
        
        # Extract fields with defaults
        goal = data.get("goal", "Not specified")
        goal_deadline = data.get("goal_deadline", "No deadline")
        motivation_level = data.get("motivation_level", 5)
        
        attempt_count = data.get("attempt_count", 0)
        how_did_quit = data.get("how_did_quit") or data.get("last_attempt_outcome", "Unknown")
        quit_pattern = data.get("quit_pattern") or data.get("quit_time", "Unknown")
        favorite_excuse = data.get("favorite_excuse", "Not shared")
        biggest_obstacle = data.get("biggest_obstacle", "Not shared")
        
        who_disappointed = data.get("who_disappointed", "Not shared")
        biggest_fear = data.get("biggest_fear", "Not shared")
        what_spent = data.get("what_spent", "Not shared")
        success_vision = data.get("success_vision", "Not shared")
        future_if_no_change = data.get("future_if_no_change", "Not shared")
        witness = data.get("witness", "No one")
        
        age = data.get("age", "Unknown")
        gender = data.get("gender", "Unknown")
        location = data.get("location", "Unknown")
        
        belief_level = data.get("belief_level", 5)
        daily_commitment = data.get("daily_commitment", "Not specified")
        
        return f"""
USER ONBOARDING PROFILE
=======================

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
"""


# Singleton instance for easy import
supermemory = SupermemoryService()
```

## Environment Variables

Add to `.env.example` and actual `.env`:

```bash
# Supermemory - Dynamic memory for user profiles
SUPERMEMORY_API_KEY=sm_your_api_key_here
```

## Usage in Agent

```python
from services.supermemory import supermemory

# In config.py, replace manual extraction with:
profile = await supermemory.get_user_profile(user_id)
if profile:
    # Use profile.static and profile.dynamic directly in prompt
    pass
```

## Testing

```python
# agent/tests/test_supermemory.py
import asyncio
from services.supermemory import supermemory

async def test_memory_flow():
    user_id = "test-user-123"
    
    # 1. Add onboarding profile
    await supermemory.add_onboarding_profile(user_id, {
        "goal": "Learn guitar",
        "motivation_level": 8,
        "favorite_excuse": "too tired",
        "biggest_fear": "dying with regret"
    })
    
    # 2. Fetch profile
    profile = await supermemory.get_user_profile(user_id)
    print(f"Static: {profile.static[:200]}...")
    print(f"Dynamic: {profile.dynamic[:200]}...")
    
    # 3. Add call transcript
    await supermemory.add_call_transcript(
        user_id=user_id,
        call_number=1,
        streak_day=1,
        transcript="Agent: Did you practice today?\nUser: Yeah I did 30 minutes!",
        outcomes={"promise_kept": True, "mood": "proud"}
    )
    
    # 4. Fetch profile again - should include call data now
    profile = await supermemory.get_user_profile(user_id)
    print(f"Updated profile: {profile.dynamic[:200]}...")

if __name__ == "__main__":
    asyncio.run(test_memory_flow())
```

---

**Status: PENDING**
**Depends on: Supermemory API key**
**Blocks: Tasks 03, 04, 05**
