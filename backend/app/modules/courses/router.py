"""Courses Module — Course management for teachers and admins."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser

router = APIRouter()


@router.get("/")
async def list_courses(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """List courses managed by the current teacher/admin."""
    return {"items": [], "total": 0}


@router.get("/{course_id}/analytics")
async def get_course_analytics(course_id: str, current_user: CurrentUser):
    """Get analytics for a course (teacher/admin view)."""
    return {"course_id": course_id, "analytics": {}}
