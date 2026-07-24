"""Loop node - maps a sub-workflow over each item of a list and collects results."""

from __future__ import annotations

import uuid
from typing import Any

from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve_structured, write_output
from app.nodes.subworkflow import _load_graph_by_slug

log = get_logger("flowagent.node.loop")

MAX_ITEMS = 100


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    from app.graph.builder import build_graph
    from app.graph.checkpoint import get_checkpointer

    items = resolve_structured(f"{{{{{config.get('itemsVar', 'input')}}}}}", state)
    if not isinstance(items, list):
        items = [items]
    items = items[:MAX_ITEMS]

    slug = config.get("workflowSlug", "")
    user_id = config.get("userId") or state.get("vars", {}).get("__user_id", "")
    graph = await _load_graph_by_slug(user_id, slug)
    if graph is None:
        log.warning("loop.not_found", slug=slug)
        return write_output(config, {"error": f"workflow '{slug}' not found"})

    parent_run_id = state.get("run_id", "")
    results: list[Any] = []
    async with get_checkpointer() as checkpointer:
        for item in items:
            thread_id = str(uuid.uuid4())
            compiled = build_graph(graph, parent_run_id, checkpointer)
            child_state: GraphState = {
                "input": str(item),
                "vars": {"item": item},
                "run_id": parent_run_id,
            }
            result = await compiled.ainvoke(
                child_state, {"configurable": {"thread_id": thread_id}}
            )
            results.append(result.get("vars", {}))

    log.info("loop.done", count=len(results))
    return write_output(config, results)
