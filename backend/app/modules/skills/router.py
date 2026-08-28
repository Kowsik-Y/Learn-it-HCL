"""Skills Module — Router with basic CRUD and skill graph queries."""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.skills.models import Skill, SkillRelationship, CareerRole, RoleSkill

router = APIRouter()


@router.get("/")
async def list_skills(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List all skills with optional filtering."""
    stmt = select(Skill).where(
        Skill.tenant_id == current_user.tenant_id,
        Skill.is_active == True,
    )
    if category:
        stmt = stmt.where(Skill.category == category)
    if search:
        stmt = stmt.where(Skill.name.ilike(f"%{search}%"))

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    skills = result.scalars().all()

    # Count
    count_stmt = select(func.count(Skill.id)).where(
        Skill.tenant_id == current_user.tenant_id, Skill.is_active == True
    )
    if category:
        count_stmt = count_stmt.where(Skill.category == category)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    return {
        "items": [
            {
                "id": str(s.id),
                "name": s.name,
                "slug": s.slug,
                "category": s.category,
                "description": s.description,
                "difficulty_level": s.difficulty_level,
            }
            for s in skills
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{skill_id}")
async def get_skill(
    skill_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get a single skill with its relationships."""
    stmt = select(Skill).where(
        Skill.id == skill_id,
        Skill.tenant_id == current_user.tenant_id,
    )
    result = await db.execute(stmt)
    skill = result.scalar_one_or_none()
    if not skill:
        from app.core.errors import NotFoundError
        raise NotFoundError("Skill", str(skill_id))

    # Get prerequisites
    prereq_stmt = select(SkillRelationship).where(
        SkillRelationship.target_skill_id == skill_id,
        SkillRelationship.relationship_type == "prerequisite",
    )
    prereq_result = await db.execute(prereq_stmt)
    prerequisites = prereq_result.scalars().all()

    return {
        "id": str(skill.id),
        "name": skill.name,
        "slug": skill.slug,
        "category": skill.category,
        "description": skill.description,
        "difficulty_level": skill.difficulty_level,
        "prerequisites": [str(p.source_skill_id) for p in prerequisites],
    }


@router.get("/career-roles/")
async def list_career_roles(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List available career roles."""
    stmt = select(CareerRole).where(
        CareerRole.tenant_id == current_user.tenant_id,
        CareerRole.is_active == True,
    )
    result = await db.execute(stmt)
    roles = result.scalars().all()

    return {
        "items": [
            {
                "id": str(r.id),
                "name": r.name,
                "slug": r.slug,
                "description": r.description,
                "category": r.category,
            }
            for r in roles
        ]
    }


@router.get("/career-roles/{role_id}/skills")
async def get_role_skills(
    role_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get the required skills for a career role."""
    stmt = (
        select(RoleSkill, Skill)
        .join(Skill, RoleSkill.skill_id == Skill.id)
        .where(RoleSkill.career_role_id == role_id)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return {
        "role_id": str(role_id),
        "skills": [
            {
                "skill_id": str(rs.skill_id),
                "skill_name": skill.name,
                "importance": rs.importance,
                "minimum_mastery": rs.minimum_mastery,
            }
            for rs, skill in rows
        ],
    }
