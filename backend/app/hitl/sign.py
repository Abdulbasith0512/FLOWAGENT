"""HMAC-signed, expiring, single-use tokens for approval links."""

from __future__ import annotations

import base64
import hashlib
import hmac
import time

from app.settings import get_settings


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _sign(payload: str) -> str:
    secret = get_settings().hmac_secret.encode()
    digest = hmac.new(secret, payload.encode(), hashlib.sha256).digest()
    return _b64encode(digest)


def make_token(run_id: str, decision: str, ttl_seconds: int) -> str:
    expires = int(time.time()) + ttl_seconds
    payload = f"{run_id}:{decision}:{expires}"
    return f"{_b64encode(payload.encode())}.{_sign(payload)}"


def verify_token(token: str) -> tuple[str, str] | None:
    try:
        encoded_payload, signature = token.split(".", 1)
        payload = _b64decode(encoded_payload).decode()
        run_id, decision, expires = payload.split(":")
    except (ValueError, UnicodeDecodeError):
        return None

    if not hmac.compare_digest(signature, _sign(payload)):
        return None
    if int(expires) < int(time.time()):
        return None
    return run_id, decision
