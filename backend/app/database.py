"""
Learn-it HCL — Database Configuration

SQLAlchemy async engine, session factory, and base model.
Supports PostgreSQL (production) and SQLite (demo/hackathon).
"""

import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from sqlalchemy import MetaData, DateTime, String, Boolean, text, event
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
)

from app.config import get_settings

settings = get_settings()

# Naming convention for constraints (makes migrations predictable)
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)

is_sqlite = settings.database_url.startswith("sqlite")


def UUIDType() -> postgresql.UUID | String:
    """Return the appropriate UUID column type for the current database.

    - PostgreSQL: native UUID type, so asyncpg sends correct wire type.
    - SQLite:     String(36) fallback (stores as text).
    """
    if is_sqlite:
        return String(36)
    return postgresql.UUID(as_uuid=False)


engine_kwargs: dict = {}
if is_sqlite:
    engine_kwargs = {
        "echo": settings.app_debug,
        "connect_args": {"check_same_thread": False},
    }
else:
    engine_kwargs = {
        "pool_size": settings.db_pool_size,
        "max_overflow": settings.db_max_overflow,
        "pool_recycle": settings.db_pool_recycle,
        "echo": settings.app_debug,
    }

engine = create_async_engine(settings.database_url, **engine_kwargs)

# Enable WAL mode and foreign keys for SQLite
if is_sqlite:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    metadata = metadata


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class TenantMixin:
    """Mixin that adds tenant_id for row-level multi-tenancy."""

    tenant_id: Mapped[str] = mapped_column(
        UUIDType(),
        nullable=False,
        index=True,
    )


class SoftDeleteMixin:
    """Mixin for soft delete support."""

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
