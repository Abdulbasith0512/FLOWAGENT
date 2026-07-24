"""HTTP node - makes an outbound request with a DNS-rebind-safe SSRF guard."""

from __future__ import annotations

import json
from typing import Any
from urllib.parse import urlparse, urlunparse

import httpx

from app.graph import circuit
from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve, write_output
from app.security.ssrf import BlockedHostError, resolve_safe_ip

log = get_logger("flowagent.node.http")


def _pin_url(url: str, ip: str) -> tuple[str, str]:
    parts = urlparse(url)
    host = parts.hostname or ""
    netloc = f"[{ip}]" if ":" in ip else ip
    if parts.port:
        netloc = f"{netloc}:{parts.port}"
    pinned = urlunparse(parts._replace(netloc=netloc))
    return pinned, host


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    url = resolve(config.get("urlTemplate", ""), state)
    allowlist = config.get("allowedHosts") or None

    try:
        safe_ip = resolve_safe_ip(url, allowlist)
    except BlockedHostError as exc:
        log.warning("http.blocked", url=url, reason=str(exc))
        return write_output(config, f"[error] blocked: {exc}")

    method = config.get("method", "GET")
    headers = json.loads(config.get("headers") or "{}")
    body = resolve(config.get("bodyTemplate", ""), state)

    pinned_url, host = _pin_url(url, safe_ip)
    headers["Host"] = host

    if circuit.is_open(host):
        log.warning("http.circuit_open", host=host)
        return write_output(config, f"[error] circuit open for {host}")

    try:
        async with httpx.AsyncClient(timeout=20, verify=True) as client:
            response = await client.request(
                method,
                pinned_url,
                headers=headers,
                content=body or None,
                extensions={"sni_hostname": host},
            )
    except httpx.HTTPError as exc:
        circuit.record_failure(host)
        log.warning("http.failed", error=str(exc))
        return write_output(config, f"[request failed: {exc}]")

    circuit.record_success(host)
    log.info("http.done", status=response.status_code)
    return write_output(config, response.text[:4000])
