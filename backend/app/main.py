"""
Learn-it HCL — ML Microservice

Slim FastAPI application serving only ML/AI endpoints:
- AI Tutor & Onboarding (LLM-based)
- Recommendation Engine (11-stage pipeline)
- Mastery Calculation (Bayesian algorithm)

All auth, CRUD, and DB reads are handled by the Next.js API gateway.
This service is called internally by Next.js with user identity in headers.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.config import get_settings
from app.middleware.gateway_auth import GatewayAuthMiddleware

# Import ML routers only
from app.modules.ai_assistant.router import router as ai_assistant_router
from app.modules.recommendations.router import router as recommendations_router
from app.modules.recommendations.playlist_router import router as playlist_router
from app.modules.mastery.router import router as mastery_router
from app.modules.ai_course_agent.router import router as ai_course_agent_router


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events."""
    # Startup
    import structlog
    logger = structlog.get_logger()
    await logger.ainfo("Starting Learn-it HCL ML Service", version=settings.app_version)
    yield
    # Shutdown
    await logger.ainfo("Shutting down Learn-it HCL ML Service")


def create_app() -> FastAPI:
    """Create and configure the ML microservice."""
    app = FastAPI(
        title=f"{settings.app_name} — ML Service",
        version=settings.app_version,
        description=(
            "AI/ML Microservice for Learn-it HCL — "
            "AI tutor, recommendation engine, mastery calculation. "
            "Called internally by the Next.js API gateway."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware ──
    # Gateway auth: validates X-User-Id and X-Tenant-Id headers
    app.add_middleware(GatewayAuthMiddleware)

    # ── ML Routers ──
    ml_prefix = "/ml"

    app.include_router(
        ai_assistant_router, prefix=f"{ml_prefix}/ai", tags=["AI Assistant"]
    )
    app.include_router(
        recommendations_router,
        prefix=f"{ml_prefix}/recommendations",
        tags=["Recommendations"],
    )
    app.include_router(
        mastery_router, prefix=f"{ml_prefix}/mastery", tags=["Mastery"]
    )
    app.include_router(
        ai_course_agent_router, prefix=f"{ml_prefix}/course_agent", tags=["Course Agent"]
    )
    app.include_router(
        playlist_router, prefix=f"{ml_prefix}", tags=["Adaptive Playlist"]
    )

    # ── Health Check ──
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "service": "ml", "version": settings.app_version}

    return app


app = create_app()
