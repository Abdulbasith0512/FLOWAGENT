"""HMAC signing/verification for outbound and inbound webhook payloads."""

from __future__ import annotations

import hashlib
import hmac
import time

from app.settings import get_settings

SIGNATURE_HEADER = "X-FlowAgent-Signature"
TIMESTAMP_HEADER = "X-FlowAgent-Timestamp"


def _secret(override: str | None) -> bytes:
    return (override or get_settings().hmac_secret).encode()


def sign_payload(body: bytes, secret: str | None = None) -> dict[str, str]:
    timestamp = str(int(time.time()))
    signed = timestamp.encode() + b"." + body
    digest = hmac.new(_secret(secret), signed, hashlib.sha256).hexdigest()
    return {SIGNATURE_HEADER: digest, TIMESTAMP_HEADER: timestamp}


def verify_signature(
    body: bytes,
    signature: str,
    timestamp: str,
    secret: str | None = None,
    max_age_seconds: int = 300,
) -> bool:
    try:
        if abs(int(time.time()) - int(timestamp)) > max_age_seconds:
            return False
    except ValueError:
        return False
    signed = timestamp.encode() + b"." + body
    expected = hmac.new(_secret(secret), signed, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
