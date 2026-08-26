"""
Identity Module — Service Layer

Business logic for user registration, authentication, and profile management.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthenticationError, ConflictError, NotFoundError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.permissions import get_permissions_for_role
from app.config import get_settings
from app.modules.identity.models import Organization, User
from app.modules.identity.schemas import (
    AuthTokensResponse,
    LoginRequest,
    RegisterRequest,
    UserProfileResponse,
    UserResponse,
    OrganizationResponse,
)

settings = get_settings()


class IdentityService:
    """Handles user registration, authentication, and profile management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> tuple[UserResponse, AuthTokensResponse]:
        """Register a new user. Creates a default organization if needed."""
        # Check if email already exists in any tenant
        stmt = select(User).where(User.email == data.email)
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            raise ConflictError("An account with this email already exists")

        # Create or get organization
        org = await self._get_or_create_organization(data.organization_name)

        # Create user
        user = User(
            id=uuid.uuid4(),
            tenant_id=org.id,
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        await self.db.flush()

        # Generate tokens
        tokens = self._create_tokens(user)

        return UserResponse.model_validate(user), tokens

    async def login(self, data: LoginRequest) -> tuple[UserResponse, AuthTokensResponse]:
        """Authenticate a user and return tokens."""
        stmt = select(User).where(User.email == data.email)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("Account is deactivated")

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        tokens = self._create_tokens(user)

        return UserResponse.model_validate(user), tokens

    async def refresh_tokens(self, refresh_token: str) -> AuthTokensResponse:
        """Refresh access token using a valid refresh token."""
        try:
            payload = decode_token(refresh_token)
        except ValueError:
            raise AuthenticationError("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload")

        stmt = select(User).where(User.id == uuid.UUID(user_id))
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")

        return self._create_tokens(user)

    async def get_profile(self, user_id: uuid.UUID) -> UserProfileResponse:
        """Get full user profile with permissions and organization."""
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise NotFoundError("User", str(user_id))

        permissions = [p.value for p in get_permissions_for_role(user.role)]

        # Get organization
        org_stmt = select(Organization).where(Organization.id == user.tenant_id)
        org_result = await self.db.execute(org_stmt)
        org = org_result.scalar_one_or_none()

        return UserProfileResponse(
            user=UserResponse.model_validate(user),
            permissions=permissions,
            organization=OrganizationResponse.model_validate(org) if org else None,
        )

    async def get_user_by_id(
        self, user_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> User:
        """Get a user by ID with optional tenant validation."""
        stmt = select(User).where(User.id == user_id)
        if tenant_id:
            stmt = stmt.where(User.tenant_id == tenant_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User", str(user_id))
        return user

    async def _get_or_create_organization(self, name: str | None) -> Organization:
        """Get or create an organization for the user."""
        org_name = name or "Default Organization"
        slug = org_name.lower().replace(" ", "-").replace("_", "-")

        stmt = select(Organization).where(Organization.slug == slug)
        result = await self.db.execute(stmt)
        org = result.scalar_one_or_none()

        if not org:
            org = Organization(
                id=uuid.uuid4(),
                name=org_name,
                slug=slug,
                tenant_type="standalone",
                is_active=True,
            )
            self.db.add(org)
            await self.db.flush()

        return org

    def _create_tokens(self, user: User) -> AuthTokensResponse:
        """Create JWT access and refresh tokens for a user."""
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "tenant_id": str(user.tenant_id),
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return AuthTokensResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )
