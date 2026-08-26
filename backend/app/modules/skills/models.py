"""
Skills Module — Models

Skill graph with ontology, prerequisite relationships, career roles.
"""

import uuid
from sqlalchemy import String, Float, ForeignKey, Text, Integer, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, TenantMixin


class Skill(Base, TimestampMixin, TenantMixin):
    """A skill node in the knowledge graph."""

    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="general")
    parent_skill_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("skills.id"), nullable=True
    )
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

    # Relationships
    children: Mapped[list["Skill"]] = relationship("Skill", back_populates="parent")
    parent: Mapped["Skill | None"] = relationship("Skill", back_populates="children", remote_side="Skill.id")

    __table_args__ = (
        Index("ix_skills_tenant_slug", "tenant_id", "slug", unique=True),
        Index("ix_skills_tenant_category", "tenant_id", "category"),
    )


class SkillRelationship(Base, TenantMixin):
    """Directed relationship between skills (prerequisite, related, builds_on)."""

    __tablename__ = "skill_relationships"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_skill_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False
    )
    target_skill_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False
    )
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)
    strength: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    __table_args__ = (
        Index("ix_skillrel_source", "source_skill_id"),
        Index("ix_skillrel_target", "target_skill_id"),
        Index("ix_skillrel_tenant_type", "tenant_id", "relationship_type"),
    )


class CareerRole(Base, TimestampMixin, TenantMixin):
    """A career role with required skills."""

    __tablename__ = "career_roles"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="engineering")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_career_roles_tenant_slug", "tenant_id", "slug", unique=True),
    )


class RoleSkill(Base, TenantMixin):
    """Maps a career role to its required skills."""

    __tablename__ = "role_skills"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    career_role_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("career_roles.id"), nullable=False
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False
    )
    importance: Mapped[str] = mapped_column(String(50), default="important", nullable=False)
    minimum_mastery: Mapped[float] = mapped_column(Float, default=0.7, nullable=False)

    __table_args__ = (
        Index("ix_roleskills_role", "career_role_id"),
        Index("ix_roleskills_skill", "skill_id"),
    )
