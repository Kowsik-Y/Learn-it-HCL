"""Learner Module — Router for profiles, preferences, goals, and onboarding."""

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.learners.models import LearnerProfile, LearnerPreferences, LearnerGoal

router = APIRouter()


@router.get("/profile")
async def get_learner_profile(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get the current learner's profile."""
    stmt = select(LearnerProfile).where(LearnerProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        # Auto-create profile on first access
        profile = LearnerProfile(
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
        )
        db.add(profile)
        await db.flush()

    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "language": profile.language,
        "timezone": profile.timezone,
        "onboarding_completed": profile.onboarding_completed,
        "onboarding_data": profile.onboarding_data,
    }


@router.get("/goals")
async def list_learner_goals(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List the current learner's goals."""
    profile_stmt = select(LearnerProfile).where(LearnerProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_stmt)
    profile = profile_result.scalar_one_or_none()
    if not profile:
        return {"items": []}

    stmt = select(LearnerGoal).where(
        LearnerGoal.learner_id == profile.id,
        LearnerGoal.is_active == True,
    )
    result = await db.execute(stmt)
    goals = result.scalars().all()

    return {
        "items": [
            {
                "id": str(g.id),
                "title": g.title,
                "goal_type": g.goal_type,
                "target_role": g.target_role,
                "time_horizon_weeks": g.time_horizon_weeks,
                "hours_per_week": g.hours_per_week,
                "progress_percentage": g.progress_percentage,
                "is_active": g.is_active,
            }
            for g in goals
        ]
    }


@router.get("/daily-check-in")
async def get_daily_check_in(current_user: CurrentUser):
    """Get the daily check-in prompt for the learner."""
    return {
        "prompt": "How are you feeling today?",
        "energy_options": [
            {"value": "ready", "label": "Ready 🔥", "emoji": "🔥"},
            {"value": "good", "label": "Good 🙂", "emoji": "🙂"},
            {"value": "okay", "label": "Okay 😐", "emoji": "😐"},
            {"value": "tired", "label": "Tired 😴", "emoji": "😴"},
            {"value": "overwhelmed", "label": "Overwhelmed 😵", "emoji": "😵"},
        ],
        "time_options": [
            {"value": 5, "label": "5 min"},
            {"value": 15, "label": "15 min"},
            {"value": 30, "label": "30 min"},
            {"value": 60, "label": "60+ min"},
        ],
    }
