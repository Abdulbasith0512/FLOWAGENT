"""Sub-workflow node - runs another saved workflow and returns its output."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select

from app.db.client import get_engine
from app.db.tables import workflows
from app.graph.migrate import migrate_graph
from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve, write_output

log = get_logger("flowagent.node.subworkflow")


async def _load_graph_by_slug(user_id: str, slug: str) -> dict[str, Any] | None:
    stmt = select(workflows.c.graph, workflows.c.schema_version).where(
        workflows.c.user_id == user_id, workflows.c.slug == slug
    )
    async with get_engine().connect() as conn:
        row = (await conn.execute(stmt)).mappings().first()
    if not row:
        return None
    graph, _ = migrate_graph(row["graph"], row.get("schema_version", 1))
    return graph


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    from app.graph.builder import build_graph
    from app.graph.checkpoint import get_checkpointer

    slug = config.get("workflowSlug", "")
    child_input = resolve(config.get("inputTemplate", "{{input}}"), state)
    user_id = config.get("userId") or state.get("vars", {}).get("__user_id", "")

    graph = await _load_graph_by_slug(user_id, slug)
    if graph is None:
        log.warning("subworkflow.not_found", slug=slug)
        return write_output(config, {"error": f"workflow '{slug}' not found"})

    parent_run_id = state.get("run_id", "")
    thread_id = str(uuid.uuid4())
    initial: GraphState = {"input": child_input, "vars": {}, "run_id": parent_run_id}

    async with get_checkpointer() as checkpointer:
        compiled = build_graph(graph, parent_run_id, checkpointer)
        result = await compiled.ainvoke(
            initial, {"configurable": {"thread_id": thread_id}}
        )

    log.info("subworkflow.done", slug=slug)
    return write_output(config, result.get("vars", {}))
