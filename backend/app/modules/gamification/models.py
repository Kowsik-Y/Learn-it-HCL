"""
Gamification Module — XP ledger, streaks, badges, quests.

Key principle: Every XP award is recorded with a reason.
Never: xp = xp + 20 without recording why.
Anti-gaming: idempotency, rate limits, reward caps.
"""

import uuid
from datetime import datetime, timezone, date
from sqlalchemy import String, Float, ForeignKey, Text, Integer, Boolean, Index, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import select, func

from app.database import Base, TimestampMixin, TenantMixin


class XPEvent(Base, TenantMixin):
    """Immutable XP ledger entry. Every XP event has a reason."""

    __tablename__ = "xp_events"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learner_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    source_type: Mapped[str] = mapped_column(String(100), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_xp_learner", "learner_id"),
        Index("ix_xp_tenant_learner", "tenant_id", "learner_id"),
    )


class Streak(Base, TimestampMixin, TenantMixin):
    """Learner streak tracking."""

    __tablename__ = "streaks"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learner_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False, unique=True)
    current_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    freeze_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Badge(Base, TimestampMixin, TenantMixin):
    """Achievement badge definition."""

    __tablename__ = "badges"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="skill")
    criteria: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class LearnerBadge(Base, TenantMixin):
    """Badges earned by a learner."""

    __tablename__ = "learner_badges"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learner_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    badge_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("badges.id"), nullable=False)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        Index("ix_learner_badges_learner", "learner_id"),
    )


class Quest(Base, TimestampMixin, TenantMixin):
    """A personalized quest/mission for a learner."""

    __tablename__ = "quests"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learner_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quest_type: Mapped[str] = mapped_column(String(50), default="daily", nullable=False)
    tasks: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    xp_reward: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    badge_reward_id: Mapped[uuid.UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_quests_learner", "learner_id"),)
