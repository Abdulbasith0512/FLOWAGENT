"""Trigger node - an entry point fired by cron, webhook, or an MCP call."""

from __future__ import annotations

from typing import Any

from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import write_output

log = get_logger("flowagent.node.trigger")


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    log.info("trigger.fired", kind=config.get("kind", "manual"))
    return write_output(config, state.get("input", ""))
