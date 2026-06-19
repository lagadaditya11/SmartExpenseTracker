from functools import lru_cache
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "sqlite:///./smart_expense_tracker.db"
    jwt_secret_key: str = Field(default="change-me-in-development")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=15, ge=5, le=120)
    refresh_token_expire_days: int = Field(default=30, ge=1, le=90)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    trusted_hosts: str = "localhost,127.0.0.1,testserver"
    cookie_secure: bool = False
    cookie_domain: str | None = None
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    database_pool_size: int = Field(default=5, ge=1, le=50)
    database_max_overflow: int = Field(default=10, ge=0, le=100)
    database_pool_timeout_seconds: int = Field(default=30, ge=1, le=120)
    max_request_body_bytes: int = Field(default=1_048_576, ge=1024)
    auth_rate_limit_attempts: int = Field(default=10, ge=1, le=100)
    auth_rate_limit_window_seconds: int = Field(default=60, ge=1, le=3600)
    app_locale: str = "en-US"
    app_currency: str = "USD"
    app_timezone: str = "UTC"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_hosts(self) -> list[str]:
        return [host.strip() for host in self.trusted_hosts.split(",") if host.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        try:
            ZoneInfo(self.app_timezone)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"Unknown APP_TIMEZONE: {self.app_timezone}") from exc
        if len(self.app_currency) != 3:
            raise ValueError("APP_CURRENCY must be a three-letter ISO 4217 code")
        if not self.is_production:
            return self
        if self.database_url.startswith("sqlite"):
            raise ValueError("DATABASE_URL must use PostgreSQL in production")
        if len(self.jwt_secret_key) < 32 or self.jwt_secret_key == "change-me-in-development":
            raise ValueError("JWT_SECRET_KEY must be a unique value of at least 32 characters")
        if not self.cookie_secure:
            raise ValueError("COOKIE_SECURE must be true in production")
        if not self.allowed_origins:
            raise ValueError("CORS_ORIGINS must contain at least one trusted origin")
        if "*" in self.allowed_origins or "*" in self.allowed_hosts:
            raise ValueError("Wildcard origins and hosts are forbidden in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
