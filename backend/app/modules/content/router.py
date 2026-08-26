"""Content Module — Router for courses, lessons, and resources."""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.content.models import Course, Module, Chapter, Lesson

router = APIRouter()


@router.get("/courses")
async def list_courses(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """List available courses with filtering."""
    stmt = select(Course).where(
        Course.tenant_id == current_user.tenant_id,
        Course.is_published == True,
    )
    if search:
        stmt = stmt.where(Course.title.ilike(f"%{search}%"))
    if difficulty:
        stmt = stmt.where(Course.difficulty_level == difficulty)

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    courses = result.scalars().all()

    return {
        "items": [
            {
                "id": str(c.id),
                "title": c.title,
                "slug": c.slug,
                "short_description": c.short_description,
                "difficulty_level": c.difficulty_level,
                "estimated_duration_hours": c.estimated_duration_hours,
                "thumbnail_url": c.thumbnail_url,
                "enrollment_count": c.enrollment_count,
                "rating": c.rating,
                "is_free": c.is_free,
            }
            for c in courses
        ],
        "page": page,
        "page_size": page_size,
    }


@router.get("/courses/{course_id}")
async def get_course(
    course_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get full course details with modules and chapters."""
    stmt = (
        select(Course)
        .where(Course.id == course_id, Course.tenant_id == current_user.tenant_id)
        .options(selectinload(Course.modules).selectinload(Module.chapters))
    )
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    if not course:
        from app.core.errors import NotFoundError
        raise NotFoundError("Course", str(course_id))

    return {
        "id": str(course.id),
        "title": course.title,
        "description": course.description,
        "difficulty_level": course.difficulty_level,
        "estimated_duration_hours": course.estimated_duration_hours,
        "modules": [
            {
                "id": str(m.id),
                "title": m.title,
                "order_index": m.order_index,
                "chapters": [
                    {"id": str(ch.id), "title": ch.title, "order_index": ch.order_index}
                    for ch in m.chapters
                ],
            }
            for m in course.modules
        ],
    }


@router.get("/lessons/{lesson_id}")
async def get_lesson(
    lesson_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get a single lesson for the lesson player."""
    stmt = select(Lesson).where(
        Lesson.id == lesson_id, Lesson.tenant_id == current_user.tenant_id
    )
    result = await db.execute(stmt)
    lesson = result.scalar_one_or_none()
    if not lesson:
        from app.core.errors import NotFoundError
        raise NotFoundError("Lesson", str(lesson_id))

    return {
        "id": str(lesson.id),
        "title": lesson.title,
        "description": lesson.description,
        "content_type": lesson.content_type,
        "content_url": lesson.content_url,
        "content_body": lesson.content_body,
        "estimated_duration_minutes": lesson.estimated_duration_minutes,
        "difficulty_level": lesson.difficulty_level,
        "skill_ids": lesson.skill_ids,
        "learning_objectives": lesson.learning_objectives,
    }
