"""Search node - web search via Tavily."""

from __future__ import annotations

from typing import Any

import hashlib

from app.db import repo
from app.graph import circuit
from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve, write_output
from app.settings import get_settings

log = get_logger("flowagent.node.search")


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    query = resolve(config.get("queryTemplate", "{{input}}"), state)
    max_results = config.get("maxResults", 5)

    cache_ttl = int(config.get("cacheTtl", 0))
    cache_key = None
    if cache_ttl > 0:
        raw = f"search:{query}:{max_results}:{config.get('searchDepth', 'basic')}"
        cache_key = hashlib.sha256(raw.encode()).hexdigest()
        cached = await repo.get_cached_output(cache_key)
        if cached is not None:
            log.info("search.cache_hit")
            return write_output(config, cached)

    if not settings.search_enabled:
        log.warning("search.no_api_key")
        return write_output(
            config,
            {"text": f"[mock search results for: {query}] (set TAVILY_API_KEY)", "results": []},
        )

    if circuit.is_open("tavily"):
        log.warning("search.circuit_open")
        return write_output(config, {"text": "[search circuit open]", "results": []})

    from tavily import AsyncTavilyClient

    try:
        client = AsyncTavilyClient(api_key=settings.tavily_api_key)
        result = await client.search(
            query,
            max_results=max_results,
            search_depth=config.get("searchDepth", "basic"),
        )
    except Exception as exc:
        circuit.record_failure("tavily")
        log.warning("search.failed", error=str(exc))
        return write_output(config, {"text": f"[search unavailable: {exc}]", "results": []})

    circuit.record_success("tavily")
    results = result.get("results", [])
    text = "\n".join(f"- {item['title']}: {item['content']}" for item in results)
    output = {"text": text, "results": results}
    if cache_key:
        await repo.set_cached_output(cache_key, output, cache_ttl)
    log.info("search.done", results=len(results))
    return write_output(config, output)
