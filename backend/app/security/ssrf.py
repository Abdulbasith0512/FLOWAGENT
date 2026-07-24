"""SSRF guard: resolve a host, reject internal IPs, and pin the validated IP.

Pinning the resolved IP onto the connection defeats DNS rebinding, where a host
resolves to a public IP during the check and to an internal IP at connect time.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse


class BlockedHostError(Exception):
    pass


def _ip_is_internal(ip: str) -> bool:
    addr = ipaddress.ip_address(ip)
    return (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_reserved
        or addr.is_multicast
        or addr.is_unspecified
    )


def resolve_safe_ip(url: str, allowlist: list[str] | None = None) -> str:
    host = urlparse(url).hostname
    if not host:
        raise BlockedHostError("missing host")

    if allowlist is not None and host not in allowlist:
        raise BlockedHostError(f"host {host} not in allowlist")

    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise BlockedHostError(f"cannot resolve {host}") from exc

    chosen: str | None = None
    for info in infos:
        ip = info[4][0]
        if _ip_is_internal(ip):
            raise BlockedHostError(f"{host} resolves to internal address {ip}")
        chosen = chosen or ip

    if chosen is None:
        raise BlockedHostError(f"no address for {host}")
    return chosen
