"""
Identity Module — FastAPI Dependencies

Authentication and authorization dependencies for route protection.
"""

import uuid
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthenticationError, AuthorizationError, TenantAccessError
from app.core.permissions import Permission, has_permission
from app.core.security import decode_token
from app.database import get_db
from app.modules.identity.models import User
from app.modules.identity.service import IdentityService


security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security_scheme)
    ] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from the JWT token."""
    if not credentials:
        raise AuthenticationError("Authentication required")

    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise AuthenticationError("Invalid or expired token")

    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload")

    service = IdentityService(db)
    user = await service.get_user_by_id(uuid.UUID(user_id))

    if not user.is_active:
        raise AuthenticationError("Account is deactivated")

    # Set tenant context on request state
    request.state.tenant_id = user.tenant_id
    request.state.user_id = user.id
    request.state.user_role = user.role

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: str):
    """Dependency factory that requires the user to have one of the specified roles."""

    async def _check_role(user: CurrentUser) -> User:
        if user.role not in roles:
            raise AuthorizationError(
                f"Role '{user.role}' is not authorized. Required: {', '.join(roles)}"
            )
        return user

    return Depends(_check_role)


def require_permission(permission: Permission):
    """Dependency factory that requires the user to have a specific permission."""

    async def _check_permission(user: CurrentUser) -> User:
        if not has_permission(user.role, permission):
            raise AuthorizationError(f"Missing permission: {permission.value}")
        return user

    return Depends(_check_permission)


def require_tenant_access(resource_tenant_id: uuid.UUID):
    """Verify the current user has access to a specific tenant's resource."""

    async def _check_tenant(user: CurrentUser) -> User:
        if user.role != "super_admin" and user.tenant_id != resource_tenant_id:
            raise TenantAccessError()
        return user

    return Depends(_check_tenant)
