"""ARQ broker: enqueue runs to a worker, with in-process fallback when the queue is off."""

from __future__ import annotations

from typing import Any

from arq import create_pool
from arq.connections import RedisSettings

from app.graph import executor
from app.logging_config import get_logger
from app.settings import get_settings

log = get_logger("flowagent.queue")

_pool = None


def redis_settings() -> RedisSettings:
    return RedisSettings.from_dsn(get_settings().queue_redis_url)


async def _get_pool():
    global _pool
    if _pool is None:
        _pool = await create_pool(redis_settings())
    return _pool


async def enqueue_start(run_id: str, workflow_graph: dict[str, Any], input_text: str) -> None:
    if not get_settings().use_queue:
        await executor.start_run(run_id, workflow_graph, input_text)
        return
    try:
        pool = await _get_pool()
        await pool.enqueue_job("run_workflow_job", run_id, workflow_graph, input_text)
    except Exception as exc:
        log.warning("queue.enqueue_failed_inprocess", error=str(exc))
        await executor.start_run(run_id, workflow_graph, input_text)


async def enqueue_resume(run_id: str, workflow_graph: dict[str, Any], decision: str) -> None:
    if not get_settings().use_queue:
        await executor.resume_run(run_id, workflow_graph, decision)
        return
    try:
        pool = await _get_pool()
        await pool.enqueue_job("resume_workflow_job", run_id, workflow_graph, decision)
    except Exception as exc:
        log.warning("queue.enqueue_failed_inprocess", error=str(exc))
        await executor.resume_run(run_id, workflow_graph, decision)
