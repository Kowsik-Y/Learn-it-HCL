"""
Mastery Service — Evidence-based mastery calculation.

Core principle: completed course ≠ mastered.
Mastery = f(assessment_performance, retrieval_success, recency, difficulty, consistency)
"""

import uuid
import math
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.mastery.models import MasteryState, MasteryEvidence


class MasteryService:
    """Calculates and updates mastery states based on evidence."""

    # Weight configuration for evidence types
    EVIDENCE_WEIGHTS = {
        "assessment": 1.0,
        "quiz": 0.8,
        "diagnostic": 0.9,
        "practice": 0.5,
        "project": 1.2,
        "review": 0.6,
        "teacher_override": 1.5,
    }

    # Retention decay constant (forgetting curve)
    RETENTION_DECAY_RATE = 0.1

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_mastery(
        self, learner_id: uuid.UUID, skill_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> MasteryState | None:
        """Get current mastery state for a learner-skill pair."""
        stmt = select(MasteryState).where(
            MasteryState.learner_id == learner_id,
            MasteryState.skill_id == skill_id,
            MasteryState.tenant_id == tenant_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_mastery(
        self, learner_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> list[MasteryState]:
        """Get all mastery states for a learner."""
        stmt = select(MasteryState).where(
            MasteryState.learner_id == learner_id,
            MasteryState.tenant_id == tenant_id,
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def record_evidence(
        self,
        learner_id: uuid.UUID,
        skill_id: uuid.UUID,
        tenant_id: uuid.UUID,
        evidence_type: str,
        source_id: uuid.UUID,
        score: float,
        max_score: float = 1.0,
    ) -> MasteryState:
        """Record new evidence and recalculate mastery."""
        now = datetime.now(timezone.utc)

        # Get or create mastery state
        mastery = await self.get_mastery(learner_id, skill_id, tenant_id)
        if not mastery:
            mastery = MasteryState(
                learner_id=learner_id,
                skill_id=skill_id,
                tenant_id=tenant_id,
                mastery_score=0.0,
                confidence=0.0,
                evidence_count=0,
                retention_estimate=1.0,
                difficulty_estimate=0.5,
                status="not_started",
            )
            self.db.add(mastery)
            await self.db.flush()

        # Record evidence
        weight = self.EVIDENCE_WEIGHTS.get(evidence_type, 0.5)
        evidence = MasteryEvidence(
            mastery_state_id=mastery.id,
            tenant_id=tenant_id,
            evidence_type=evidence_type,
            source_id=source_id,
            score=score,
            max_score=max_score,
            weight=weight,
            created_at=now,
        )
        self.db.add(evidence)

        # Recalculate mastery using weighted Bayesian update
        mastery = await self._recalculate_mastery(mastery, score / max_score, weight)
        mastery.last_assessed_at = now
        mastery.last_practiced_at = now
        mastery.evidence_count += 1

        await self.db.flush()
        return mastery

    async def _recalculate_mastery(
        self, mastery: MasteryState, normalized_score: float, weight: float
    ) -> MasteryState:
        """
        Bayesian-inspired mastery update.

        Uses exponential moving average weighted by evidence quality.
        Higher evidence count → lower learning rate (more stable estimates).
        """
        # Adaptive learning rate: decreases as we accumulate more evidence
        evidence_factor = 1.0 / (1.0 + 0.1 * mastery.evidence_count)
        learning_rate = max(0.05, min(0.5, evidence_factor * weight))

        # Update mastery score (bounded 0-1)
        new_mastery = (
            mastery.mastery_score * (1 - learning_rate)
            + normalized_score * learning_rate
        )
        mastery.mastery_score = max(0.0, min(1.0, new_mastery))

        # Update confidence (increases with evidence count)
        mastery.confidence = min(1.0, 1.0 - math.exp(-0.3 * mastery.evidence_count))

        # Update retention estimate (resets on practice)
        mastery.retention_estimate = 1.0

        # Update difficulty estimate based on performance
        if normalized_score > 0.8:
            mastery.difficulty_estimate = max(0.0, mastery.difficulty_estimate - 0.05)
        elif normalized_score < 0.4:
            mastery.difficulty_estimate = min(1.0, mastery.difficulty_estimate + 0.05)

        # Update status
        if mastery.mastery_score >= 0.85 and mastery.confidence >= 0.6:
            mastery.status = "mastered"
        elif mastery.mastery_score >= 0.5:
            mastery.status = "practiced"
        elif mastery.evidence_count > 0:
            mastery.status = "learning"
        else:
            mastery.status = "not_started"

        return mastery

    def estimate_retention(self, mastery: MasteryState) -> float:
        """
        Estimate current retention using a simplified forgetting curve.

        R(t) = e^(-λt) where t is days since last practice
        """
        if not mastery.last_practiced_at:
            return 0.0

        days_since = (datetime.now(timezone.utc) - mastery.last_practiced_at).days
        retention = math.exp(-self.RETENTION_DECAY_RATE * days_since)
        return max(0.0, min(1.0, retention))
