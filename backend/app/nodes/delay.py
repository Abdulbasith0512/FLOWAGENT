"""Delay node - pauses execution for a fixed number of seconds."""

from __future__ import annotations

import asyncio
from typing import Any

from app.graph.state import GraphState
from app.logging_config import get_logger

log = get_logger("flowagent.node.delay")

MAX_DELAY_SECONDS = 3600


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    seconds = min(int(config.get("seconds", 1)), MAX_DELAY_SECONDS)
    log.info("delay.start", seconds=seconds)
    await asyncio.sleep(seconds)
    log.info("delay.done")
    return {}
