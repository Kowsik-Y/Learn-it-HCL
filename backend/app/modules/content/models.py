"""
Content Module — Models

Courses, modules, chapters, lessons, resources, projects.
Full course hierarchy with skill mapping and metadata.
"""

import uuid
from sqlalchemy import String, Float, ForeignKey, Text, Integer, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.database import Base, TimestampMixin, TenantMixin


class Course(Base, TimestampMixin, TenantMixin):
    """Top-level course container."""

    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    difficulty_level: Mapped[str] = mapped_column(String(50), default="beginner", nullable=False)
    estimated_duration_hours: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_free: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enrollment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

    modules: Mapped[list["Module"]] = relationship(back_populates="course", order_by="Module.order_index")

    __table_args__ = (
        Index("ix_courses_tenant_slug", "tenant_id", "slug", unique=True),
        Index("ix_courses_tenant_published", "tenant_id", "is_published"),
    )


class Module(Base, TimestampMixin, TenantMixin):
    """A module within a course."""

    __tablename__ = "modules"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    course: Mapped["Course"] = relationship(back_populates="modules")
    chapters: Mapped[list["Chapter"]] = relationship(back_populates="module", order_by="Chapter.order_index")

    __table_args__ = (Index("ix_modules_course", "course_id"),)


class Chapter(Base, TimestampMixin, TenantMixin):
    """A chapter within a module."""

    __tablename__ = "chapters"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    module: Mapped["Module"] = relationship(back_populates="chapters")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="chapter", order_by="Lesson.order_index")

    __table_args__ = (Index("ix_chapters_module", "module_id"),)


class Lesson(Base, TimestampMixin, TenantMixin):
    """A single lesson/learning activity."""

    __tablename__ = "lessons"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("chapters.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_type: Mapped[str] = mapped_column(String(50), nullable=False, default="article")
    content_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    content_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    difficulty_level: Mapped[str] = mapped_column(String(50), default="beginner", nullable=False)
    learning_objectives: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    skill_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    embedding: Mapped[list | None] = mapped_column(Vector(1536), nullable=True)

    chapter: Mapped["Chapter"] = relationship(back_populates="lessons")

    __table_args__ = (
        Index("ix_lessons_chapter", "chapter_id"),
        Index("ix_lessons_content_type", "tenant_id", "content_type"),
    )


class Resource(Base, TimestampMixin, TenantMixin):
    """A supplementary learning resource."""

    __tablename__ = "resources"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    skill_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    difficulty_level: Mapped[str] = mapped_column(String(50), default="beginner", nullable=False)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    embedding: Mapped[list | None] = mapped_column(Vector(1536), nullable=True)


class Project(Base, TimestampMixin, TenantMixin):
    """A practical project for skill demonstration."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty_level: Mapped[str] = mapped_column(String(50), default="beginner", nullable=False)
    skill_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    estimated_duration_hours: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    project_type: Mapped[str] = mapped_column(String(50), default="mini", nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    starter_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    evaluation_criteria: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
