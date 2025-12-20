"""
TruthNode - Station for accountability audit
=============================================

Handles the ACCOUNTABILITY and DIG_DEEPER phases.
"""

import os
from datetime import datetime
from typing import Optional, Any
from loguru import logger

from livekit.agents import Agent, function_tool, RunContext
from livekit.agents.llm import ChatContext, ChatMessage

from core.models import FutureYouSessionData
from conversation.call_types import CallType
from conversation.mood import Mood
from conversation.stages.models import CallStage
from core.agent import FutureYouNode

class TruthNode(Agent):
    """
    Station agent for the accountability audit.
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
        self.current_stage = CallStage.ACCOUNTABILITY

    async def on_enter(self, context: RunContext[FutureYouSessionData]) -> None:
        """Called when this station becomes active."""
        logger.info(f"TruthNode entering. Context current_station: {context.userdata.current_station}")
        
        # Determine starting greeting based on promise status if known
        instructions = "You are now in the accountability phase. Ask the user if they kept their promise for today."
        
        if context.userdata.held_promise is True:
            instructions = "The user kept their promise! Acknowledge their success warmly and ask what they learned."
        elif context.userdata.held_promise is False:
            instructions = "The user broke their promise. Call them out firmly but with love as their future self, and ask why."

        await self.session.generate_reply(instructions=instructions)

    @function_tool()
    async def complete_audit(self, context: RunContext[FutureYouSessionData]):
        """Complete the accountability audit and handoff to the PlanningNode."""
        from agents.stations.planning_node import PlanningNode
        
        logger.info("Station Handoff: TruthNode -> PlanningNode")
        context.userdata.current_station = "planning"
        
        return PlanningNode(
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
        ), "Transitioning to planning for tomorrow."

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        """Process user message during accountability audit."""
        text = new_message.text_content()
        logger.info(f"TruthNode processing: {text}")
        
        # Additional system instructions could be injected here based on insights
        if hasattr(self.session, 'userdata') and isinstance(self.session.userdata, FutureYouSessionData):
             insights = self.session.userdata.sentiments
             if insights:
                 turn_ctx.add_message(
                     role="system",
                     content=f"[INSIGHTS: Recent user sentiments: {', '.join(insights[-2:])}]"
                 )
