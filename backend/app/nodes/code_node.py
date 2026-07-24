"""Code node - runs Python in a locked-down Docker sandbox (see app/sandbox)."""

from __future__ import annotations

from typing import Any

from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve_code, write_output
from app.sandbox.docker_runner import run_python

log = get_logger("flowagent.node.code")


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    code = resolve_code(config.get("code", ""), state)
    timeout = config.get("timeoutSec", 10)
    output = await run_python(code, timeout)
    return write_output(config, output)
