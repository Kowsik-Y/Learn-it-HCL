"""
Learner Module — Models

Rich learner profiles, preferences, goals, and behavioral signals.
Compatible with SQLite and PostgreSQL.
"""

import uuid
from sqlalchemy import String, Float, ForeignKey, Text, Integer, Boolean, Index, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, TenantMixin


class LearnerProfile(Base, TimestampMixin, TenantMixin):
    """Extended learner profile beyond basic user info."""

    __tablename__ = "learner_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    age_range: Mapped[str | None] = mapped_column(String(20), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    locale: Mapped[str] = mapped_column(String(10), default="en-US", nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    education: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    professional_experience: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    onboarding_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (Index("ix_learner_profiles_user", "user_id"),)


class LearnerPreferences(Base, TimestampMixin, TenantMixin):
    """Learning preferences — content type, study duration, schedule, etc."""

    __tablename__ = "learner_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id: Mapped[str] = mapped_column(String(36), ForeignKey("learner_profiles.id"), nullable=False, unique=True)
    preferred_content_type: Mapped[str] = mapped_column(String(50), default="mixed", nullable=False)
    preferred_study_duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    available_days: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    preferred_difficulty: Mapped[str] = mapped_column(String(50), default="adaptive", nullable=False)
    preferred_learning_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    learning_style: Mapped[str] = mapped_column(String(50), default="mixed", nullable=False)
    project_oriented: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    mentor_supported: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class LearnerGoal(Base, TimestampMixin, TenantMixin):
    """A learner's learning/career goal."""

    __tablename__ = "learner_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id: Mapped[str] = mapped_column(String(36), ForeignKey("learner_profiles.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False, default="career")
    target_role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_role_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    time_horizon_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hours_per_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    known_skills: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    unknown_skills: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    __table_args__ = (Index("ix_learner_goals_learner", "learner_id"),)
