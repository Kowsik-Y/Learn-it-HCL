"""Analytics Module — Dashboard data aggregation for the frontend."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.identity.models import User
from app.modules.learners.models import LearnerProfile, LearnerGoal
from app.modules.mastery.models import MasteryState
from app.modules.skills.models import Skill
from app.modules.gamification.models import XPEvent, Streak, Quest, LearnerBadge

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_data(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Get full dashboard analytics data for the current learner."""

    user_id = current_user.id
    tenant_id = current_user.tenant_id

    # ── Gamification profile ──
    xp_stmt = select(func.coalesce(func.sum(XPEvent.amount), 0)).where(
        XPEvent.learner_id == user_id
    )
    xp_result = await db.execute(xp_stmt)
    total_xp = xp_result.scalar() or 0

    streak_stmt = select(Streak).where(Streak.learner_id == user_id)
    streak_result = await db.execute(streak_stmt)
    streak = streak_result.scalar_one_or_none()

    # Level calculation
    levels = [
        {"name": "Novice", "number": 1, "min_xp": 0, "max_xp": 500},
        {"name": "Explorer", "number": 2, "min_xp": 500, "max_xp": 1500},
        {"name": "Builder", "number": 3, "min_xp": 1500, "max_xp": 3500},
        {"name": "Practitioner", "number": 4, "min_xp": 3500, "max_xp": 7000},
        {"name": "Advanced", "number": 5, "min_xp": 7000, "max_xp": 12000},
        {"name": "Expert", "number": 6, "min_xp": 12000, "max_xp": 999999},
    ]
    current_level = levels[0]
    for level in levels:
        if level["min_xp"] <= total_xp < level["max_xp"]:
            current_level = level
            break

    gamification = {
        "current_xp": total_xp,
        "next_level_xp": current_level["max_xp"],
        "level": current_level["number"],
        "level_name": current_level["name"],
        "streak_days": streak.current_count if streak else 0,
    }

    # ── Learner info ──
    learner = {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url or "",
        "role": current_user.role,
    }

    # ── Goals ──
    profile_stmt = select(LearnerProfile).where(LearnerProfile.user_id == user_id)
    profile_result = await db.execute(profile_stmt)
    profile = profile_result.scalar_one_or_none()

    goals = []
    if profile:
        goals_stmt = select(LearnerGoal).where(
            LearnerGoal.learner_id == profile.id,
            LearnerGoal.is_active == True,
        )
        goals_result = await db.execute(goals_stmt)
        goals = [
            {
                "id": str(g.id),
                "title": g.title,
                "goal_type": g.goal_type,
                "target_role": g.target_role,
                "progress_percentage": g.progress_percentage,
            }
            for g in goals_result.scalars().all()
        ]

    # ── Mastery summary (with skill names) ──
    mastery_stmt = select(MasteryState).where(
        MasteryState.learner_id == user_id,
        MasteryState.tenant_id == tenant_id,
    )
    mastery_result = await db.execute(mastery_stmt)
    mastery_states = mastery_result.scalars().all()

    # Get skill names
    skill_id_list = [m.skill_id for m in mastery_states]
    skill_name_map = {}
    if skill_id_list:
        skill_stmt = select(Skill).where(Skill.id.in_(skill_id_list))
        skill_result = await db.execute(skill_stmt)
        for s in skill_result.scalars().all():
            skill_name_map[str(s.id)] = s.name

    mastery_summary = [
        {
            "skill_id": str(m.skill_id),
            "skill_name": skill_name_map.get(str(m.skill_id), "Unknown"),
            "score": m.mastery_score,
            "confidence": m.confidence,
            "status": m.status,
        }
        for m in mastery_states
    ]
    # Sort by score descending
    mastery_summary.sort(key=lambda x: x["score"], reverse=True)

    # ── Daily mission (simple version from recommendations) ──
    daily_mission = {
        "activities": [
            {
                "title": "Practice: Data Structures",
                "type": "lesson",
                "explanation": "Your mastery is at 55% — 3 more practice sessions to reach 70%.",
            },
            {
                "title": "Review: REST API Basics",
                "type": "review",
                "explanation": "It's been 3 days since you last studied REST APIs. A quick review will reinforce retention.",
            },
            {
                "title": "Quiz: SQL Fundamentals",
                "type": "challenge",
                "explanation": "Test your SQL knowledge — scoring above 60% will unlock the FastAPI module.",
            },
        ]
    }

    # ── Active Quests ──
    quests_stmt = select(Quest).where(
        Quest.learner_id == user_id,
        Quest.is_completed == False,
    ).order_by(Quest.created_at.desc())
    quests_result = await db.execute(quests_stmt)
    active_quests = [
        {
            "id": str(q.id),
            "title": q.title,
            "description": q.description,
            "reward_xp": q.xp_reward,
            "progress": q.progress_percentage,
            "target": 100,
        }
        for q in quests_result.scalars().all()
    ]

    # ── Recent XP ──
    xp_history_stmt = (
        select(XPEvent)
        .where(XPEvent.learner_id == user_id)
        .order_by(XPEvent.created_at.desc())
        .limit(20)
    )
    xp_history_result = await db.execute(xp_history_stmt)
    recent_xp = [
        {
            "id": str(e.id),
            "amount": e.amount,
            "reason": e.reason,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in xp_history_result.scalars().all()
    ]

    return {
        "gamification": gamification,
        "learner": learner,
        "goals": goals,
        "mastery_summary": mastery_summary,
        "daily_mission": daily_mission,
        "active_quests": active_quests,
        "recent_xp": recent_xp,
    }


@router.get("/learner-summary")
async def get_learner_summary(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Get summary analytics for the current learner."""
    user_id = current_user.id

    # XP total
    xp_stmt = select(func.coalesce(func.sum(XPEvent.amount), 0)).where(
        XPEvent.learner_id == user_id
    )
    xp_result = await db.execute(xp_stmt)
    total_xp = xp_result.scalar() or 0

    # Mastery count
    mastery_stmt = select(func.count(MasteryState.id)).where(
        MasteryState.learner_id == user_id
    )
    mastery_result = await db.execute(mastery_stmt)
    skills_practiced = mastery_result.scalar() or 0

    streak_stmt = select(Streak).where(Streak.learner_id == user_id)
    streak_result = await db.execute(streak_stmt)
    streak = streak_result.scalar_one_or_none()

    return {
        "total_xp": total_xp,
        "total_learning_minutes": total_xp * 2,  # rough estimate
        "lessons_completed": max(0, total_xp // 25),
        "quizzes_taken": max(0, total_xp // 50),
        "skills_practiced": skills_practiced,
        "current_streak": streak.current_count if streak else 0,
    }
