"""Mastery Module — Router for ML service (calculation + read)."""

import uuid
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.mastery.service import MasteryService

router = APIRouter()


class RecordEvidenceRequest(BaseModel):
    skill_id: str
    evidence_type: str
    source_id: str
    score: float
    max_score: float = 1.0


@router.get("/")
async def get_my_mastery(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get all mastery states for the current learner."""
    user_id = request.state.user_id
    tenant_id = request.state.tenant_id

    service = MasteryService(db)
    states = await service.get_all_mastery(user_id, tenant_id)

    mastered = sum(1 for s in states if s.status == "mastered")
    learning = sum(1 for s in states if s.status == "learning")
    practiced = sum(1 for s in states if s.status == "practiced")

    return {
        "summary": {
            "total_skills": len(states),
            "mastered": mastered,
            "learning": learning,
            "practiced": practiced,
            "not_started": len(states) - mastered - learning - practiced,
            "overall_progress": (mastered / max(len(states), 1)) * 100,
        },
        "skills": [
            {
                "skill_id": str(s.skill_id),
                "mastery_score": round(s.mastery_score, 3),
                "confidence": round(s.confidence, 3),
                "status": s.status,
                "evidence_count": s.evidence_count,
                "retention_estimate": round(service.estimate_retention(s), 3),
                "last_assessed_at": s.last_assessed_at.isoformat() if s.last_assessed_at else None,
            }
            for s in states
        ],
    }


@router.get("/{skill_id}")
async def get_skill_mastery(
    skill_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get mastery state for a specific skill."""
    user_id = request.state.user_id
    tenant_id = request.state.tenant_id

    service = MasteryService(db)
    state = await service.get_mastery(user_id, skill_id, tenant_id)

    if not state:
        return {
            "skill_id": str(skill_id),
            "mastery_score": 0.0,
            "confidence": 0.0,
            "status": "not_started",
            "evidence_count": 0,
        }

    return {
        "skill_id": str(state.skill_id),
        "mastery_score": round(state.mastery_score, 3),
        "confidence": round(state.confidence, 3),
        "status": state.status,
        "evidence_count": state.evidence_count,
        "retention_estimate": round(service.estimate_retention(state), 3),
        "difficulty_estimate": round(state.difficulty_estimate, 3),
        "last_assessed_at": state.last_assessed_at.isoformat() if state.last_assessed_at else None,
    }


@router.post("/record-evidence")
async def record_evidence(
    data: RecordEvidenceRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Record mastery evidence and recalculate (Bayesian update).

    Called by the Next.js gateway after assessment submissions.
    """
    user_id = request.state.user_id
    tenant_id = request.state.tenant_id

    service = MasteryService(db)
    state = await service.record_evidence(
        learner_id=user_id,
        skill_id=data.skill_id,
        tenant_id=tenant_id,
        evidence_type=data.evidence_type,
        source_id=data.source_id,
        score=data.score,
        max_score=data.max_score,
    )

    return {
        "skill_id": str(state.skill_id),
        "mastery_score": round(state.mastery_score, 3),
        "confidence": round(state.confidence, 3),
        "status": state.status,
        "evidence_count": state.evidence_count,
    }
