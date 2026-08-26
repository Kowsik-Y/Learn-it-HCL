"""Administration Module — Admin controls, feature flags, audit logs, user management."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser, require_role
from app.modules.identity.models import User, Organization

router = APIRouter()


@router.get("/users")
async def list_users(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List users (admin only)."""
    if current_user.role not in ("admin", "super_admin"):
        from app.core.errors import AuthorizationError
        raise AuthorizationError()

    stmt = select(User).where(User.tenant_id == current_user.tenant_id).limit(100)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ]
    }


@router.get("/stats")
async def get_admin_stats(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get admin dashboard statistics."""
    if current_user.role not in ("admin", "super_admin"):
        from app.core.errors import AuthorizationError
        raise AuthorizationError()

    user_count = await db.execute(
        select(func.count(User.id)).where(User.tenant_id == current_user.tenant_id)
    )
    total_users = user_count.scalar() or 0

    return {
        "total_users": total_users,
        "active_users": total_users,
        "total_courses": 0,
        "total_assessments": 0,
    }


@router.get("/feature-flags")
async def get_feature_flags(current_user: CurrentUser):
    """Get current feature flag states."""
    if current_user.role not in ("admin", "super_admin"):
        from app.core.errors import AuthorizationError
        raise AuthorizationError()

    from app.config import get_settings
    settings = get_settings()

    return {
        "flags": {
            "ai_tutor": settings.ff_ai_tutor,
            "gamification": settings.ff_gamification,
            "adaptive_diagnostics": settings.ff_adaptive_diagnostics,
            "career_path_mode": settings.ff_career_path_mode,
            "attendance": settings.ff_attendance,
            "short_video_mode": settings.ff_short_video_mode,
        }
    }
