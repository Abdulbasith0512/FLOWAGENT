"""Replay a finished run from its original graph and input."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db import repo
from app.logging_config import get_logger
from app.queue import broker

log = get_logger("flowagent.routes.replay")
router = APIRouter()


def _input_text(run_input: object) -> str:
    if isinstance(run_input, dict):
        return str(run_input.get("input", ""))
    if run_input is None:
        return ""
    return str(run_input)


@router.post("/runs/{run_id}/replay")
async def replay_run(run_id: str):
    run = await repo.get_run(run_id)
    if not run:
        raise HTTPException(404, "Run not found")

    run_graph = await repo.get_run_graph(run_id)
    if not run_graph:
        raise HTTPException(404, "Workflow graph not found")

    input_text = _input_text(run.get("input"))
    new_run_id = await repo.create_run(
        str(run["workflow_id"]),
        run["user_id"],
        {"input": input_text},
    )
    await broker.enqueue_start(new_run_id, run_graph["graph"], input_text)
    log.info("run.replayed", source_run_id=run_id, run_id=new_run_id)
    return {"run_id": new_run_id, "status": "running", "source_run_id": run_id}
