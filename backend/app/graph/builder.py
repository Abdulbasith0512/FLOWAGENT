"""Translates a workflow graph (nodes + edges) into a compiled LangGraph."""

from __future__ import annotations

import time
from typing import Any

from langgraph.errors import GraphBubbleUp
from langgraph.graph import END, START, StateGraph

from app.db import repo
from app.graph.registry import BRANCHING_TYPES, NODE_HANDLERS
from app.graph.retry import run_with_retry
from app.graph.state import GraphState
from app.logging_config import get_logger
from app.ws.manager import manager

log = get_logger("flowagent.builder")


class GraphValidationError(Exception):
    pass


class NodeExecutionError(Exception):
    def __init__(self, node_id: str, message: str) -> None:
        super().__init__(message)
        self.node_id = node_id
        self.message = message


def _entry_nodes(nodes: list[dict], edges: list[dict]) -> list[str]:
    targets = {edge["target"] for edge in edges}
    entries = [n["id"] for n in nodes if n["id"] not in targets]
    if not entries:
        raise GraphValidationError("No entry node - the graph has a cycle.")
    return entries


def _wrap_handler(node: dict[str, Any], run_id: str):
    node_id = node["id"]
    node_type = node["type"]
    config = node.get("data", {}).get("config", {})
    handler = NODE_HANDLERS[node_type]

    async def run(state: GraphState) -> dict[str, Any]:
        await _emit(run_id, node_id, "node_start", {"type": node_type})
        started = time.monotonic()
        try:
            update = await run_with_retry(handler, state, config, node_id)
        except GraphBubbleUp:
            raise
        except Exception as exc:
            await _emit(run_id, node_id, "node_error", {"error": str(exc)})
            log.error("node.error", node_id=node_id, error=str(exc))
            raise NodeExecutionError(node_id, str(exc)) from exc
        duration = int((time.monotonic() - started) * 1000)
        await _emit(
            run_id, node_id, "node_finish", _summarize(update), duration_ms=duration
        )
        return update

    return run


_DEGRADED_MARKERS = ("[error]", "[search", "[llm unavailable", "unavailable", "circuit open")


def _looks_degraded(value: Any) -> bool:
    text = ""
    if isinstance(value, str):
        text = value
    elif isinstance(value, dict):
        text = str(value.get("text", ""))
    text = text.lower()
    return any(marker in text for marker in _DEGRADED_MARKERS)


def _summarize(update: dict[str, Any]) -> dict[str, Any]:
    vars_update = update.get("vars", {})
    preview = {k: str(v)[:200] for k, v in vars_update.items()}
    degraded = any(_looks_degraded(v) for v in vars_update.values())
    return {"vars": preview, "branch": update.get("branch"), "degraded": degraded}


async def _emit(
    run_id: str,
    node_id: str,
    event_type: str,
    payload: dict[str, Any],
    duration_ms: int | None = None,
) -> None:
    await manager.broadcast(
        run_id,
        {"nodeId": node_id, "type": event_type, "payload": payload},
    )
    await repo.append_event(
        run_id, node_id, event_type, payload=payload, duration_ms=duration_ms
    )


def _is_executable(node: dict) -> bool:
    if node.get("type") == "note":
        return False
    return not node.get("data", {}).get("disabled", False)


def _bridge_disabled(nodes: list[dict], edges: list[dict]) -> tuple[list[dict], list[dict]]:
    executable = [n for n in nodes if _is_executable(n)]
    executable_ids = {n["id"] for n in executable}
    skipped = {n["id"] for n in nodes if n["id"] not in executable_ids}

    incoming = {n["id"]: [] for n in nodes}
    outgoing = {n["id"]: [] for n in nodes}
    for edge in edges:
        if edge["source"] in incoming and edge["target"] in incoming:
            outgoing[edge["source"]].append(edge["target"])
            incoming[edge["target"]].append(edge["source"])

    bridged: list[dict] = []
    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        if src in skipped or tgt in skipped:
            continue
        bridged.append(edge)

    for node_id in skipped:
        for src in incoming.get(node_id, []):
            for tgt in outgoing.get(node_id, []):
                if src in executable_ids and tgt in executable_ids:
                    bridged.append({"id": f"bridge_{src}_{tgt}", "source": src, "target": tgt})

    return executable, bridged


def build_graph(workflow_graph: dict[str, Any], run_id: str, checkpointer):
    raw_nodes = workflow_graph.get("nodes", [])
    raw_edges = workflow_graph.get("edges", [])
    nodes, edges = _bridge_disabled(raw_nodes, raw_edges)
    if not nodes:
        raise GraphValidationError("Workflow has no nodes.")

    builder = StateGraph(GraphState)
    node_ids = {n["id"] for n in nodes}

    for node in nodes:
        if node["type"] not in NODE_HANDLERS:
            raise GraphValidationError(f"Unknown node type: {node['type']}")
        builder.add_node(node["id"], _wrap_handler(node, run_id))

    for entry in _entry_nodes(nodes, edges):
        builder.add_edge(START, entry)

    outgoing: dict[str, list[dict]] = {n["id"]: [] for n in nodes}
    for edge in edges:
        if edge["source"] in node_ids and edge["target"] in node_ids:
            outgoing[edge["source"]].append(edge)

    for node in nodes:
        node_id = node["id"]
        node_edges = outgoing[node_id]
        if not node_edges:
            builder.add_edge(node_id, END)
        elif node["type"] in BRANCHING_TYPES:
            _add_branch(builder, node_id, node_edges)
        else:
            for edge in node_edges:
                builder.add_edge(node_id, edge["target"])

    return builder.compile(checkpointer=checkpointer)


def _add_branch(builder: StateGraph, node_id: str, node_edges: list[dict]) -> None:
    routes = {
        (edge.get("sourceHandle") or "true"): edge["target"] for edge in node_edges
    }

    def route(state: GraphState) -> str:
        branch = state.get("branch", "true")
        return branch if branch in routes else END

    builder.add_conditional_edges(
        node_id,
        route,
        {**routes, END: END},
    )
