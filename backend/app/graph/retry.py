"""Per-node retry with exponential backoff."""

from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable

from langgraph.errors import GraphBubbleUp

from app.graph.state import GraphState
from app.logging_config import get_logger

log = get_logger("flowagent.retry")

Handler = Callable[[GraphState, dict[str, Any]], Awaitable[dict[str, Any]]]


async def run_with_retry(
    handler: Handler,
    state: GraphState,
    config: dict[str, Any],
    node_id: str,
) -> dict[str, Any]:
    max_retries = int(config.get("maxRetries", 0))
    backoff = float(config.get("backoffSeconds", 1))

    attempt = 0
    while True:
        try:
            return await handler(state, config)
        except GraphBubbleUp:
            raise
        except Exception as exc:
            if attempt >= max_retries:
                raise
            delay = backoff * (2**attempt)
            log.warning(
                "retry.node", node_id=node_id, attempt=attempt + 1, delay=delay, error=str(exc)
            )
            await asyncio.sleep(delay)
            attempt += 1
