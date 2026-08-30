"""
Learn-it HCL — ML Service Configuration

Centralized Pydantic settings for the ML microservice.
Auth/CORS config removed (handled by Next.js gateway).
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """ML service settings loaded from environment variables."""

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
    app_port: int = 8001  # Different port from Next.js (3000)

    # ── Database (read-only for recommendation engine) ───
    database_url: str
    database_url_sync: str
    db_pool_size: int = 10
    db_max_overflow: int = 5
    db_pool_recycle: int = 3600

    # ── AI Providers ─────────────────────────────────────
    groq_api_key: str | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_ai_api_key: str | None = None
    ai_default_provider: str = "groq"
    ai_default_model: str = "meta/gpt-oss-120b"
    local_model_base_url: str | None = None

    # ── Feature Flags ────────────────────────────────────
    ff_ai_tutor: bool = True
    ff_adaptive_diagnostics: bool = True

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
