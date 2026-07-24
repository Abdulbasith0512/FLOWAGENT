"""AES-256-GCM encryption for credentials at rest. Key derived from ENCRYPTION_KEY."""

from __future__ import annotations

import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.settings import get_settings


def _key() -> bytes:
    return hashlib.sha256(get_settings().encryption_key.encode()).digest()


def encrypt(plaintext: str) -> str:
    nonce = os.urandom(12)
    ciphertext = AESGCM(_key()).encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt(token: str) -> str:
    raw = base64.b64decode(token)
    nonce, ciphertext = raw[:12], raw[12:]
    return AESGCM(_key()).decrypt(nonce, ciphertext, None).decode()
