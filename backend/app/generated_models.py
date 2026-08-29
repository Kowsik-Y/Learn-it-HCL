from typing import Optional
import datetime

from sqlalchemy import Boolean, Date, DateTime, Double, ForeignKeyConstraint, Index, Integer, PrimaryKeyConstraint, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


class AccessRequests(Base):
    __tablename__ = 'access_requests'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='access_requests_pkey'),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'pending'::character varying"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    company: Mapped[Optional[str]] = mapped_column(String(255))


class Assessments(Base):
    __tablename__ = 'assessments'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='assessments_pkey'),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    assessment_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'quiz'::character varying"))
    passing_score: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0.7'))
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('3'))
    is_adaptive: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    question_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('10'))
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    skill_ids: Mapped[Optional[dict]] = mapped_column(JSONB)
    time_limit_minutes: Mapped[Optional[int]] = mapped_column(Integer)

    assessment_attempts: Mapped[list['AssessmentAttempts']] = relationship('AssessmentAttempts', back_populates='assessment')
    questions: Mapped[list['Questions']] = relationship('Questions', back_populates='assessment')


class AttendanceRecords(Base):
    __tablename__ = 'attendance_records'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='attendance_records_pkey'),
        Index('ix_att_rec_session', 'session_id'),
        Index('ix_att_rec_student', 'student_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    session_id: Mapped[str] = mapped_column(Text, nullable=False)
    student_id: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'absent'::character varying"))
    verification_method: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'otp'::character varying"))
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    check_in_time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    device_id: Mapped[Optional[str]] = mapped_column(String(255))


class AttendanceSessions(Base):
    __tablename__ = 'attendance_sessions'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='attendance_sessions_pkey'),
        Index('ix_att_sess_tenant_date', 'tenant_id', 'session_date')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    teacher_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    session_date: Mapped[str] = mapped_column(String(20), nullable=False)
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    end_time: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'scheduled'::character varying"))
    verification_method: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'otp'::character varying"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    course_id: Mapped[Optional[str]] = mapped_column(Text)
    otp_code: Mapped[Optional[str]] = mapped_column(String(10))
    otp_expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    qr_token: Mapped[Optional[str]] = mapped_column(String(255))


class AuditLogs(Base):
    __tablename__ = 'audit_logs'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='audit_logs_pkey'),
        Index('ix_audit_tenant_created', 'tenant_id', 'created_at')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    resource_id: Mapped[Optional[str]] = mapped_column(String(100))
    details: Mapped[Optional[dict]] = mapped_column(JSONB)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))


class Badges(Base):
    __tablename__ = 'badges'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='badges_pkey'),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, server_default=text("'skill'::character varying"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    icon_url: Mapped[Optional[str]] = mapped_column(String(500))
    criteria: Mapped[Optional[dict]] = mapped_column(JSONB)

    learner_badges: Mapped[list['LearnerBadges']] = relationship('LearnerBadges', back_populates='badge')


class CareerRoles(Base):
    __tablename__ = 'career_roles'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='career_roles_pkey'),
        Index('ix_career_roles_tenant_slug', 'tenant_id', 'slug', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, server_default=text("'engineering'::character varying"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)

    role_skills: Mapped[list['RoleSkills']] = relationship('RoleSkills', back_populates='career_role')


class Courses(Base):
    __tablename__ = 'courses'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='courses_pkey'),
        Index('ix_courses_tenant_published', 'tenant_id', 'is_published'),
        Index('ix_courses_tenant_slug', 'tenant_id', 'slug', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    teacher_id: Mapped[Optional[str]] = mapped_column(Text)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty_level: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'beginner'::character varying"))
    estimated_duration_hours: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0'))
    language: Mapped[str] = mapped_column(String(10), nullable=False, server_default=text("'en'::character varying"))
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    is_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    enrollment_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    rating: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0'))
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('1'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    short_description: Mapped[Optional[str]] = mapped_column(String(500))
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500))
    tags: Mapped[Optional[dict]] = mapped_column(JSONB)
    metadata_: Mapped[Optional[dict]] = mapped_column('metadata', JSONB)

    modules: Mapped[list['Modules']] = relationship('Modules', back_populates='course')


class CustomRoles(Base):
    __tablename__ = 'custom_roles'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='custom_roles_pkey'),
        Index('ix_custom_roles_tenant_slug', 'tenant_id', 'slug', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    tenant_id: Mapped[Optional[str]] = mapped_column(Text)
    permissions: Mapped[Optional[dict]] = mapped_column(JSONB)


class LearnerProfiles(Base):
    __tablename__ = 'learner_profiles'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='learner_profiles_pkey'),
        Index('ix_learner_profiles_user', 'user_id'),
        Index('learner_profiles_user_id_key', 'user_id', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[str] = mapped_column(Text, nullable=False)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False, server_default=text("'en'::character varying"))
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'UTC'::character varying"))
    locale: Mapped[str] = mapped_column(String(10), nullable=False, server_default=text("'en-US'::character varying"))
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    age_range: Mapped[Optional[str]] = mapped_column(String(20))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    education: Mapped[Optional[dict]] = mapped_column(JSONB)
    professional_experience: Mapped[Optional[dict]] = mapped_column(JSONB)
    onboarding_data: Mapped[Optional[dict]] = mapped_column(JSONB)

    learner_goals: Mapped[list['LearnerGoals']] = relationship('LearnerGoals', back_populates='learner')
    learner_preferences: Mapped[list['LearnerPreferences']] = relationship('LearnerPreferences', back_populates='learner')


class MasteryStates(Base):
    __tablename__ = 'mastery_states'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='mastery_states_pkey'),
        Index('ix_mastery_learner_skill', 'learner_id', 'skill_id', unique=True),
        Index('ix_mastery_tenant_learner', 'tenant_id', 'learner_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    learner_id: Mapped[str] = mapped_column(Text, nullable=False)
    skill_id: Mapped[str] = mapped_column(Text, nullable=False)
    mastery_score: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0.0'))
    confidence: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0.0'))
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    retention_estimate: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('1.0'))
    difficulty_estimate: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0.5'))
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'not_started'::character varying"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    last_assessed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    last_practiced_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))

    mastery_evidence: Mapped[list['MasteryEvidence']] = relationship('MasteryEvidence', back_populates='mastery_state')


class Organizations(Base):
    __tablename__ = 'organizations'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='organizations_pkey'),
        Index('organizations_slug_idx', 'slug'),
        Index('organizations_slug_key', 'slug', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    tenant_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'standalone'::character varying"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500))
    settings: Mapped[Optional[dict]] = mapped_column(JSONB)

    users: Mapped[list['Users']] = relationship('Users', back_populates='tenant')


class Projects(Base):
    __tablename__ = 'projects'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='projects_pkey'),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    difficulty_level: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'beginner'::character varying"))
    estimated_duration_hours: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('1.0'))
    project_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'mini'::character varying"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    skill_ids: Mapped[Optional[dict]] = mapped_column(JSONB)
    instructions: Mapped[Optional[str]] = mapped_column(Text)
    starter_code: Mapped[Optional[str]] = mapped_column(Text)
    evaluation_criteria: Mapped[Optional[dict]] = mapped_column(JSONB)


class Quests(Base):
    __tablename__ = 'quests'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='quests_pkey'),
        Index('ix_quests_learner', 'learner_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    learner_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    quest_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'daily'::character varying"))
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('50'))
    progress_percentage: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0'))
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    tasks: Mapped[Optional[dict]] = mapped_column(JSONB)
    badge_reward_id: Mapped[Optional[str]] = mapped_column(Text)
    expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))


class Resources(Base):
    __tablename__ = 'resources'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='resources_pkey'),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty_level: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'beginner'::character varying"))
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('10'))
    quality_score: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0.5'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    url: Mapped[Optional[str]] = mapped_column(String(1000))
    content: Mapped[Optional[str]] = mapped_column(Text)
    skill_ids: Mapped[Optional[dict]] = mapped_column(JSONB)


class Skills(Base):
    __tablename__ = 'skills'
    __table_args__ = (
        ForeignKeyConstraint(['parent_skill_id'], ['skills.id'], ondelete='SET NULL', onupdate='CASCADE', name='skills_parent_skill_id_fkey'),
        PrimaryKeyConstraint('id', name='skills_pkey'),
        Index('ix_skills_tenant_category', 'tenant_id', 'category'),
        Index('ix_skills_tenant_slug', 'tenant_id', 'slug', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, server_default=text("'general'::character varying"))
    difficulty_level: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('1'))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    parent_skill_id: Mapped[Optional[str]] = mapped_column(Text)
    metadata_: Mapped[Optional[dict]] = mapped_column('metadata', JSONB)

    parent_skill: Mapped[Optional['Skills']] = relationship('Skills', remote_side=[id], back_populates='parent_skill_reverse')
    parent_skill_reverse: Mapped[list['Skills']] = relationship('Skills', remote_side=[parent_skill_id], back_populates='parent_skill')
    role_skills: Mapped[list['RoleSkills']] = relationship('RoleSkills', back_populates='skill')
    skill_relationships_source_skill: Mapped[list['SkillRelationships']] = relationship('SkillRelationships', foreign_keys='[SkillRelationships.source_skill_id]', back_populates='source_skill')
    skill_relationships_target_skill: Mapped[list['SkillRelationships']] = relationship('SkillRelationships', foreign_keys='[SkillRelationships.target_skill_id]', back_populates='target_skill')


class Streaks(Base):
    __tablename__ = 'streaks'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='streaks_pkey'),
        Index('streaks_learner_id_key', 'learner_id', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    learner_id: Mapped[str] = mapped_column(Text, nullable=False)
    current_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    longest_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    freeze_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('1'))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    last_activity_date: Mapped[Optional[datetime.date]] = mapped_column(Date)


class XpEvents(Base):
    __tablename__ = 'xp_events'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='xp_events_pkey'),
        Index('ix_xp_learner', 'learner_id'),
        Index('ix_xp_tenant_learner', 'tenant_id', 'learner_id'),
        Index('xp_events_idempotency_key_key', 'idempotency_key', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    learner_id: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    source_type: Mapped[str] = mapped_column(String(100), nullable=False)
    source_id: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(255))


class AssessmentAttempts(Base):
    __tablename__ = 'assessment_attempts'
    __table_args__ = (
        ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='RESTRICT', onupdate='CASCADE', name='assessment_attempts_assessment_id_fkey'),
        PrimaryKeyConstraint('id', name='assessment_attempts_pkey'),
        Index('ix_attempts_assessment', 'assessment_id'),
        Index('ix_attempts_learner', 'learner_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    assessment_id: Mapped[str] = mapped_column(Text, nullable=False)
    learner_id: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0'))
    max_score: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0'))
    percentage: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0'))
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'in_progress'::character varying"))
    started_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    responses: Mapped[Optional[dict]] = mapped_column(JSONB)

    assessment: Mapped['Assessments'] = relationship('Assessments', back_populates='assessment_attempts')


class LearnerBadges(Base):
    __tablename__ = 'learner_badges'
    __table_args__ = (
        ForeignKeyConstraint(['badge_id'], ['badges.id'], ondelete='RESTRICT', onupdate='CASCADE', name='learner_badges_badge_id_fkey'),
        PrimaryKeyConstraint('id', name='learner_badges_pkey'),
        Index('ix_learner_badges_learner', 'learner_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    learner_id: Mapped[str] = mapped_column(Text, nullable=False)
    badge_id: Mapped[str] = mapped_column(Text, nullable=False)
    earned_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(500))

    badge: Mapped['Badges'] = relationship('Badges', back_populates='learner_badges')


class LearnerGoals(Base):
    __tablename__ = 'learner_goals'
    __table_args__ = (
        ForeignKeyConstraint(['learner_id'], ['learner_profiles.id'], ondelete='RESTRICT', onupdate='CASCADE', name='learner_goals_learner_id_fkey'),
        PrimaryKeyConstraint('id', name='learner_goals_pkey'),
        Index('ix_learner_goals_learner', 'learner_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    learner_id: Mapped[str] = mapped_column(Text, nullable=False)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'career'::character varying"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    progress_percentage: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    target_role: Mapped[Optional[str]] = mapped_column(String(255))
    target_role_id: Mapped[Optional[str]] = mapped_column(Text)
    time_horizon_weeks: Mapped[Optional[int]] = mapped_column(Integer)
    hours_per_week: Mapped[Optional[int]] = mapped_column(Integer)
    known_skills: Mapped[Optional[dict]] = mapped_column(JSONB)
    unknown_skills: Mapped[Optional[dict]] = mapped_column(JSONB)

    learner: Mapped['LearnerProfiles'] = relationship('LearnerProfiles', back_populates='learner_goals')


class LearnerPreferences(Base):
    __tablename__ = 'learner_preferences'
    __table_args__ = (
        ForeignKeyConstraint(['learner_id'], ['learner_profiles.id'], ondelete='RESTRICT', onupdate='CASCADE', name='learner_preferences_learner_id_fkey'),
        PrimaryKeyConstraint('id', name='learner_preferences_pkey'),
        Index('learner_preferences_learner_id_key', 'learner_id', unique=True)
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    learner_id: Mapped[str] = mapped_column(Text, nullable=False)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    preferred_content_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'mixed'::character varying"))
    preferred_study_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('30'))
    preferred_difficulty: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'adaptive'::character varying"))
    preferred_language: Mapped[str] = mapped_column(String(10), nullable=False, server_default=text("'en'::character varying"))
    learning_style: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'mixed'::character varying"))
    project_oriented: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    mentor_supported: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    available_days: Mapped[Optional[dict]] = mapped_column(JSONB)
    preferred_learning_time: Mapped[Optional[str]] = mapped_column(String(50))

    learner: Mapped['LearnerProfiles'] = relationship('LearnerProfiles', back_populates='learner_preferences')


class MasteryEvidence(Base):
    __tablename__ = 'mastery_evidence'
    __table_args__ = (
        ForeignKeyConstraint(['mastery_state_id'], ['mastery_states.id'], ondelete='RESTRICT', onupdate='CASCADE', name='mastery_evidence_mastery_state_id_fkey'),
        PrimaryKeyConstraint('id', name='mastery_evidence_pkey'),
        Index('ix_evidence_mastery', 'mastery_state_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    mastery_state_id: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[float] = mapped_column(Double(53), nullable=False)
    max_score: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('1.0'))
    weight: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('1.0'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    metadata_: Mapped[Optional[dict]] = mapped_column('metadata', JSONB)

    mastery_state: Mapped['MasteryStates'] = relationship('MasteryStates', back_populates='mastery_evidence')


class Modules(Base):
    __tablename__ = 'modules'
    __table_args__ = (
        ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='RESTRICT', onupdate='CASCADE', name='modules_course_id_fkey'),
        PrimaryKeyConstraint('id', name='modules_pkey'),
        Index('ix_modules_course', 'course_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    course_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)

    course: Mapped['Courses'] = relationship('Courses', back_populates='modules')
    chapters: Mapped[list['Chapters']] = relationship('Chapters', back_populates='module')


class Questions(Base):
    __tablename__ = 'questions'
    __table_args__ = (
        ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='SET NULL', onupdate='CASCADE', name='questions_assessment_id_fkey'),
        PrimaryKeyConstraint('id', name='questions_pkey'),
        Index('ix_questions_assessment', 'assessment_id'),
        Index('ix_questions_difficulty', 'tenant_id', 'difficulty_level')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'multiple_choice'::character varying"))
    difficulty_level: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('1'))
    blooms_level: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'remember'::character varying"))
    estimated_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('60'))
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    assessment_id: Mapped[Optional[str]] = mapped_column(Text)
    skill_ids: Mapped[Optional[dict]] = mapped_column(JSONB)
    explanation: Mapped[Optional[str]] = mapped_column(Text)
    hints: Mapped[Optional[dict]] = mapped_column(JSONB)
    correct_answer: Mapped[Optional[str]] = mapped_column(Text)
    options: Mapped[Optional[dict]] = mapped_column(JSONB)

    assessment: Mapped[Optional['Assessments']] = relationship('Assessments', back_populates='questions')


class RoleSkills(Base):
    __tablename__ = 'role_skills'
    __table_args__ = (
        ForeignKeyConstraint(['career_role_id'], ['career_roles.id'], ondelete='RESTRICT', onupdate='CASCADE', name='role_skills_career_role_id_fkey'),
        ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='RESTRICT', onupdate='CASCADE', name='role_skills_skill_id_fkey'),
        PrimaryKeyConstraint('id', name='role_skills_pkey'),
        Index('ix_roleskills_role', 'career_role_id'),
        Index('ix_roleskills_skill', 'skill_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    career_role_id: Mapped[str] = mapped_column(Text, nullable=False)
    skill_id: Mapped[str] = mapped_column(Text, nullable=False)
    importance: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'important'::character varying"))
    minimum_mastery: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('0.7'))

    career_role: Mapped['CareerRoles'] = relationship('CareerRoles', back_populates='role_skills')
    skill: Mapped['Skills'] = relationship('Skills', back_populates='role_skills')


class SkillRelationships(Base):
    __tablename__ = 'skill_relationships'
    __table_args__ = (
        ForeignKeyConstraint(['source_skill_id'], ['skills.id'], ondelete='RESTRICT', onupdate='CASCADE', name='skill_relationships_source_skill_id_fkey'),
        ForeignKeyConstraint(['target_skill_id'], ['skills.id'], ondelete='RESTRICT', onupdate='CASCADE', name='skill_relationships_target_skill_id_fkey'),
        PrimaryKeyConstraint('id', name='skill_relationships_pkey'),
        Index('ix_skillrel_source', 'source_skill_id'),
        Index('ix_skillrel_target', 'target_skill_id'),
        Index('ix_skillrel_tenant_type', 'tenant_id', 'relationship_type')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    source_skill_id: Mapped[str] = mapped_column(Text, nullable=False)
    target_skill_id: Mapped[str] = mapped_column(Text, nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)
    strength: Mapped[float] = mapped_column(Double(53), nullable=False, server_default=text('1.0'))

    source_skill: Mapped['Skills'] = relationship('Skills', foreign_keys=[source_skill_id], back_populates='skill_relationships_source_skill')
    target_skill: Mapped['Skills'] = relationship('Skills', foreign_keys=[target_skill_id], back_populates='skill_relationships_target_skill')


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        ForeignKeyConstraint(['tenant_id'], ['organizations.id'], ondelete='RESTRICT', onupdate='CASCADE', name='users_tenant_id_fkey'),
        PrimaryKeyConstraint('id', name='users_pkey'),
        Index('ix_users_tenant_email', 'tenant_id', 'email', unique=True),
        Index('ix_users_tenant_role', 'tenant_id', 'role'),
        Index('users_tenant_id_idx', 'tenant_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'student'::character varying"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    last_login_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    metadata_: Mapped[Optional[dict]] = mapped_column('metadata', JSONB)

    tenant: Mapped['Organizations'] = relationship('Organizations', back_populates='users')


class Chapters(Base):
    __tablename__ = 'chapters'
    __table_args__ = (
        ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='RESTRICT', onupdate='CASCADE', name='chapters_module_id_fkey'),
        PrimaryKeyConstraint('id', name='chapters_pkey'),
        Index('ix_chapters_module', 'module_id')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    module_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)

    module: Mapped['Modules'] = relationship('Modules', back_populates='chapters')
    lessons: Mapped[list['Lessons']] = relationship('Lessons', back_populates='chapter')


class Lessons(Base):
    __tablename__ = 'lessons'
    __table_args__ = (
        ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='RESTRICT', onupdate='CASCADE', name='lessons_chapter_id_fkey'),
        PrimaryKeyConstraint('id', name='lessons_pkey'),
        Index('ix_lessons_chapter', 'chapter_id'),
        Index('ix_lessons_content_type', 'tenant_id', 'content_type')
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    chapter_id: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'article'::character varying"))
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('10'))
    difficulty_level: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'beginner'::character varying"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    content_url: Mapped[Optional[str]] = mapped_column(String(1000))
    content_body: Mapped[Optional[str]] = mapped_column(Text)
    learning_objectives: Mapped[Optional[dict]] = mapped_column(JSONB)
    skill_ids: Mapped[Optional[dict]] = mapped_column(JSONB)

    chapter: Mapped['Chapters'] = relationship('Chapters', back_populates='lessons')

class Batches(Base):
    __tablename__ = 'batches'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='batches_pkey'),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    end_date: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))


class BatchEnrollments(Base):
    __tablename__ = 'batch_enrollments'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='batch_enrollments_pkey'),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    batch_id: Mapped[str] = mapped_column(Text, nullable=False)
    student_id: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))


class CourseBatches(Base):
    __tablename__ = 'course_batches'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='course_batches_pkey'),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    course_id: Mapped[str] = mapped_column(Text, nullable=False)
    batch_id: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('CURRENT_TIMESTAMP'))

