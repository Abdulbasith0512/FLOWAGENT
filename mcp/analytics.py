"""Records MCP tool invocations for usage analytics."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import asyncpg

from settings import get_settings

_INSERT = """
    insert into mcp_tool_invocations (id, workflow_id, tool_name, status, duration_ms, created_at)
    values ($1, $2, $3, $4, $5, $6)
"""


async def record_invocation(
    workflow_id: str, tool_name: str, status: str, duration_ms: int
) -> None:
    conn = await asyncpg.connect(get_settings().database_url)
    try:
        await conn.execute(
            _INSERT,
            uuid.uuid4(),
            uuid.UUID(workflow_id),
            tool_name,
            status,
            duration_ms,
            datetime.now(timezone.utc).replace(tzinfo=None),
        )
    finally:
        await conn.close()
