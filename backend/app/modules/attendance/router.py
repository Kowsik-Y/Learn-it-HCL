"""Attendance Module — OTP, QR, policies, check-in/out, leave management."""

import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, String, Integer, Float, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, TenantMixin, get_db
from app.modules.identity.dependencies import CurrentUser

# ── Models ────────────────────────────────────────────────

class AttendanceSession(Base, TimestampMixin, TenantMixin):
    __tablename__ = "attendance_sessions"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    teacher_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    session_date: Mapped[str] = mapped_column(String(20), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="scheduled", nullable=False)
    verification_method: Mapped[str] = mapped_column(String(50), default="otp", nullable=False)
    otp_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    qr_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    __table_args__ = (Index("ix_att_sess_tenant_date", "tenant_id", "session_date"),)


class AttendanceRecord(Base, TimestampMixin, TenantMixin):
    __tablename__ = "attendance_records"
    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="absent", nullable=False)
    check_in_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_method: Mapped[str] = mapped_column(String(50), nullable=False, default="otp")
    device_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    __table_args__ = (
        Index("ix_att_rec_session", "session_id"),
        Index("ix_att_rec_student", "student_id"),
    )


# ── Router ────────────────────────────────────────────────

router = APIRouter()


class CheckInRequest(BaseModel):
    session_id: str
    otp_code: Optional[str] = None
    qr_token: Optional[str] = None


@router.post("/check-in")
async def check_in(
    data: CheckInRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Check in to an attendance session via OTP or QR."""
    session_id = uuid.UUID(data.session_id)

    # Get session
    stmt = select(AttendanceSession).where(
        AttendanceSession.id == session_id,
        AttendanceSession.tenant_id == current_user.tenant_id,
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()

    if not session:
        from app.core.errors import NotFoundError
        raise NotFoundError("AttendanceSession", data.session_id)

    if session.status != "open":
        from app.core.errors import ValidationError
        raise ValidationError("Attendance session is not open")

    # Verify OTP
    now = datetime.now(timezone.utc)
    if data.otp_code:
        if session.otp_code != data.otp_code:
            from app.core.errors import ValidationError
            raise ValidationError("Invalid OTP code")
        if session.otp_expires_at and now > session.otp_expires_at:
            from app.core.errors import ValidationError
            raise ValidationError("OTP has expired")

    # Determine status (present vs late)
    grace_minutes = 10
    is_late = now > session.start_time + timedelta(minutes=grace_minutes)
    status = "late" if is_late else "present"

    # Create attendance record
    record = AttendanceRecord(
        session_id=session_id,
        student_id=current_user.id,
        tenant_id=current_user.tenant_id,
        status=status,
        check_in_time=now,
        verification_method="otp" if data.otp_code else "qr",
        is_verified=True,
    )
    db.add(record)
    await db.flush()

    return {
        "status": status,
        "check_in_time": now.isoformat(),
        "session_title": session.title,
        "xp_earned": 15 if status == "present" else 10,
    }


@router.post("/sessions/{session_id}/generate-otp")
async def generate_otp(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Generate OTP for an attendance session (teacher only)."""
    stmt = select(AttendanceSession).where(
        AttendanceSession.id == session_id,
        AttendanceSession.teacher_id == current_user.id,
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()

    if not session:
        from app.core.errors import NotFoundError
        raise NotFoundError("AttendanceSession")

    # Generate secure 6-digit OTP
    otp = f"{secrets.randbelow(900000) + 100000}"
    session.otp_code = otp
    session.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    session.status = "open"
    await db.flush()

    return {
        "otp_code": otp,
        "expires_at": session.otp_expires_at.isoformat(),
        "session_id": str(session_id),
    }


@router.get("/history")
async def get_attendance_history(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get attendance history for the current learner."""
    stmt = (
        select(AttendanceRecord)
        .where(AttendanceRecord.student_id == current_user.id)
        .order_by(AttendanceRecord.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    return {
        "items": [
            {
                "id": str(r.id),
                "session_id": str(r.session_id),
                "status": r.status,
                "check_in_time": r.check_in_time.isoformat() if r.check_in_time else None,
                "verification_method": r.verification_method,
                "is_verified": r.is_verified,
            }
            for r in records
        ]
    }
