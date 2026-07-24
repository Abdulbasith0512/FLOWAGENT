"""RAG node - stores and retrieves text by embedding similarity."""

from __future__ import annotations

import hashlib
import json
import math
import uuid
from datetime import datetime, timezone
from typing import Any

import litellm
from sqlalchemy import insert, select

from app.db.client import get_engine
from app.db.tables import memories
from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve, write_output
from app.settings import get_settings

log = get_logger("flowagent.node.rag")

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 64


def _fallback_embedding(text: str) -> list[float]:
    vector = [0.0] * EMBED_DIM
    for token in text.lower().split():
        digest = int(hashlib.sha256(token.encode()).hexdigest(), 16)
        vector[digest % EMBED_DIM] += 1.0
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


async def _embed(text: str) -> list[float]:
    settings = get_settings()
    if not settings.openai_api_key:
        return _fallback_embedding(text)
    try:
        response = await litellm.aembedding(
            model=EMBED_MODEL, input=[text], api_key=settings.openai_api_key
        )
        return response.data[0]["embedding"]
    except Exception as exc:
        log.warning("rag.embed_failed", error=str(exc))
        return _fallback_embedding(text)


def _cosine(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    mode = config.get("mode", "retrieve")
    namespace = config.get("namespace", "default")
    user_id = state.get("vars", {}).get("__user_id", "")
    text = resolve(config.get("textTemplate", "{{input}}"), state)

    if mode == "store":
        embedding = await _embed(text)
        stmt = insert(memories).values(
            id=uuid.uuid4(),
            user_id=user_id,
            namespace=namespace,
            content=text,
            embedding=json.dumps(embedding),
            created_at=datetime.now(timezone.utc),
        )
        async with get_engine().begin() as conn:
            await conn.execute(stmt)
        log.info("rag.stored", namespace=namespace)
        return write_output(config, {"stored": True})

    query_embedding = await _embed(text)
    stmt = select(memories.c.content, memories.c.embedding).where(
        memories.c.user_id == user_id, memories.c.namespace == namespace
    )
    async with get_engine().connect() as conn:
        rows = (await conn.execute(stmt)).mappings().all()

    scored = []
    for row in rows:
        if not row["embedding"]:
            continue
        score = _cosine(query_embedding, json.loads(row["embedding"]))
        scored.append((score, row["content"]))
    scored.sort(reverse=True)
    top_k = config.get("topK", 3)
    results = [content for _, content in scored[:top_k]]

    log.info("rag.retrieved", count=len(results))
    return write_output(config, {"matches": results})
