"""Runs and resumes compiled workflow graphs, persisting status and events."""

from __future__ import annotations

from typing import Any

from langgraph.types import Command

from app.db import repo
from app.graph.builder import build_graph
from app.graph.checkpoint import get_checkpointer
from app.graph.state import GraphState
from app.logging_config import get_logger
from app.ws.manager import manager

log = get_logger("flowagent.executor")


async def _load_credentials(run_id: str) -> str:
    from app.nodes.base import set_credentials

    run = await repo.get_run(run_id)
    if not run:
        return ""
    creds = await repo.get_credentials_map(run["user_id"])
    set_credentials(creds)
    return run["user_id"]


async def start_run(run_id: str, workflow_graph: dict[str, Any], input_text: str) -> None:
    user_id = await _load_credentials(run_id)
    initial: GraphState = {
        "input": input_text,
        "vars": {"__user_id": user_id},
        "run_id": run_id,
    }
    await _drive(run_id, workflow_graph, initial)


async def resume_run(run_id: str, workflow_graph: dict[str, Any], decision: str) -> None:
    await _load_credentials(run_id)
    await _drive(run_id, workflow_graph, Command(resume=decision))


async def _drive(run_id: str, workflow_graph: dict[str, Any], payload: Any) -> None:
    config = {"configurable": {"thread_id": run_id}}
    try:
        async with get_checkpointer() as checkpointer:
            graph = build_graph(workflow_graph, run_id, checkpointer)
            interrupted = False

            async for chunk in graph.astream(payload, config, stream_mode="updates"):
                if "__interrupt__" in chunk:
                    interrupted = True
                    await _on_interrupt(run_id, chunk["__interrupt__"])
                    break

            if interrupted:
                return

            final = await graph.aget_state(config)
            output = _final_output(final.values)
            await repo.rollup_run_cost(run_id)
            await repo.set_run_status(run_id, "done", output=output)
            await _status(run_id, "done", {"output": output})
            log.info("run.done", run_id=run_id)
    except Exception as exc:
        node_id = getattr(exc, "node_id", "")
        await repo.set_run_status(run_id, "error", error=str(exc))
        await _status(run_id, "error", {"error": str(exc)})
        await _record_dlq(run_id, node_id, str(exc))
        log.error("run.error", run_id=run_id, error=str(exc))


async def _record_dlq(run_id: str, node_id: str, error: str) -> None:
    run = await repo.get_run(run_id)
    if not run:
        return
    await repo.record_failed_run(
        run_id, str(run["workflow_id"]), node_id, error, retry_count=0, state=run.get("input")
    )


async def _on_interrupt(run_id: str, interrupts: Any) -> None:
    payload = interrupts[0].value if interrupts else {}
    await repo.set_run_status(run_id, "paused")
    await repo.append_event(run_id, payload.get("run_id", ""), "interrupt", payload=payload)
    await _status(run_id, "paused", payload)
    log.info("run.paused", run_id=run_id)


def _final_output(values: dict[str, Any]) -> dict[str, Any]:
    return {"vars": values.get("vars", {})}


async def _status(run_id: str, status: str, payload: dict[str, Any]) -> None:
    if status in ("done", "error"):
        await repo.append_event(run_id, "", "run_status", payload={"status": status, **payload})
    await manager.broadcast(
        run_id, {"nodeId": "", "type": "run_status", "payload": {"status": status, **payload}}
    )
