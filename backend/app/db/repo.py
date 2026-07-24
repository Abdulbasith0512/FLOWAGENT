"""Data-access layer for workflows, runs, and run events."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import desc, insert, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.client import get_engine
from app.db.tables import (
    credentials,
    failed_runs,
    node_output_cache,
    run_events,
    runs,
    workflows,
)
from app.graph.migrate import migrate_graph


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def load_workflow(workflow_id: str) -> dict[str, Any] | None:
    stmt = select(workflows).where(workflows.c.id == uuid.UUID(workflow_id))
    async with get_engine().connect() as conn:
        row = (await conn.execute(stmt)).mappings().first()
    if not row:
        return None

    record = dict(row)
    graph, version = migrate_graph(record["graph"], record.get("schema_version", 1))
    record["graph"] = graph
    record["schema_version"] = version
    return record


async def create_run(
    workflow_id: str,
    user_id: str,
    input_value: Any,
    *,
    idempotency_key: str | None = None,
) -> str:
    run_id = uuid.uuid4()
    ws_stmt = select(workflows.c.workspace_id).where(
        workflows.c.id == uuid.UUID(workflow_id)
    )
    async with get_engine().connect() as conn:
        workspace_id = (await conn.execute(ws_stmt)).scalar()
    stmt = insert(runs).values(
        id=run_id,
        workflow_id=uuid.UUID(workflow_id),
        user_id=user_id,
        workspace_id=workspace_id,
        status="running",
        input=input_value,
        idempotency_key=idempotency_key,
        started_at=_now(),
    )
    async with get_engine().begin() as conn:
        await conn.execute(stmt)
    return str(run_id)


async def find_run_by_idempotency(
    workflow_id: str, idempotency_key: str
) -> dict[str, Any] | None:
    stmt = select(runs).where(
        runs.c.workflow_id == uuid.UUID(workflow_id),
        runs.c.idempotency_key == idempotency_key,
    )
    async with get_engine().connect() as conn:
        row = (await conn.execute(stmt)).mappings().first()
    return dict(row) if row else None


async def set_run_status(
    run_id: str,
    status: str,
    *,
    output: Any | None = None,
    error: str | None = None,
) -> None:
    values: dict[str, Any] = {"status": status}
    if output is not None:
        values["output"] = output
    if error is not None:
        values["error"] = error
    if status in ("done", "error"):
        values["finished_at"] = _now()

    stmt = update(runs).where(runs.c.id == uuid.UUID(run_id)).values(**values)
    async with get_engine().begin() as conn:
        await conn.execute(stmt)


async def append_event(
    run_id: str,
    node_id: str,
    event_type: str,
    *,
    payload: Any | None = None,
    duration_ms: int | None = None,
    cost_usd: float | None = None,
    tokens: int | None = None,
) -> None:
    stmt = insert(run_events).values(
        id=uuid.uuid4(),
        run_id=uuid.UUID(run_id),
        node_id=node_id,
        type=event_type,
        payload=payload,
        duration_ms=duration_ms,
        cost_usd=cost_usd,
        tokens=tokens,
        created_at=_now(),
    )
    async with get_engine().begin() as conn:
        await conn.execute(stmt)


async def list_events(run_id: str) -> list[dict[str, Any]]:
    stmt = (
        select(run_events)
        .where(run_events.c.run_id == uuid.UUID(run_id))
        .order_by(run_events.c.created_at)
    )
    async with get_engine().connect() as conn:
        rows = (await conn.execute(stmt)).mappings().all()
    return [dict(r) for r in rows]


async def get_run(run_id: str) -> dict[str, Any] | None:
    stmt = select(runs).where(runs.c.id == uuid.UUID(run_id))
    async with get_engine().connect() as conn:
        row = (await conn.execute(stmt)).mappings().first()
    return dict(row) if row else None


async def get_run_graph(run_id: str) -> dict[str, Any] | None:
    stmt = (
        select(runs.c.status, workflows.c.graph, workflows.c.schema_version)
        .join(workflows, runs.c.workflow_id == workflows.c.id)
        .where(runs.c.id == uuid.UUID(run_id))
    )
    async with get_engine().connect() as conn:
        row = (await conn.execute(stmt)).mappings().first()
    if not row:
        return None
    record = dict(row)
    graph, _ = migrate_graph(record["graph"], record.get("schema_version", 1))
    record["graph"] = graph
    return record


async def list_runs(workflow_id: str, limit: int = 20) -> list[dict[str, Any]]:
    stmt = (
        select(
            runs.c.id,
            runs.c.status,
            runs.c.input,
            runs.c.output,
            runs.c.error,
            runs.c.started_at,
            runs.c.finished_at,
            runs.c.cost_usd,
        )
        .where(runs.c.workflow_id == uuid.UUID(workflow_id))
        .order_by(desc(runs.c.started_at))
        .limit(limit)
    )
    async with get_engine().connect() as conn:
        rows = (await conn.execute(stmt)).mappings().all()
    return [dict(r) for r in rows]


async def has_event(run_id: str, event_type: str) -> bool:
    stmt = select(run_events.c.id).where(
        run_events.c.run_id == uuid.UUID(run_id),
        run_events.c.type == event_type,
    )
    async with get_engine().connect() as conn:
        return (await conn.execute(stmt)).first() is not None


async def record_failed_run(
    run_id: str, workflow_id: str, node_id: str, error: str, retry_count: int, state: Any
) -> None:
    stmt = insert(failed_runs).values(
        id=uuid.uuid4(),
        run_id=uuid.UUID(run_id),
        workflow_id=uuid.UUID(workflow_id),
        node_id=node_id,
        error=error,
        retry_count=retry_count,
        state=state,
        resolved=False,
        created_at=_now(),
    )
    async with get_engine().begin() as conn:
        await conn.execute(stmt)


async def list_failed_runs(workflow_id: str) -> list[dict[str, Any]]:
    stmt = (
        select(failed_runs)
        .where(
            failed_runs.c.workflow_id == uuid.UUID(workflow_id),
            failed_runs.c.resolved.is_(False),
        )
        .order_by(failed_runs.c.created_at.desc())
    )
    async with get_engine().connect() as conn:
        rows = (await conn.execute(stmt)).mappings().all()
    return [dict(r) for r in rows]


async def resolve_failed_run(failed_run_id: str) -> None:
    stmt = (
        update(failed_runs)
        .where(failed_runs.c.id == uuid.UUID(failed_run_id))
        .values(resolved=True)
    )
    async with get_engine().begin() as conn:
        await conn.execute(stmt)


async def get_cached_output(cache_key: str) -> Any | None:
    stmt = select(node_output_cache.c.output, node_output_cache.c.expires_at).where(
        node_output_cache.c.cache_key == cache_key
    )
    async with get_engine().connect() as conn:
        row = (await conn.execute(stmt)).mappings().first()
    if not row:
        return None
    if row["expires_at"] < _now():
        return None
    return row["output"]


async def rollup_run_cost(run_id: str) -> None:
    from sqlalchemy import func

    totals_stmt = select(
        func.coalesce(func.sum(run_events.c.cost_usd), 0),
        func.coalesce(func.sum(run_events.c.tokens), 0),
    ).where(run_events.c.run_id == uuid.UUID(run_id))
    async with get_engine().connect() as conn:
        row = (await conn.execute(totals_stmt)).first()
    cost, tokens = (row[0], row[1]) if row else (0, 0)

    stmt = (
        update(runs)
        .where(runs.c.id == uuid.UUID(run_id))
        .values(cost_usd=cost, tokens_total=tokens)
    )
    async with get_engine().begin() as conn:
        await conn.execute(stmt)


async def budget_exceeded(workflow_id: str) -> bool:
    from datetime import datetime, timezone

    from sqlalchemy import func

    from app.db.tables import workspaces

    wf_stmt = select(workflows.c.workspace_id).where(
        workflows.c.id == uuid.UUID(workflow_id)
    )
    async with get_engine().connect() as conn:
        wf = (await conn.execute(wf_stmt)).mappings().first()
        if not wf or not wf["workspace_id"]:
            return False

        budget_stmt = select(workspaces.c.monthly_budget_usd).where(
            workspaces.c.id == wf["workspace_id"]
        )
        budget = (await conn.execute(budget_stmt)).scalar()
        if budget is None:
            return False

        now = datetime.now(timezone.utc)
        month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        spend_stmt = select(func.coalesce(func.sum(runs.c.cost_usd), 0)).where(
            runs.c.workspace_id == wf["workspace_id"],
            runs.c.started_at >= month_start,
        )
        spend = (await conn.execute(spend_stmt)).scalar()

    return float(spend or 0) >= float(budget)


async def get_credentials_map(user_id: str) -> dict[str, str]:
    from app.security.crypto import decrypt

    stmt = select(credentials.c.slug, credentials.c.ciphertext).where(
        credentials.c.user_id == user_id
    )
    async with get_engine().connect() as conn:
        rows = (await conn.execute(stmt)).mappings().all()
    result: dict[str, str] = {}
    for row in rows:
        try:
            result[row["slug"]] = decrypt(row["ciphertext"])
        except Exception:
            continue
    return result


async def set_cached_output(cache_key: str, output: Any, ttl_seconds: int) -> None:
    from datetime import timedelta

    stmt = (
        pg_insert(node_output_cache)
        .values(
            id=uuid.uuid4(),
            cache_key=cache_key,
            output=output,
            expires_at=_now() + timedelta(seconds=ttl_seconds),
            created_at=_now(),
        )
        .on_conflict_do_update(
            index_elements=[node_output_cache.c.cache_key],
            set_={"output": output, "expires_at": _now() + timedelta(seconds=ttl_seconds)},
        )
    )
    async with get_engine().begin() as conn:
        await conn.execute(stmt)
