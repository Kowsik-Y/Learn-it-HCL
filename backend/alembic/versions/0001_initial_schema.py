"""Initial schema - create all tables

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Import all models to ensure they're registered with Base
    from app.database import Base
    import app.generated_models  # noqa: F401
    import app.modules.mastery.models  # noqa: F401

    # Create all tables that don't exist yet
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)

    # Add extra columns from the old migration (safe to run if already exists)
    conn = bind
    # Add teacher_id to courses if not exists
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='courses' AND column_name='teacher_id'"
    ))
    if result.fetchone() is None:
        op.add_column('courses', sa.Column('teacher_id', sa.Text(), nullable=True))

    # Create batch tables if not exist
    inspector = sa.inspect(bind)
    existing = inspector.get_table_names()

    if 'batch_enrollments' not in existing:
        op.create_table('batch_enrollments',
            sa.Column('id', sa.Text(), nullable=False),
            sa.Column('batch_id', sa.Text(), nullable=False),
            sa.Column('student_id', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id', name='batch_enrollments_pkey')
        )

    if 'batches' not in existing:
        op.create_table('batches',
            sa.Column('id', sa.Text(), nullable=False),
            sa.Column('tenant_id', sa.Text(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
            sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id', name='batches_pkey')
        )

    if 'course_batches' not in existing:
        op.create_table('course_batches',
            sa.Column('id', sa.Text(), nullable=False),
            sa.Column('course_id', sa.Text(), nullable=False),
            sa.Column('batch_id', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id', name='course_batches_pkey')
        )


def downgrade() -> None:
    pass  # Not supported for initial schema
