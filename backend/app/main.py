"""
Learn-it HCL — FastAPI Application Factory

Creates and configures the FastAPI application with all routers,
middleware, and event handlers.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.tenant import TenantMiddleware

# Import routers
from app.modules.identity.router import router as identity_router
from app.modules.learners.router import router as learners_router
from app.modules.skills.router import router as skills_router
from app.modules.content.router import router as content_router
from app.modules.courses.router import router as courses_router
from app.modules.assessments.router import router as assessments_router
from app.modules.mastery.router import router as mastery_router
from app.modules.recommendations.router import router as recommendations_router
from app.modules.learning_paths.router import router as learning_paths_router
from app.modules.gamification.router import router as gamification_router
from app.modules.ai_assistant.router import router as ai_assistant_router
from app.modules.attendance.router import router as attendance_router
from app.modules.analytics.router import router as analytics_router
from app.modules.administration.router import router as administration_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events."""
    # Startup
    import structlog
    logger = structlog.get_logger()
    await logger.ainfo("Starting Learn-it HCL", version=settings.app_version)
    yield
    # Shutdown
    await logger.ainfo("Shutting down Learn-it HCL")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "AI-Powered Personalized Learning Platform — "
            "Adaptive learning paths, intelligent diagnostics, "
            "mastery tracking, and gamified engagement."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware (order matters: last added = first executed) ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(TenantMiddleware)
    app.add_middleware(RequestIdMiddleware)

    # ── API Routers ──────────────────────────────────────────────
    api_prefix = "/api/v1"

    app.include_router(identity_router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
    app.include_router(learners_router, prefix=f"{api_prefix}/learners", tags=["Learners"])
    app.include_router(skills_router, prefix=f"{api_prefix}/skills", tags=["Skills"])
    app.include_router(content_router, prefix=f"{api_prefix}/content", tags=["Content"])
    app.include_router(courses_router, prefix=f"{api_prefix}/courses", tags=["Courses"])
    app.include_router(assessments_router, prefix=f"{api_prefix}/assessments", tags=["Assessments"])
    app.include_router(mastery_router, prefix=f"{api_prefix}/mastery", tags=["Mastery"])
    app.include_router(
        recommendations_router,
        prefix=f"{api_prefix}/recommendations",
        tags=["Recommendations"],
    )
    app.include_router(
        learning_paths_router,
        prefix=f"{api_prefix}/learning-paths",
        tags=["Learning Paths"],
    )
    app.include_router(
        gamification_router, prefix=f"{api_prefix}/gamification", tags=["Gamification"]
    )
    app.include_router(ai_assistant_router, prefix=f"{api_prefix}/ai", tags=["AI Assistant"])
    app.include_router(attendance_router, prefix=f"{api_prefix}/attendance", tags=["Attendance"])
    app.include_router(analytics_router, prefix=f"{api_prefix}/analytics", tags=["Analytics"])
    app.include_router(
        administration_router, prefix=f"{api_prefix}/admin", tags=["Administration"]
    )

    # ── Health Check ─────────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "version": settings.app_version}

    return app


app = create_app()
