from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime

@dataclass
class FutureYouSessionData:
    """
    Shared session state for the YOU+ Future Self voice agent.
    This state persists across agent handoffs (stations).
    """
    user_id: str
    user_context: Dict[str, Any] = field(default_factory=dict)
    
    # Conversation State
    current_station: str = "hook"
    held_promise: Optional[bool] = None
    tomorrow_commitment: Optional[str] = None
    commitment_is_specific: bool = False
    
    # Analytics / Insights
    sentiments: List[str] = field(default_factory=list)
    excuses_detected: List[str] = field(default_factory=list)
    quotes_captured: List[Dict[str, Any]] = field(default_factory=list)
    
    # Call Metadata
    start_time: datetime = field(default_factory=datetime.now)
    call_ended: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "held_promise": self.held_promise,
            "tomorrow_commitment": self.tomorrow_commitment,
            "commitment_is_specific": self.commitment_is_specific,
            "sentiments": self.sentiments,
            "excuses_detected": self.excuses_detected,
            "call_duration": int((datetime.now() - self.start_time).total_seconds())
        }
