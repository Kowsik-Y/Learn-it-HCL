"""
Identity Module — API Router

Authentication endpoints: register, login, refresh, profile.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.identity.dependencies import CurrentUser
from app.modules.identity.schemas import (
    AuthTokensResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    UserProfileResponse,
    UserResponse,
)
from app.modules.identity.service import IdentityService

router = APIRouter()


@router.post("/register", response_model=dict, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    service = IdentityService(db)
    user, tokens = await service.register(data)
    return {"user": user.model_dump(), "tokens": tokens.model_dump()}


@router.post("/login", response_model=dict)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive access/refresh tokens."""
    service = IdentityService(db)
    user, tokens = await service.login(data)
    return {"user": user.model_dump(), "tokens": tokens.model_dump()}


@router.post("/refresh", response_model=AuthTokensResponse)
async def refresh_tokens(
    data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
):
    """Refresh the access token using a valid refresh token."""
    service = IdentityService(db)
    return await service.refresh_tokens(data.refresh_token)


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get the authenticated user's full profile with permissions."""
    service = IdentityService(db)
    return await service.get_profile(current_user.id)


@router.post("/logout")
async def logout(current_user: CurrentUser):
    """Logout the current user (invalidate token client-side)."""
    # In production, add the token's jti to a Redis blacklist
    return {"message": "Logged out successfully"}
