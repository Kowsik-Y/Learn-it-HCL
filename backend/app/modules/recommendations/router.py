"""Recommendations Module — Router."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.recommendations.engine import RecommendationEngine

router = APIRouter()


@router.get("/")
async def get_recommendations(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    max_results: int = Query(10, ge=1, le=50),
    available_minutes: Optional[int] = None,
):
    """Get personalized recommendations for the current learner."""
    engine = RecommendationEngine(db)
    results = await engine.generate_recommendations(
        learner_id=current_user.id,
        tenant_id=current_user.tenant_id,
        max_results=max_results,
        available_minutes=available_minutes,
    )

    return {
        "items": [
            {
                "resource_id": r.resource_id,
                "resource_type": r.resource_type,
                "title": r.title,
                "score": r.score,
                "rank": r.rank,
                "confidence": r.confidence,
                "reasons": r.reasons,
                "fills_skills": r.fills_skills,
                "estimated_duration_minutes": r.estimated_duration_minutes,
            }
            for r in results
        ],
        "total": len(results),
    }


@router.get("/daily-mission")
async def get_daily_mission(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    available_minutes: int = Query(30, ge=5, le=120),
):
    """Generate today's personalized learning mission."""
    engine = RecommendationEngine(db)
    results = await engine.generate_recommendations(
        learner_id=current_user.id,
        tenant_id=current_user.tenant_id,
        max_results=4,
        available_minutes=available_minutes,
    )

    primary = results[0] if results else None
    review = results[1] if len(results) > 1 else None
    challenge = results[2] if len(results) > 2 else None
    optional = results[3] if len(results) > 3 else None

    total_xp = sum(
        30 if r.resource_type == "lesson" else 20
        for r in results
    )

    return {
        "date": "today",
        "estimated_minutes": sum(r.estimated_duration_minutes for r in results),
        "primary_task": _format_mission_task(primary, "lesson") if primary else None,
        "review_task": _format_mission_task(review, "review") if review else None,
        "challenge_task": _format_mission_task(challenge, "challenge") if challenge else None,
        "optional_task": _format_mission_task(optional, "optional") if optional else None,
        "total_xp_available": total_xp,
    }


def _format_mission_task(result, task_type: str) -> dict:
    return {
        "title": result.title,
        "task_type": task_type,
        "estimated_minutes": result.estimated_duration_minutes,
        "xp_reward": 30 if task_type == "lesson" else 20,
        "resource_id": result.resource_id,
        "reasons": result.reasons,
    }
