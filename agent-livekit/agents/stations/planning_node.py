"""
PlanningNode - Station for tomorrow's commitment
================================================

Handles the TOMORROW_LOCK phase.
"""

import os
from typing import Optional, Any
from loguru import logger

from livekit.agents import Agent, function_tool, RunContext
from livekit.agents.llm import ChatContext, ChatMessage

from core.models import FutureYouSessionData
from conversation.call_types import CallType
from conversation.mood import Mood
from conversation.stages.models import CallStage

class PlanningNode(Agent):
    """
    Station agent for setting tomorrow's goals.
    """

    def __init__(
        self,
        system_prompt: str,
        user_id: str = "unknown",
        user_context: Optional[dict] = None,
        call_type: Optional[CallType] = None,
        mood: Optional[Mood] = None,
        call_memory: Optional[dict] = None,
        persona_controller: Optional[Any] = None,
        # LiveKit Agent components
        stt=None,
        tts=None,
        vad=None,
        llm=None,
    ):
        super().__init__(
            instructions=system_prompt,
            stt=stt,
            tts=tts,
            vad=vad,
            llm=llm,
        )
        self.system_prompt = system_prompt
        self.user_id = user_id
        self.user_context = user_context or {}
        self.call_type = call_type
        self.mood = mood
        self.call_memory = call_memory or {}
        self.persona_controller = persona_controller
        self.current_stage = CallStage.TOMORROW_LOCK

    async def on_enter(self, context: RunContext[FutureYouSessionData]) -> None:
        """Called when this station becomes active."""
        logger.info(f"PlanningNode entered. Context current_station: {context.userdata.current_station}")
        
        instructions = "Transition to tomorrow's plan. Ask the user specifically what they will do tomorrow and at what time."
        
        if context.userdata.tomorrow_commitment:
            instructions = f"The user already mentioned a commitment: {context.userdata.tomorrow_commitment}. Confirm if they are locking this in and at what time."

        await self.session.generate_reply(instructions=instructions)

    @function_tool()
    async def lock_commitment(self, context: RunContext[FutureYouSessionData]):
        """Lock in the commitment and handoff back to FutureYouNode for closing."""
        from core.agent import FutureYouNode
        
        logger.info("Station Handoff: PlanningNode -> FutureYouNode (Close)")
        context.userdata.current_station = "hook" # Reset or set to close
        # Note: In our model, we might want a 'close' station value, 
        # but for now we'll use FutureYouNode to handle it.
        
        # We need to ensure FutureYouNode knows to go to CLOSE stage.
        node = FutureYouNode(
            system_prompt=self.system_prompt,
            user_id=self.user_id,
            user_context=self.user_context,
            call_type=self.call_type,
            mood=self.mood,
            call_memory=self.call_memory,
            persona_controller=self.persona_controller,
            # Pass components to new station
            stt=self.stt,
            tts=self.tts,
            vad=self.vad,
            llm=self.llm,
        )
        node.current_stage = CallStage.CLOSE

        return node, "Commitment locked. Handing back for closing thoughts."

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        """Process user message during planning."""
        text = new_message.text_content()
        logger.info(f"PlanningNode processing: {text}")
        
        # In a real implementation, we'd use CommitmentExtractorNode insight here.
        if hasattr(self.session, 'userdata') and isinstance(self.session.userdata, FutureYouSessionData):
            if self.session.userdata.tomorrow_commitment:
                turn_ctx.add_message(
                    role="system",
                    content=f"[STATE: Commitment detected: {self.session.userdata.tomorrow_commitment}. If specific (action + time), call lock_commitment.]"
                )
            else:
                turn_ctx.add_message(
                    role="system",
                    content="[STATE: No specific commitment detected yet. Keep pushing for Action + Time.]"
                )
