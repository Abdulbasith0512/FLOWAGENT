"""Approve / deny endpoints that resume a paused run."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.db import repo
from app.hitl.sign import verify_token
from app.logging_config import get_logger
from app.queue import broker

log = get_logger("flowagent.routes.approve")
router = APIRouter()


class DecisionRequest(BaseModel):
    decision: str


@router.post("/runs/{run_id}/decision")
async def decide(run_id: str, body: DecisionRequest):
    decision = "approved" if body.decision == "approved" else "denied"
    run_graph = await repo.get_run_graph(run_id)
    if not run_graph:
        raise HTTPException(404, "Run not found")
    if run_graph["status"] != "paused":
        raise HTTPException(409, "This run is not waiting for approval.")
    if await repo.has_event(run_id, decision):
        raise HTTPException(409, "This decision was already recorded.")

    await repo.append_event(run_id, "", decision)
    await repo.set_run_status(run_id, "running")
    await broker.enqueue_resume(run_id, run_graph["graph"], decision)
    log.info("approve.resumed_inapp", run_id=run_id, decision=decision)
    return {"run_id": run_id, "decision": decision, "status": "running"}


def _page(title: str, body: str) -> HTMLResponse:
    return HTMLResponse(
        f"<html><body style='font-family:sans-serif;max-width:32rem;margin:4rem auto'>"
        f"<h2>{title}</h2><p>{body}</p></body></html>"
    )


@router.get("/approve/{token}")
async def approve(token: str):
    verified = verify_token(token)
    if not verified:
        raise HTTPException(403, "Invalid or expired link")
    run_id, decision = verified

    run_graph = await repo.get_run_graph(run_id)
    if not run_graph:
        raise HTTPException(404, "Run not found")
    if run_graph["status"] != "paused":
        return _page("Already handled", "This run is no longer waiting for approval.")
    if await repo.has_event(run_id, decision):
        return _page("Already handled", "This decision was already recorded.")

    await repo.append_event(run_id, "", decision)
    await repo.set_run_status(run_id, "running")
    await broker.enqueue_resume(run_id, run_graph["graph"], decision)
    log.info("approve.resumed", run_id=run_id, decision=decision)

    verb = "approved" if decision == "approved" else "denied"
    return _page("Thanks", f"The workflow has been {verb} and will continue.")
