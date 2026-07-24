"""Async Postgres engine shared across the backend."""

from __future__ import annotations

import re
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.settings import get_settings


def _to_asyncpg_url(url: str) -> str:
    return re.sub(r"^postgres(ql)?://", "postgresql+asyncpg://", url, count=1)


@lru_cache
def get_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(
        _to_asyncpg_url(settings.database_url),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
    )
