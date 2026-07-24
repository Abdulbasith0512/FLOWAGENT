"""Approve node - pauses the graph for human approval (HITL)."""

from __future__ import annotations

from typing import Any

from langgraph.types import interrupt

from app.graph.state import GraphState
from app.hitl.notify import send_approval_request
from app.logging_config import get_logger
from app.nodes.base import resolve

log = get_logger("flowagent.node.approve")


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    message = resolve(config.get("message", ""), state)
    run_id = state.get("run_id", "")
    approver = resolve(config.get("approverEmail", ""), state)

    if approver:
        await send_approval_request(
            run_id, approver, message, config.get("timeoutHours", 24)
        )
    log.info("approve.interrupt", run_id=run_id)

    decision = interrupt(
        {
            "kind": "approve",
            "message": message,
            "run_id": state.get("run_id"),
            "approverEmail": config.get("approverEmail", ""),
        }
    )

    branch = "true" if decision == "approved" else "false"
    log.info("approve.resumed", decision=decision, branch=branch)
    return {"branch": branch, "vars": {"approval": decision}}
