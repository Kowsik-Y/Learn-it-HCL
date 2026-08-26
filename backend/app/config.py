"""
Learn-it HCL — Application Configuration

Centralized Pydantic settings for the entire backend.
All configuration is loaded from environment variables.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────
    app_name: str = "Learn-it HCL"
    app_version: str = "0.1.0"
    app_env: Literal["development", "staging", "production"] = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # ── Database ─────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://learnit:learnit_dev@localhost:5432/learnit"
    database_url_sync: str = "postgresql://learnit:learnit_dev@localhost:5432/learnit"
    db_pool_size: int = 20
    db_max_overflow: int = 10
    db_pool_recycle: int = 3600

    # ── Redis ────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── JWT ──────────────────────────────────────────────
    jwt_secret_key: str = "change-this-to-a-random-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # ── CORS ─────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    # ── AI Providers ─────────────────────────────────────
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_ai_api_key: str = ""
    ai_default_provider: str = "openai"
    ai_default_model: str = "gpt-4o-mini"
    local_model_base_url: str = "http://localhost:11434/v1"

    # ── Feature Flags ────────────────────────────────────
    ff_ai_tutor: bool = True
    ff_gamification: bool = True
    ff_adaptive_diagnostics: bool = True
    ff_career_path_mode: bool = True
    ff_attendance: bool = True
    ff_short_video_mode: bool = True

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
