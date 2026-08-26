"""Gamification Module — Router for XP, streaks, badges, quests."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.gamification.models import XPEvent, Streak, LearnerBadge, Badge, Quest

router = APIRouter()

LEVELS = [
    {"name": "Novice", "number": 1, "min_xp": 0, "max_xp": 500, "icon": "🌱"},
    {"name": "Explorer", "number": 2, "min_xp": 500, "max_xp": 1500, "icon": "🔍"},
    {"name": "Builder", "number": 3, "min_xp": 1500, "max_xp": 3500, "icon": "🔨"},
    {"name": "Practitioner", "number": 4, "min_xp": 3500, "max_xp": 7000, "icon": "⚡"},
    {"name": "Advanced", "number": 5, "min_xp": 7000, "max_xp": 12000, "icon": "🚀"},
    {"name": "Expert", "number": 6, "min_xp": 12000, "max_xp": 999999, "icon": "👑"},
]


def _get_level(total_xp: int) -> dict:
    for level in LEVELS:
        if level["min_xp"] <= total_xp < level["max_xp"]:
            progress = (total_xp - level["min_xp"]) / (level["max_xp"] - level["min_xp"])
            return {**level, "progress": round(progress, 3)}
    return {**LEVELS[-1], "progress": 1.0}


@router.get("/profile")
async def get_gamification_profile(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get the learner's gamification profile: XP, level, streak, badges."""
    # Total XP
    xp_stmt = select(func.coalesce(func.sum(XPEvent.amount), 0)).where(
        XPEvent.learner_id == current_user.id
    )
    xp_result = await db.execute(xp_stmt)
    total_xp = xp_result.scalar() or 0

    # Streak
    streak_stmt = select(Streak).where(Streak.learner_id == current_user.id)
    streak_result = await db.execute(streak_stmt)
    streak = streak_result.scalar_one_or_none()

    # Badge count
    badge_stmt = select(func.count(LearnerBadge.id)).where(
        LearnerBadge.learner_id == current_user.id
    )
    badge_result = await db.execute(badge_stmt)
    badge_count = badge_result.scalar() or 0

    # Quest count
    quest_stmt = select(func.count(Quest.id)).where(
        Quest.learner_id == current_user.id,
        Quest.is_completed == True,
    )
    quest_result = await db.execute(quest_stmt)
    quests_completed = quest_result.scalar() or 0

    level = _get_level(total_xp)

    return {
        "total_xp": total_xp,
        "level": level,
        "streak": {
            "current": streak.current_count if streak else 0,
            "longest": streak.longest_count if streak else 0,
            "is_active": streak.is_active if streak else False,
            "freeze_available": streak.freeze_count > 0 if streak else False,
        },
        "badges_count": badge_count,
        "quests_completed": quests_completed,
    }


@router.get("/xp-history")
async def get_xp_history(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get recent XP events (ledger)."""
    stmt = (
        select(XPEvent)
        .where(XPEvent.learner_id == current_user.id)
        .order_by(XPEvent.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    events = result.scalars().all()

    return {
        "items": [
            {
                "id": str(e.id),
                "amount": e.amount,
                "reason": e.reason,
                "source_type": e.source_type,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ]
    }


@router.get("/badges")
async def get_badges(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get all badges (earned and available)."""
    # All available badges
    all_badges_stmt = select(Badge).where(Badge.tenant_id == current_user.tenant_id)
    all_result = await db.execute(all_badges_stmt)
    all_badges = all_result.scalars().all()

    # Earned badges
    earned_stmt = select(LearnerBadge.badge_id).where(
        LearnerBadge.learner_id == current_user.id
    )
    earned_result = await db.execute(earned_stmt)
    earned_ids = {str(r) for r in earned_result.scalars().all()}

    return {
        "items": [
            {
                "id": str(b.id),
                "name": b.name,
                "description": b.description,
                "icon_url": b.icon_url,
                "category": b.category,
                "is_earned": str(b.id) in earned_ids,
            }
            for b in all_badges
        ]
    }


@router.get("/quests")
async def get_active_quests(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get active quests for the learner."""
    stmt = select(Quest).where(
        Quest.learner_id == current_user.id,
        Quest.is_completed == False,
    ).order_by(Quest.created_at.desc())
    result = await db.execute(stmt)
    quests = result.scalars().all()

    return {
        "items": [
            {
                "id": str(q.id),
                "title": q.title,
                "description": q.description,
                "quest_type": q.quest_type,
                "tasks": q.tasks,
                "xp_reward": q.xp_reward,
                "progress_percentage": q.progress_percentage,
                "expires_at": q.expires_at.isoformat() if q.expires_at else None,
            }
            for q in quests
        ]
    }
