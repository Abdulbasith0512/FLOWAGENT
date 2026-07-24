"""Sanitizes tool descriptions to blunt MCP tool-poisoning (CVE-2025-54136)."""

from __future__ import annotations

import re

MAX_DESCRIPTION_LENGTH = 400

_INJECTION_PATTERNS = [
    re.compile(r"ignore (all |the )?(previous|prior|above) (instructions|prompts?)", re.I),
    re.compile(r"disregard (all |the )?(previous|prior|above)", re.I),
    re.compile(r"you (must|should|will|have to) (now|always|never)", re.I),
    re.compile(r"system prompt", re.I),
    re.compile(r"<\s*/?\s*(system|instructions?|important)\s*>", re.I),
    re.compile(r"do not (tell|inform|reveal|mention)", re.I),
]


def sanitize_description(description: str) -> str:
    cleaned = description or ""
    for pattern in _INJECTION_PATTERNS:
        cleaned = pattern.sub("[redacted]", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:MAX_DESCRIPTION_LENGTH]
