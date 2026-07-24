"""Settings for the MCP server, loaded from the repo-root `.env`."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str = "postgresql://postgres:postgres@localhost:5432/flowagent"
    api_internal_url: str = "http://localhost:8000"
    poll_interval_seconds: float = 5.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
