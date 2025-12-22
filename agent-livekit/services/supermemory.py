""
import os
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime

try:
    import supermemory as sm_sdk
except ImportError:
    sm_sdk = None

SUPERMEMORY_API_KEY = os.getenv("SUPERMEMORY_API_KEY")

@dataclass
class UserProfile:
    static: List[str]
    dynamic: List[str]
    def to_prompt_context(self) -> str:
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
    def __init__(self):
        self.enabled = bool(SUPERMEMORY_API_KEY) and (sm_sdk is not None)
        self._client = None
    @property
    def client(self):
        if self._client is None and self.enabled:
            self._client = sm_sdk.AsyncSupermemory(api_key=SUPERMEMORY_API_KEY)
        return self._client
    async def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        if not self.enabled: return None
        try:
            response = await self.client.profile(container_tag=user_id)
            static_facts = response.profile.static if response.profile else []
            dynamic_facts = response.profile.dynamic if response.profile else []
            return UserProfile(static=static_facts or [], dynamic=dynamic_facts or [])
        except Exception as e:
            print(f"Supermemory profile error: {e}")
            return None
    async def add_memory(self, container_tag: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        if not self.enabled: return None
        try:
            response = await self.client.add(content=content, container_tags=[container_tag], metadata=metadata or {})
            return response.id if response else None
        except Exception as e:
            print(f"Supermemory add error: {e}")
            return None
    async def add_call_transcript(self, user_id: str, call_number: int, streak_day: int, call_type: str, emotional_weather: str, transcript: List[Dict[str, str]], outcomes: Dict[str, Any]) -> bool:
        transcript_text = "\n".join([f"{msg.get('role')}: {msg.get('content', '')}" for msg in transcript])
        content = f"CALL #{call_number}\n{transcript_text}"
        memory_id = await self.add_memory(container_tag=user_id, content=content, metadata={"type": "call_transcript"})
        return memory_id is not None

MEMORY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "searchMemories",
            "description": "Search the user's memory.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "addMemory",
            "description": "Store new information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {"type": "string"},
                    "memory_type": {"type": "string"},
                },
                "required": ["content", "memory_type"],
            },
        },
    },
]

async def execute_memory_tool(tool_name: str, arguments: Dict[str, Any], container_tag: str) -> str:
    if tool_name == "searchMemories":
        return await _execute_search_memories(arguments.get("query", ""), container_tag)
    elif tool_name == "addMemory":
        return await _execute_add_memory(arguments.get("content", ""), arguments.get("memory_type", "personal_info"), container_tag)
    return f"Unknown tool: {tool_name}"

async def _execute_search_memories(query: str, container_tag: str) -> str:
    if not supermemory_service.enabled: return "Unavailable"
    try:
        results = await supermemory_service.client.search.memories(q=query, container_tag=container_tag, limit=5)
        if results.results:
            return "\n".join([f"- {r.memory}" for r in results.results])
        return "No results"
    except Exception: return "Error"

async def _execute_add_memory(content: str, memory_type: str, container_tag: str) -> str:
    if not supermemory_service.enabled: return "Unavailable"
    memory_id = await supermemory_service.add_memory(container_tag=container_tag, content=content, metadata={"type": memory_type})
    return "Success" if memory_id else "Failed"

supermemory_service = SupermemoryService()