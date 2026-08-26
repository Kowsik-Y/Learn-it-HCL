"""Mastery Module — Router for mastery states and skill maps."""

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.mastery.service import MasteryService

router = APIRouter()


@router.get("/")
async def get_my_mastery(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get all mastery states for the current learner."""
    service = MasteryService(db)
    states = await service.get_all_mastery(current_user.id, current_user.tenant_id)

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
    skill_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get mastery state for a specific skill."""
    service = MasteryService(db)
    state = await service.get_mastery(current_user.id, skill_id, current_user.tenant_id)

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
