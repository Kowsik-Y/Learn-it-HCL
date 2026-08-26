"""
Assessments Module — Models and Router

Question bank, adaptive diagnostics, quizzes, and exams.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, ForeignKey, Text, Integer, Boolean, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, TenantMixin


class Assessment(Base, TimestampMixin, TenantMixin):
    """An assessment (diagnostic, quiz, exam, practice test)."""

    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment_type: Mapped[str] = mapped_column(String(50), nullable=False, default="quiz")
    skill_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    time_limit_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passing_score: Mapped[float] = mapped_column(Float, default=0.7, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    is_adaptive: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    questions: Mapped[list["Question"]] = relationship(back_populates="assessment")


class Question(Base, TimestampMixin, TenantMixin):
    """A question in the question bank."""

    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(50), nullable=False, default="multiple_choice")
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    skill_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    blooms_level: Mapped[str] = mapped_column(String(50), default="remember", nullable=False)
    estimated_time_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    hints: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    correct_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    options: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    assessment: Mapped["Assessment | None"] = relationship(back_populates="questions")

    __table_args__ = (
        Index("ix_questions_assessment", "assessment_id"),
        Index("ix_questions_difficulty", "tenant_id", "difficulty_level"),
    )


class AssessmentAttempt(Base, TimestampMixin, TenantMixin):
    """A learner's attempt at an assessment."""

    __tablename__ = "assessment_attempts"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False)
    learner_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    percentage: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="in_progress", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    responses: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    __table_args__ = (
        Index("ix_attempts_learner", "learner_id"),
        Index("ix_attempts_assessment", "assessment_id"),
    )
