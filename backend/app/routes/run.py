"""Run + WebSocket endpoints."""

from __future__ import annotations

from fastapi import (
    APIRouter,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import BaseModel

from app.db import repo
from app.logging_config import get_logger
from app.queue import broker
from app.ws.manager import manager

log = get_logger("flowagent.routes.run")
router = APIRouter()


class RunRequest(BaseModel):
    input: str = ""
    user_id: str | None = None
    idempotency_key: str | None = None


@router.post("/run/{workflow_id}")
async def start_run(workflow_id: str, body: RunRequest):
    workflow = await repo.load_workflow(workflow_id)
    if not workflow:
        raise HTTPException(404, "Workflow not found")
    if body.user_id and workflow["user_id"] != body.user_id:
        raise HTTPException(403, "Not your workflow")

    if await repo.budget_exceeded(workflow_id):
        raise HTTPException(429, "Monthly budget exceeded")

    if body.idempotency_key:
        existing = await repo.find_run_by_idempotency(workflow_id, body.idempotency_key)
        if existing:
            return {"run_id": str(existing["id"]), "status": existing["status"]}

    run_id = await repo.create_run(
        workflow_id,
        workflow["user_id"],
        {"input": body.input},
        idempotency_key=body.idempotency_key,
    )
    await broker.enqueue_start(run_id, workflow["graph"], body.input)
    log.info("run.started", run_id=run_id, workflow_id=workflow_id)
    return {"run_id": run_id, "status": "running"}


@router.get("/runs/{run_id}")
async def get_run(run_id: str):
    run = await repo.get_run(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return {
        "run_id": run_id,
        "status": run["status"],
        "output": run["output"],
        "error": run["error"],
    }


@router.get("/workflows/{workflow_id}/runs")
async def list_runs(workflow_id: str):
    rows = await repo.list_runs(workflow_id)
    return [
        {
            "id": str(r["id"]),
            "status": r["status"],
            "output": r["output"],
            "error": r["error"],
            "started_at": r["started_at"].isoformat() if r["started_at"] else None,
            "cost_usd": float(r["cost_usd"]) if r["cost_usd"] is not None else None,
        }
        for r in rows
    ]


@router.get("/workflows/{workflow_id}/failed-runs")
async def list_failed(workflow_id: str):
    rows = await repo.list_failed_runs(workflow_id)
    return [
        {
            "id": str(r["id"]),
            "run_id": str(r["run_id"]),
            "node_id": r["node_id"],
            "error": r["error"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


@router.post("/failed-runs/{failed_run_id}/retry")
async def retry_failed(failed_run_id: str, workflow_id: str):
    workflow = await repo.load_workflow(workflow_id)
    if not workflow:
        raise HTTPException(404, "Workflow not found")
    run_id = await repo.create_run(workflow_id, workflow["user_id"], {})
    await broker.enqueue_start(run_id, workflow["graph"], "")
    await repo.resolve_failed_run(failed_run_id)
    return {"run_id": run_id, "status": "running"}


@router.websocket("/ws/runs/{run_id}")
async def run_socket(websocket: WebSocket, run_id: str):
    cursor = websocket.query_params.get("after") or websocket.query_params.get("cursor")
    await manager.connect(run_id, websocket)
    try:
        events = await repo.list_events(run_id)
        if cursor:
            resume_index = next(
                (i + 1 for i, e in enumerate(events) if str(e["id"]) == cursor),
                len(events),
            )
            events = events[resume_index:]
        for event in events:
            await websocket.send_json(
                {
                    "id": str(event["id"]),
                    "nodeId": event["node_id"],
                    "type": event["type"],
                    "payload": event["payload"],
                    "replay": True,
                }
            )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(run_id, websocket)
