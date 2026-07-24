"""In-process circuit breaker keyed by endpoint, shared across runs in a process."""

from __future__ import annotations

import time

from app.logging_config import get_logger

log = get_logger("flowagent.circuit")

_FAILURES: dict[str, int] = {}
_OPEN_UNTIL: dict[str, float] = {}

_THRESHOLD = 5
_COOLDOWN = 30.0


def is_open(key: str) -> bool:
    until = _OPEN_UNTIL.get(key, 0)
    if until and time.monotonic() < until:
        return True
    if until and time.monotonic() >= until:
        _OPEN_UNTIL.pop(key, None)
        _FAILURES.pop(key, None)
    return False


def record_success(key: str) -> None:
    _FAILURES.pop(key, None)
    _OPEN_UNTIL.pop(key, None)


def record_failure(key: str) -> None:
    count = _FAILURES.get(key, 0) + 1
    _FAILURES[key] = count
    if count >= _THRESHOLD:
        _OPEN_UNTIL[key] = time.monotonic() + _COOLDOWN
        log.warning("circuit.open", key=key, cooldown=_COOLDOWN)
