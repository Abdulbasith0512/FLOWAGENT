"""Checkpointer factory: Redis when configured, in-memory otherwise."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver

from app.logging_config import get_logger
from app.settings import get_settings

log = get_logger("flowagent.checkpoint")

_memory_saver = MemorySaver()


@asynccontextmanager
async def get_checkpointer() -> AsyncIterator[BaseCheckpointSaver]:
    settings = get_settings()
    if not settings.use_redis_checkpointer:
        yield _memory_saver
        return

    from langgraph.checkpoint.redis.aio import AsyncRedisSaver

    async with AsyncRedisSaver.from_conn_string(settings.redis_url) as saver:
        await saver.asetup()
        yield saver
