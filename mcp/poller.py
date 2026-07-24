"""Polls the workflows table and registers one MCP tool per saved workflow."""

from __future__ import annotations

import asyncio
import re
from datetime import datetime

import asyncpg
import structlog
from fastmcp import FastMCP
from fastmcp.tools import Tool

from analytics import record_invocation
from runner import run_workflow
from sanitize import sanitize_description
from settings import get_settings

log = structlog.get_logger("flowagent.mcp.poller")

_QUERY = """
    select id::text, user_id, name, slug, description, mcp_inputs, published_at as updated_at
    from workflows
    where published_at is not null and published_at > $1
    order by published_at
"""


def _tool_name(slug: str) -> str:
    cleaned = re.sub(r"[^a-z0-9_]", "_", slug.lower())
    return f"run_workflow_{cleaned}"


def _make_tool(workflow: asyncpg.Record) -> Tool:
    workflow_id = workflow["id"]
    user_id = workflow["user_id"]
    tool_name = _tool_name(workflow["slug"])
    raw = workflow["description"] or f"Run the '{workflow['name']}' workflow."
    description = sanitize_description(raw)

    async def tool(input: str = "") -> str:
        import time

        started = time.monotonic()
        status = "done"
        try:
            result = await run_workflow(workflow_id, user_id, input)
            return result
        except Exception:
            status = "error"
            raise
        finally:
            duration = int((time.monotonic() - started) * 1000)
            try:
                await record_invocation(workflow_id, tool_name, status, duration)
            except Exception as exc:
                log.warning("analytics.failed", error=str(exc))

    return Tool.from_function(tool, name=tool_name, description=description)


async def poll_loop(mcp: FastMCP) -> None:
    settings = get_settings()
    conn = await asyncpg.connect(settings.database_url)
    cursor = datetime(1970, 1, 1)
    log.info("poller.started", interval=settings.poll_interval_seconds)
    try:
        while True:
            rows = await conn.fetch(_QUERY, cursor)
            for row in rows:
                mcp.add_tool(_make_tool(row))
                cursor = max(cursor, row["updated_at"])
                log.info("poller.registered", tool=_tool_name(row["slug"]))
            await asyncio.sleep(settings.poll_interval_seconds)
    finally:
        await conn.close()
