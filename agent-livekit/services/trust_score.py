"""
Trust Score Service
===================

Manages trust scores for users and their pillars.

Trust Score: 0-100
- Represents how much the user follows through on their commitments
- Per-pillar AND overall aggregate
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
from typing import Optional, Dict, List, Tuple, Any
import os
import logging

try:
    from supabase import create_client, Client

    HAS_SUPABASE = True
except ImportError:
    create_client = None  # type: ignore
    Client = None  # type: ignore
    HAS_SUPABASE = False

logger = logging.getLogger(__name__)


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
    # Streak bonuses
    "streak_7": TrustDelta(+2, "7-day streak bonus"),
    "streak_14": TrustDelta(+3, "14-day streak bonus"),
    "streak_30": TrustDelta(+5, "30-day streak bonus"),
}


class TrustScoreService:
    """
    Service for managing trust scores.

    Usage:
        service = TrustScoreService()

        # Get current scores
        overall = await service.get_overall_trust(user_id)
        pillar_trust = await service.get_pillar_trust(pillar_id)

        # Apply changes
        await service.apply_delta(user_id, "kept_promise", pillar_id="abc123")
    """

    def __init__(self):
        self._client: Any = None

    def _get_client(self) -> Any:
        """Get or create Supabase client."""
        if self._client is None:
            if SUPABASE_URL and SUPABASE_SERVICE_KEY and create_client:
                try:
                    self._client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
                except Exception as e:
                    logger.error(f"Failed to create Supabase client: {e}")
        return self._client

    async def get_overall_trust(self, user_id: str) -> int:
        """Get user's overall trust score."""
        client = self._get_client()
        if not client:
            return 50

        try:
            result = (
                client.table("status")
                .select("overall_trust_score")
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            if result.data:
                return result.data.get("overall_trust_score", 50) or 50
            return 50
        except Exception as e:
            logger.error(f"Failed to get trust score: {e}")
            return 50

    async def get_pillar_trust(self, pillar_id: str) -> int:
        """Get trust score for a specific pillar."""
        client = self._get_client()
        if not client:
            return 50

        try:
            result = (
                client.table("future_self_pillars")
                .select("trust_score")
                .eq("id", pillar_id)
                .single()
                .execute()
            )
            if result.data:
                return result.data.get("trust_score", 50) or 50
            return 50
        except Exception as e:
            logger.error(f"Failed to get pillar trust: {e}")
            return 50

    async def get_all_pillar_trusts(self, user_id: str) -> Dict[str, int]:
        """Get trust scores for all pillars."""
        client = self._get_client()
        if not client:
            return {}

        try:
            result = (
                client.table("future_self_pillars")
                .select("id,pillar,trust_score")
                .eq("user_id", user_id)
                .execute()
            )
            if result.data:
                # Return dict keyed by pillar name (body, mission, stack, tribe)
                return {
                    p["pillar"]: p.get("trust_score", 50) or 50 for p in result.data
                }
            return {}
        except Exception as e:
            logger.error(f"Failed to get pillar trusts: {e}")
            return {}

    async def get_trust_context(self, user_id: str) -> Dict:
        """
        Get complete trust context for a user.

        Returns:
            Dict with overall_trust, pillar_trusts, trust_zone, and summary
        """
        overall = await self.get_overall_trust(user_id)
        pillar_trusts = await self.get_all_pillar_trusts(user_id)

        # Determine trust zone
        if overall <= 30:
            zone = "low"
            zone_description = "Trust needs rebuilding. Show consistent follow-through."
        elif overall <= 60:
            zone = "building"
            zone_description = "Trust is growing. Keep showing up."
        else:
            zone = "high"
            zone_description = "Strong trust. Maintain consistency."

        # Find pillars needing attention (low trust)
        pillars_needing_attention = [
            pillar for pillar, trust in pillar_trusts.items() if trust < 40
        ]

        return {
            "overall_trust": overall,
            "pillar_trusts": pillar_trusts,
            "trust_zone": zone,
            "zone_description": zone_description,
            "pillars_needing_attention": pillars_needing_attention,
        }

    async def apply_delta(
        self, user_id: str, delta_type: str, pillar_id: Optional[str] = None
    ) -> Tuple[int, int]:
        """
        Apply a trust score change.

        Args:
            user_id: User's ID
            delta_type: Key from TRUST_DELTAS
            pillar_id: Optional pillar ID to apply delta to

        Returns:
            Tuple of (new_overall_trust, delta_applied)
        """
        delta = TRUST_DELTAS.get(delta_type)
        if not delta:
            return await self.get_overall_trust(user_id), 0

        client = self._get_client()
        if not client:
            return 50, 0

        try:
            # Get current score
            current = await self.get_overall_trust(user_id)
            new_score = max(0, min(100, current + delta.delta))

            # Update overall trust
            client.table("status").update({"overall_trust_score": new_score}).eq(
                "user_id", user_id
            ).execute()

            # Also update pillar trust if pillar_id provided
            if pillar_id:
                pillar_trust = await self.get_pillar_trust(pillar_id)
                new_pillar_trust = max(0, min(100, pillar_trust + delta.delta))

                client.table("future_self_pillars").update(
                    {"trust_score": new_pillar_trust}
                ).eq("id", pillar_id).execute()

            logger.info(f"Trust: {current} -> {new_score} ({delta.reason})")
            return new_score, delta.delta

        except Exception as e:
            logger.error(f"Failed to apply trust delta: {e}")
            return 50, 0

    async def apply_checkin_result(
        self,
        user_id: str,
        pillar: str,
        pillar_id: str,
        kept: bool,
        used_favorite_excuse: bool = False,
        streak_count: int = 0,
    ) -> Dict:
        """
        Apply trust changes based on a pillar check-in result.

        This is the main method to use after a check-in is recorded.
        It handles all the trust logic including streak bonuses.

        Args:
            user_id: User's ID
            pillar: Pillar name (body, mission, stack, tribe)
            pillar_id: Pillar ID to update
            kept: Whether they kept their promise
            used_favorite_excuse: Whether they used their go-to excuse
            streak_count: Current streak count (for bonus calculation)

        Returns:
            Dict with old_trust, new_trust, delta, and reason
        """
        old_trust = await self.get_overall_trust(user_id)

        if kept:
            # Base kept promise delta
            delta_type = "kept_promise"

            # Check for streak bonuses (applied separately)
            if streak_count == 7:
                await self.apply_delta(user_id, "streak_7", pillar_id)
            elif streak_count == 14:
                await self.apply_delta(user_id, "streak_14", pillar_id)
            elif streak_count == 30:
                await self.apply_delta(user_id, "streak_30", pillar_id)
        else:
            if used_favorite_excuse:
                delta_type = "favorite_excuse"
            else:
                delta_type = "broke_promise"

        new_trust, delta = await self.apply_delta(user_id, delta_type, pillar_id)

        return {
            "old_trust": old_trust,
            "new_trust": new_trust,
            "delta": delta,
            "reason": TRUST_DELTAS[delta_type].reason,
            "pillar": pillar,
        }

    async def get_severity_level(self, user_id: str, excuse_pattern: str) -> int:
        """
        Get the severity level for a repeated excuse pattern.

        Checks how many times this excuse pattern has been used recently.

        Args:
            user_id: User's ID
            excuse_pattern: Normalized excuse pattern (e.g., "too_tired")

        Returns:
            Severity level 1-4
        """
        client = self._get_client()
        if not client:
            return 1

        try:
            # Count recent occurrences of this excuse pattern in pillar checkins
            result = (
                client.table("pillar_checkins")
                .select("id")
                .eq("user_id", user_id)
                .eq("excuse_used", excuse_pattern)
                .gte("checked_at", "now() - interval '30 days'")
                .execute()
            )

            count = len(result.data) if result.data else 0

            # Map count to severity level
            if count <= 1:
                return 1
            elif count == 2:
                return 2
            elif count == 3:
                return 3
            else:
                return 4

        except Exception as e:
            logger.error(f"Failed to get severity level: {e}")
            return 1


# Singleton instance
trust_score_service = TrustScoreService()
