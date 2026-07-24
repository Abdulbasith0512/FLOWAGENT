"""ARQ worker process. Run: `uv run arq app.queue.worker.WorkerSettings`."""

from __future__ import annotations

from typing import Any

from app.graph import executor
from app.logging_config import configure_logging, get_logger
from app.queue.broker import redis_settings

configure_logging()
log = get_logger("flowagent.worker")


async def run_workflow_job(
    ctx: dict, run_id: str, workflow_graph: dict[str, Any], input_text: str
) -> None:
    log.info("worker.run", run_id=run_id)
    await executor.start_run(run_id, workflow_graph, input_text)


async def resume_workflow_job(
    ctx: dict, run_id: str, workflow_graph: dict[str, Any], decision: str
) -> None:
    log.info("worker.resume", run_id=run_id)
    await executor.resume_run(run_id, workflow_graph, decision)


class WorkerSettings:
    functions = [run_workflow_job, resume_workflow_job]
    redis_settings = redis_settings()
    max_jobs = 10
    job_timeout = 600
