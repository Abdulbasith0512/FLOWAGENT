"""Workflow graph schema migrations, applied on load so older saved graphs upgrade."""

from __future__ import annotations

from typing import Any, Callable

CURRENT_SCHEMA_VERSION = 2

Migration = Callable[[dict[str, Any]], dict[str, Any]]


def _v1_to_v2(graph: dict[str, Any]) -> dict[str, Any]:
    return graph


_MIGRATIONS: dict[int, Migration] = {1: _v1_to_v2}


def migrate_graph(graph: dict[str, Any], from_version: int) -> tuple[dict[str, Any], int]:
    current = graph
    version = from_version
    while version < CURRENT_SCHEMA_VERSION:
        migration = _MIGRATIONS.get(version)
        if migration is None:
            break
        current = migration(current)
        version += 1
    return current, version
