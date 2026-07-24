"""Condition node - evaluates a safe boolean expression and routes to a branch."""

from __future__ import annotations

from typing import Any

import simpleeval
from simpleeval import EvalWithCompoundTypes

from app.graph.state import GraphState
from app.logging_config import get_logger

log = get_logger("flowagent.node.condition")

setattr(simpleeval, "MAX_STRING_LENGTH", 10_000)
setattr(simpleeval, "MAX_POWER", 1_000_000)
setattr(simpleeval, "DISALLOW_PREFIXES", ["_", "func_"])


_SAFE_FUNCTIONS = {
    "int": int,
    "float": float,
    "str": str,
    "bool": bool,
    "len": len,
    "abs": abs,
    "min": min,
    "max": max,
    "round": round,
}


def evaluate(expression: str, state: GraphState) -> bool:
    names = {"input": state.get("input", ""), **state.get("vars", {})}
    evaluator = EvalWithCompoundTypes(names=names)
    evaluator.functions = dict(_SAFE_FUNCTIONS)
    try:
        return bool(evaluator.eval(expression))
    except Exception as exc:
        log.warning("condition.error", error=str(exc))
        return False


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    cases = config.get("cases")
    if cases:
        for case in cases:
            if evaluate(case.get("expression", "False"), state):
                branch = case.get("name", "false")
                log.info("condition.switch", branch=branch)
                return {"branch": branch}
        fallback = config.get("fallback", "false")
        log.info("condition.fallback", branch=fallback)
        return {"branch": fallback}

    result = evaluate(config.get("expression", "True"), state)
    branch = "true" if result else "false"
    log.info("condition.done", branch=branch)
    return {"branch": branch}
