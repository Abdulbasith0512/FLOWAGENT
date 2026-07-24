"""Shared graph state, structured-value resolution, and the node-handler contract."""

from __future__ import annotations

import re
from typing import Annotated, Any, Awaitable, Callable, TypedDict

_TEMPLATE = re.compile(r"\{\{\s*([\w.\[\]]+)\s*\}\}")
_PATH_SEGMENT = re.compile(r"([A-Za-z_][\w]*)|\[(\d+)\]")


def _merge_vars(left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    return {**left, **right}


class GraphState(TypedDict, total=False):
    input: str
    vars: Annotated[dict[str, Any], _merge_vars]
    run_id: str
    branch: str


def _walk_path(path: str, namespace: dict[str, Any]) -> tuple[bool, Any]:
    segments = [
        name or int(index) for name, index in _PATH_SEGMENT.findall(path) if name or index
    ]
    if not segments:
        return False, None

    head = segments[0]
    if head == "state":
        segments = segments[1:]
        if not segments:
            return True, namespace
        head = segments[0]

    if not isinstance(head, str) or head not in namespace:
        return False, None

    current: Any = namespace[head]
    for segment in segments[1:]:
        try:
            if isinstance(segment, int):
                current = current[segment]
            elif isinstance(current, dict):
                current = current[segment]
            else:
                current = getattr(current, segment)
        except (KeyError, IndexError, TypeError, AttributeError):
            return False, None
    return True, current


def resolve_value(template: str, namespace: dict[str, Any]) -> Any:
    """Return the real (possibly non-string) value when template is a single {{path}}."""
    stripped = template.strip()
    single = _TEMPLATE.fullmatch(stripped)
    if single:
        found, value = _walk_path(single.group(1), namespace)
        return value if found else stripped
    return render_template(template, namespace)


def render_template(template: str, namespace: dict[str, Any]) -> str:
    def replace(match: re.Match[str]) -> str:
        found, value = _walk_path(match.group(1), namespace)
        return _stringify(value) if found else match.group(0)

    return _TEMPLATE.sub(replace, template)


def _stringify(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, (dict, list)):
        import json

        return json.dumps(value, ensure_ascii=False, default=str)
    return str(value)


def render_code_template(template: str, namespace: dict[str, Any]) -> str:
    """Substitute {{var}} for code: escape values so they cannot break out of a string literal."""

    def replace(match: re.Match[str]) -> str:
        found, value = _walk_path(match.group(1), namespace)
        if not found:
            return match.group(0)
        text = _stringify(value)
        return text.translate(_CODE_ESCAPES)

    return _TEMPLATE.sub(replace, template)


_CODE_ESCAPES = str.maketrans(
    {"\\": "\\\\", '"': '\\"', "'": "\\'", "\n": "\\n", "\r": "\\r", "\t": "\\t"}
)


NodeHandler = Callable[[GraphState, dict[str, Any]], Awaitable[dict[str, Any]]]
