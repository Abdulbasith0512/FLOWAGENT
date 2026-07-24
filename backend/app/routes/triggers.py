"""Webhook intake - an external POST with a valid signature starts a run."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from app.db import repo
from app.db.client import get_engine
from app.db.tables import triggers, workflows
from app.graph.migrate import migrate_graph
from app.logging_config import get_logger
from app.queue import broker
from app.security.webhook import SIGNATURE_HEADER, TIMESTAMP_HEADER, verify_signature

log = get_logger("flowagent.routes.triggers")
router = APIRouter()


@router.post("/webhooks/{trigger_id}")
async def webhook(trigger_id: str, request: Request):
    stmt = select(triggers).where(triggers.c.id == uuid.UUID(trigger_id))
    async with get_engine().connect() as conn:
        trigger = (await conn.execute(stmt)).mappings().first()
    if not trigger or trigger["type"] != "webhook" or not trigger["enabled"]:
        raise HTTPException(404, "Trigger not found")

    body = await request.body()
    signature = request.headers.get(SIGNATURE_HEADER, "")
    timestamp = request.headers.get(TIMESTAMP_HEADER, "")
    if not verify_signature(body, signature, timestamp, secret=trigger["webhook_secret"]):
        raise HTTPException(403, "Invalid signature")

    wf_stmt = select(workflows.c.graph, workflows.c.schema_version).where(
        workflows.c.id == trigger["workflow_id"]
    )
    async with get_engine().connect() as conn:
        wf = (await conn.execute(wf_stmt)).mappings().first()
    if not wf:
        raise HTTPException(404, "Workflow not found")

    graph, _ = migrate_graph(wf["graph"], wf.get("schema_version", 1))
    run_id = await repo.create_run(
        str(trigger["workflow_id"]), trigger["user_id"], {"input": body.decode()[:2000]}
    )
    await broker.enqueue_start(run_id, graph, body.decode()[:2000])
    log.info("webhook.fired", trigger=trigger_id, run_id=run_id)
    return {"run_id": run_id, "status": "running"}
