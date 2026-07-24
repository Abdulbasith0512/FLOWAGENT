"""Maps node types to their handler functions."""

from __future__ import annotations

from app.graph.state import NodeHandler
from app.nodes import (
    approve,
    code_node,
    condition,
    delay,
    email,
    http_node,
    llm,
    loop,
    merge,
    rag,
    search,
    subworkflow,
    transform,
    trigger,
)

NODE_HANDLERS: dict[str, NodeHandler] = {
    "llm": llm.handle,
    "search": search.handle,
    "code": code_node.handle,
    "http": http_node.handle,
    "email": email.handle,
    "condition": condition.handle,
    "approve": approve.handle,
    "subworkflow": subworkflow.handle,
    "loop": loop.handle,
    "merge": merge.handle,
    "delay": delay.handle,
    "transform": transform.handle,
    "rag": rag.handle,
    "trigger": trigger.handle,
}

BRANCHING_TYPES = {"condition", "approve"}
