"""Learning Paths Module — DAG-based adaptive learning path generation and management."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser

router = APIRouter()


@router.get("/")
async def get_learning_paths(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Get active learning paths for the current learner."""
    return {
        "items": [],
        "message": "Learning paths are generated after goal creation and diagnostic assessment.",
    }


@router.get("/current")
async def get_current_path(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Get the current active learning path with progress."""
    return {
        "path": None,
        "message": "Complete onboarding to generate your personalized learning path.",
    }


@router.get("/adaptive-status")
async def get_adaptive_status(current_user: CurrentUser):
    """Get adaptive path status — what was skipped, what changed, and why."""
    return {
        "skipped_nodes": [],
        "path_changes": [],
        "reason": "No active path yet.",
    }
