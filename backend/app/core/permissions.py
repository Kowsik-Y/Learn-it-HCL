"""
Learn-it HCL — RBAC Permission Engine

Role-based access control with tenant isolation.
Every authorization check validates: tenant + user + role + resource + action.
"""

from enum import Enum
from typing import Any


class Permission(str, Enum):
    """Platform permissions. Each role maps to a set of permissions."""

    # ── Identity ──
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"
    USERS_DELETE = "users:delete"
    USERS_IMPERSONATE = "users:impersonate"

    # ── Learner ──
    LEARNER_PROFILE_READ = "learner_profile:read"
    LEARNER_PROFILE_WRITE = "learner_profile:write"
    LEARNER_GOALS_WRITE = "learner_goals:write"

    # ── Skills ──
    SKILLS_READ = "skills:read"
    SKILLS_WRITE = "skills:write"

    # ── Content ──
    CONTENT_READ = "content:read"
    CONTENT_WRITE = "content:write"
    CONTENT_PUBLISH = "content:publish"
    CONTENT_DELETE = "content:delete"

    # ── Courses ──
    COURSES_READ = "courses:read"
    COURSES_WRITE = "courses:write"
    COURSES_ENROLL = "courses:enroll"

    # ── Assessments ──
    ASSESSMENTS_READ = "assessments:read"
    ASSESSMENTS_WRITE = "assessments:write"
    ASSESSMENTS_GRADE = "assessments:grade"
    ASSESSMENTS_TAKE = "assessments:take"

    # ── Mastery ──
    MASTERY_READ = "mastery:read"
    MASTERY_WRITE = "mastery:write"

    # ── Recommendations ──
    RECOMMENDATIONS_READ = "recommendations:read"

    # ── Learning Paths ──
    LEARNING_PATHS_READ = "learning_paths:read"
    LEARNING_PATHS_WRITE = "learning_paths:write"

    # ── Gamification ──
    GAMIFICATION_READ = "gamification:read"
    GAMIFICATION_WRITE = "gamification:write"
    GAMIFICATION_AWARD = "gamification:award"

    # ── AI ──
    AI_TUTOR = "ai:tutor"
    AI_ADMIN = "ai:admin"

    # ── Attendance ──
    ATTENDANCE_READ = "attendance:read"
    ATTENDANCE_WRITE = "attendance:write"
    ATTENDANCE_MANAGE = "attendance:manage"

    # ── Analytics ──
    ANALYTICS_READ = "analytics:read"
    ANALYTICS_ADMIN = "analytics:admin"

    # ── Administration ──
    ADMIN_READ = "admin:read"
    ADMIN_WRITE = "admin:write"
    ADMIN_TENANT = "admin:tenant"
    ADMIN_SYSTEM = "admin:system"
    ADMIN_FEATURE_FLAGS = "admin:feature_flags"
    ADMIN_AUDIT = "admin:audit"

    # ── Mentoring ──
    MENTORING_READ = "mentoring:read"
    MENTORING_WRITE = "mentoring:write"


# ── Role → Permission Mapping ────────────────────────────────

ROLE_PERMISSIONS: dict[str, set[Permission]] = {
    "super_admin": set(Permission),  # All permissions
    "admin": {
        Permission.USERS_READ,
        Permission.USERS_WRITE,
        Permission.SKILLS_READ,
        Permission.SKILLS_WRITE,
        Permission.CONTENT_READ,
        Permission.CONTENT_WRITE,
        Permission.CONTENT_PUBLISH,
        Permission.CONTENT_DELETE,
        Permission.COURSES_READ,
        Permission.COURSES_WRITE,
        Permission.COURSES_ENROLL,
        Permission.ASSESSMENTS_READ,
        Permission.ASSESSMENTS_WRITE,
        Permission.ASSESSMENTS_GRADE,
        Permission.MASTERY_READ,
        Permission.MASTERY_WRITE,
        Permission.RECOMMENDATIONS_READ,
        Permission.LEARNING_PATHS_READ,
        Permission.LEARNING_PATHS_WRITE,
        Permission.GAMIFICATION_READ,
        Permission.GAMIFICATION_WRITE,
        Permission.GAMIFICATION_AWARD,
        Permission.AI_ADMIN,
        Permission.ATTENDANCE_READ,
        Permission.ATTENDANCE_WRITE,
        Permission.ATTENDANCE_MANAGE,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_ADMIN,
        Permission.ADMIN_READ,
        Permission.ADMIN_WRITE,
        Permission.ADMIN_FEATURE_FLAGS,
        Permission.ADMIN_AUDIT,
        Permission.MENTORING_READ,
        Permission.MENTORING_WRITE,
    },
    "teacher": {
        Permission.CONTENT_READ,
        Permission.CONTENT_WRITE,
        Permission.CONTENT_PUBLISH,
        Permission.COURSES_READ,
        Permission.COURSES_WRITE,
        Permission.ASSESSMENTS_READ,
        Permission.ASSESSMENTS_WRITE,
        Permission.ASSESSMENTS_GRADE,
        Permission.MASTERY_READ,
        Permission.RECOMMENDATIONS_READ,
        Permission.LEARNING_PATHS_READ,
        Permission.GAMIFICATION_READ,
        Permission.GAMIFICATION_AWARD,
        Permission.ATTENDANCE_READ,
        Permission.ATTENDANCE_WRITE,
        Permission.ATTENDANCE_MANAGE,
        Permission.ANALYTICS_READ,
        Permission.MENTORING_READ,
    },
    "mentor": {
        Permission.LEARNER_PROFILE_READ,
        Permission.SKILLS_READ,
        Permission.CONTENT_READ,
        Permission.COURSES_READ,
        Permission.MASTERY_READ,
        Permission.RECOMMENDATIONS_READ,
        Permission.LEARNING_PATHS_READ,
        Permission.GAMIFICATION_READ,
        Permission.GAMIFICATION_AWARD,
        Permission.ATTENDANCE_READ,
        Permission.ANALYTICS_READ,
        Permission.MENTORING_READ,
        Permission.MENTORING_WRITE,
    },
    "student": {
        Permission.LEARNER_PROFILE_READ,
        Permission.LEARNER_PROFILE_WRITE,
        Permission.LEARNER_GOALS_WRITE,
        Permission.SKILLS_READ,
        Permission.CONTENT_READ,
        Permission.COURSES_READ,
        Permission.COURSES_ENROLL,
        Permission.ASSESSMENTS_READ,
        Permission.ASSESSMENTS_TAKE,
        Permission.MASTERY_READ,
        Permission.RECOMMENDATIONS_READ,
        Permission.LEARNING_PATHS_READ,
        Permission.GAMIFICATION_READ,
        Permission.AI_TUTOR,
        Permission.ATTENDANCE_READ,
        Permission.ATTENDANCE_WRITE,
        Permission.ANALYTICS_READ,
    },
}


def has_permission(role: str, permission: Permission) -> bool:
    """Check if a role has a specific permission."""
    role_perms = ROLE_PERMISSIONS.get(role, set())
    return permission in role_perms


def get_permissions_for_role(role: str) -> set[Permission]:
    """Get all permissions for a role."""
    return ROLE_PERMISSIONS.get(role, set())
