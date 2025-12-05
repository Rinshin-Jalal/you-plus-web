"""
Custom Events for Multi-Agent Communication
=============================================

These events enable background agents to communicate insights
to the main FutureYouNode speaking agent.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ExcuseDetected(BaseModel):
    """Emitted when user's response matches a known excuse pattern."""

    excuse_text: str  # The excuse they gave
    matches_favorite: bool  # True if matches their onboarding "favorite_excuse"
    favorite_excuse: Optional[str] = None  # Their known favorite excuse for reference
    confidence: float = 0.0  # 0.0 - 1.0


class SentimentAnalysis(BaseModel):
    """Emitted after analyzing user's emotional state."""

    sentiment: str  # positive, negative, neutral, frustrated, deflecting, defensive
    confidence: float = 0.0
    indicators: list[str] = Field(
        default_factory=list
    )  # Words/phrases that triggered this
    timestamp: datetime = Field(default_factory=datetime.now)


class CommitmentIdentified(BaseModel):
    """Emitted when user states a commitment for tomorrow."""

    commitment_text: str  # Raw text of what they said
    action: Optional[str] = None  # Extracted action (e.g., "go to gym")
    time: Optional[str] = None  # Extracted time (e.g., "6am", "after work")
    is_specific: bool = False  # True if has both action AND time
    confidence: float = 0.0


class PromiseResponse(BaseModel):
    """Emitted when user responds to 'did you do it?' question."""

    kept: Optional[bool] = None  # True = yes, False = no, None = unclear
    response_text: str  # What they said
    excuse_detected: Optional[str] = None  # Linked excuse if promise broken
    confidence: float = 0.0


class UserFrustrated(BaseModel):
    """Emitted when user shows signs of frustration."""

    frustration_level: str  # low, medium, high
    trigger: Optional[str] = None  # What seemed to trigger it
    suggested_action: str = "soften_tone"  # soften_tone, acknowledge, back_off


class PatternAlert(BaseModel):
    """Emitted when user's behavior matches a concerning pattern."""

    pattern_type: str  # quit_pattern, excuse_spiral, disengagement
    description: str
    historical_context: Optional[str] = None  # e.g., "User usually quits around day 14"


class MemorableQuoteDetected(BaseModel):
    """Emitted when user says something worth remembering for future callbacks."""

    quote_text: str  # The memorable quote
    context: (
        str  # e.g., "vulnerability", "breakthrough", "commitment", "fear", "victory"
    )
    emotional_weight: float = 0.5  # 0.0 - 1.0, how emotionally significant
    callback_potential: str = (
        "medium"  # low, medium, high - how good for future callbacks
    )


class ExcuseCallout(BaseModel):
    """Emitted when excuse should be called out to the user."""

    excuse_text: str  # The excuse they gave
    callout_type: str  # "favorite" | "repeat" | "deflection"
    suggested_response: str  # Pre-crafted callout for agent to use/adapt


class CallSummary(BaseModel):
    """Emitted at end of call with aggregated analytics."""

    user_id: str
    call_duration_seconds: int
    promise_kept: Optional[bool] = None  # From PromiseResponse
    tomorrow_commitment: Optional[str] = None  # From CommitmentIdentified
    commitment_time: Optional[str] = None
    commitment_is_specific: bool = False
    sentiment_trajectory: list[str] = Field(
        default_factory=list
    )  # e.g., ["neutral", "defensive", "positive"]
    excuses_detected: list[str] = Field(default_factory=list)
    quotes_captured: list[str] = Field(
        default_factory=list
    )  # Memorable quotes from this call
    call_type: str = "audit"
    mood: str = "warm_direct"
    call_quality_score: float = 0.5  # 0.0 - 1.0 based on engagement
