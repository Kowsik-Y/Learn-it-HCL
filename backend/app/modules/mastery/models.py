"""
Mastery Module — Knowledge State Models

Evidence-based mastery tracking. Mastery is NOT completion-based.
Combines: assessment performance, retrieval success, recency, difficulty, consistency.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, ForeignKey, Integer, DateTime, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, TenantMixin, UUIDType


class MasteryState(Base, TimestampMixin, TenantMixin):
    """Current mastery estimate for a learner × skill pair."""

    __tablename__ = "mastery_states"

    id: Mapped[str] = mapped_column(UUIDType(), primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id: Mapped[str] = mapped_column(UUIDType(), nullable=False)
    skill_id: Mapped[str] = mapped_column(UUIDType(), nullable=False)
    mastery_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    evidence_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_assessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_practiced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retention_estimate: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    difficulty_estimate: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="not_started", nullable=False)

    __table_args__ = (
        Index("ix_mastery_learner_skill", "learner_id", "skill_id", unique=True),
        Index("ix_mastery_tenant_learner", "tenant_id", "learner_id"),
    )


class MasteryEvidence(Base, TenantMixin):
    """Individual evidence events that contribute to mastery estimation."""

    __tablename__ = "mastery_evidence"

    id: Mapped[str] = mapped_column(UUIDType(), primary_key=True, default=lambda: str(uuid.uuid4()))
    mastery_state_id: Mapped[str] = mapped_column(UUIDType(), ForeignKey("mastery_states.id"), nullable=False)
    evidence_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[str] = mapped_column(UUIDType(), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (Index("ix_evidence_mastery", "mastery_state_id"),)
