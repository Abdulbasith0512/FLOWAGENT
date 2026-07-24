"""Shared helpers for node handlers, including runtime credential injection."""

from __future__ import annotations

import contextvars
from typing import Any

from app.graph.state import (
    GraphState,
    render_code_template,
    render_template,
    resolve_value,
)

_credentials: contextvars.ContextVar[dict[str, str]] = contextvars.ContextVar(
    "credentials", default={}
)


def set_credentials(values: dict[str, str]) -> None:
    _credentials.set(values)


def _namespace(state: GraphState) -> dict[str, Any]:
    namespace: dict[str, Any] = {"input": state.get("input", ""), **state.get("vars", {})}
    creds = _credentials.get()
    if creds:
        namespace["credentials"] = creds
    return namespace


def resolve(template: str, state: GraphState) -> str:
    return render_template(template, _namespace(state))


def resolve_code(template: str, state: GraphState) -> str:
    return render_code_template(template, _namespace(state))


def resolve_structured(template: str, state: GraphState) -> Any:
    return resolve_value(template, _namespace(state))


def write_output(config: dict[str, Any], value: Any) -> dict[str, Any]:
    output_var = config.get("outputVar")
    vars_update = {output_var: value} if output_var else {}
    return {"vars": vars_update}
