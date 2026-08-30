"""
Learn-it HCL — Security & RBAC Utilities

Provides request-scoped user identity extraction and role-based
access control dependencies for FastAPI route handlers.
"""

from typing import Callable

from fastapi import Depends, Request

from app.core.errors import AuthenticationError, AuthorizationError


def get_current_user_id(request: Request) -> str:
    """Extract user_id from request state (set by GatewayAuthMiddleware)."""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise AuthenticationError("User identity not available — missing X-User-Id header.")
    return user_id


def get_current_tenant_id(request: Request) -> str:
    """Extract tenant_id from request state (set by GatewayAuthMiddleware)."""
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise AuthenticationError("Tenant identity not available — missing X-Tenant-Id header.")
    return tenant_id


def get_user_role(request: Request) -> str:
    """Extract user role from gateway-forwarded header."""
    role = request.headers.get("X-User-Role", "student")
    return role


def require_role(*allowed_roles: str) -> Callable:
    """
    FastAPI dependency that enforces role-based access control.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role("admin", "super_admin"))])
        async def admin_endpoint():
            ...
    """
    async def _check_role(request: Request) -> str:
        role = get_user_role(request)
        if role not in allowed_roles:
            raise AuthorizationError(
                f"Role '{role}' is not permitted. Required: {', '.join(allowed_roles)}."
            )
        return role

    return _check_role
