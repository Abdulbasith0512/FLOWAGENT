"""Merge node - combines outputs from several upstream nodes into one object."""

from __future__ import annotations

from typing import Any

from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve_structured, write_output

log = get_logger("flowagent.node.merge")


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    raw_sources = config.get("sources", [])
    if isinstance(raw_sources, str):
        sources = [s.strip() for s in raw_sources.split(",") if s.strip()]
    else:
        sources = raw_sources
    strategy = config.get("strategy", "object")

    values = [resolve_structured(f"{{{{{src}}}}}", state) for src in sources]

    if strategy == "concat":
        merged: Any = []
        for value in values:
            merged.extend(value if isinstance(value, list) else [value])
    elif strategy == "first":
        merged = next((v for v in values if v), None)
    else:
        merged = {src: val for src, val in zip(sources, values)}

    log.info("merge.done", strategy=strategy, sources=len(sources))
    return write_output(config, merged)
