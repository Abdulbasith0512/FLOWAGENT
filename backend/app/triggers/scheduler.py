"""Cron scheduler - fires enabled cron triggers and enqueues their workflows."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from datetime import timedelta

from croniter import croniter
from sqlalchemy import select, update

from app.db import repo
from app.db.client import get_engine
from app.db.tables import credentials, triggers, workflows
from app.logging_config import get_logger
from app.queue import broker

log = get_logger("flowagent.scheduler")

POLL_SECONDS = 30
ROTATION_DAYS = 90


async def _due_cron_triggers(now: datetime) -> list[dict]:
    stmt = select(triggers).where(
        triggers.c.type == "cron", triggers.c.enabled.is_(True)
    )
    async with get_engine().connect() as conn:
        rows = (await conn.execute(stmt)).mappings().all()

    due = []
    for row in rows:
        if not row["cron"]:
            continue
        base = row["last_fired_at"] or row["created_at"]
        try:
            next_run = croniter(row["cron"], base).get_next(datetime)
        except (ValueError, KeyError):
            continue
        if next_run <= now:
            due.append(dict(row))
    return due


async def _fire(trigger_row: dict, now: datetime) -> None:
    stmt = select(workflows.c.graph, workflows.c.schema_version).where(
        workflows.c.id == trigger_row["workflow_id"]
    )
    async with get_engine().connect() as conn:
        wf = (await conn.execute(stmt)).mappings().first()
    if not wf:
        return

    from app.graph.migrate import migrate_graph

    graph, _ = migrate_graph(wf["graph"], wf.get("schema_version", 1))
    run_id = await repo.create_run(
        str(trigger_row["workflow_id"]), trigger_row["user_id"], {"input": ""}
    )
    await broker.enqueue_start(run_id, graph, "")

    async with get_engine().begin() as conn:
        await conn.execute(
            update(triggers)
            .where(triggers.c.id == trigger_row["id"])
            .values(last_fired_at=now)
        )
    log.info("scheduler.fired", trigger=str(trigger_row["id"]))


async def _stale_credentials(now: datetime) -> list[dict]:
    cutoff = now.replace(tzinfo=None) - timedelta(days=ROTATION_DAYS)
    stmt = select(credentials.c.id, credentials.c.name, credentials.c.user_id).where(
        credentials.c.updated_at < cutoff
    )
    async with get_engine().connect() as conn:
        rows = (await conn.execute(stmt)).mappings().all()
    return [dict(r) for r in rows]


_last_rotation_check: datetime | None = None


async def scheduler_loop() -> None:
    global _last_rotation_check
    log.info("scheduler.started", interval=POLL_SECONDS)
    while True:
        try:
            now = datetime.now(timezone.utc)
            for trigger_row in await _due_cron_triggers(now):
                await _fire(trigger_row, now)
            if _last_rotation_check is None or (now - _last_rotation_check) > timedelta(hours=24):
                for cred in await _stale_credentials(now):
                    log.warning("credential.rotation_due", name=cred["name"], user=cred["user_id"])
                _last_rotation_check = now
        except Exception as exc:
            log.warning("scheduler.error", error=str(exc))
        await asyncio.sleep(POLL_SECONDS)
