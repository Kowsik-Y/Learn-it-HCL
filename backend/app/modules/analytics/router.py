"""Analytics Module — Event tracking and dashboard data."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_data(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Get dashboard analytics data based on user role."""
    return {
        "role": current_user.role,
        "active_learners": 0,
        "courses_count": 0,
        "assessments_taken": 0,
        "average_mastery": 0,
    }


@router.get("/learner-summary")
async def get_learner_summary(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Get summary analytics for the current learner."""
    return {
        "total_learning_minutes": 0,
        "lessons_completed": 0,
        "quizzes_taken": 0,
        "skills_practiced": 0,
        "current_streak": 0,
    }
