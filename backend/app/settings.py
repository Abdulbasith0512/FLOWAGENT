"""Typed application settings loaded from the repo-root `.env`."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class LLMConfig:
    model: str
    fallback_model: str
    api_key: str

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "FlowAgent"
    environment_name: str = "development"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/flowagent"
    anthropic_api_key: str = ""

    llm_model: str = "anthropic/claude-sonnet-4-6"
    llm_fallback_model: str = "anthropic/claude-haiku-4-5"
    llm_api_key: str = ""
    groq_api_key: str = ""

    tavily_api_key: str = ""
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"
    openai_api_key: str = ""

    redis_url: str = ""

    queue_redis_url: str = "redis://localhost:6379"
    use_queue: bool = True

    sandbox_image: str = "python:3.12-alpine"

    hmac_secret: str = "change-me-dev-only"
    encryption_key: str = "change-me-dev-only-encryption"

    app_base_url: str = "http://localhost:3000"
    api_base_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def service_name(self) -> str:
        return f"{self.app_name} ({self.environment_name})"

    @property
    def use_redis_checkpointer(self) -> bool:
        return bool(self.redis_url)

    @property
    def search_enabled(self) -> bool:
        return bool(self.tavily_api_key)

    @property
    def email_enabled(self) -> bool:
        return bool(self.resend_api_key)

    @property
    def llm(self) -> "LLMConfig":
        if self.groq_api_key:
            return LLMConfig(
                model="groq/llama-3.3-70b-versatile",
                fallback_model="groq/llama-3.1-8b-instant",
                api_key=self.groq_api_key,
            )
        key = self.llm_api_key or self.anthropic_api_key
        return LLMConfig(
            model=self.llm_model,
            fallback_model=self.llm_fallback_model,
            api_key=key,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
