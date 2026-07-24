"""LLM node - calls Claude via LiteLLM."""

from __future__ import annotations

from typing import Any

import litellm

from app.db import repo
from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve, write_output
from app.settings import get_settings

log = get_logger("flowagent.node.llm")


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    llm = get_settings().llm
    prompt = resolve(config.get("promptTemplate", "{{input}}"), state)

    if not llm.enabled:
        log.warning("llm.no_api_key")
        return write_output(config, f"[mock LLM response to: {prompt[:80]}]")

    model = config.get("model") or llm.model
    fallback = config.get("fallbackModel") or llm.fallback_model
    messages = [
        {"role": "system", "content": config.get("systemPrompt", "")},
        {"role": "user", "content": prompt},
    ]

    try:
        response = await litellm.acompletion(
            model=model,
            api_key=llm.api_key,
            messages=messages,
            temperature=config.get("temperature", 0.7),
            max_tokens=config.get("maxTokens", 1024),
            fallbacks=[fallback] if fallback and fallback != model else None,
        )
    except Exception as exc:
        log.warning("llm.failed", error=str(exc))
        return write_output(config, f"[LLM unavailable: {exc}]")

    text = response.choices[0].message.content or ""

    usage = getattr(response, "usage", None)
    prompt_tokens = getattr(usage, "prompt_tokens", 0) or 0
    completion_tokens = getattr(usage, "completion_tokens", 0) or 0
    total_tokens = getattr(usage, "total_tokens", prompt_tokens + completion_tokens) or 0

    try:
        cost = litellm.completion_cost(completion_response=response)
    except Exception:
        cost = 0.0

    run_id = state.get("run_id")
    node_id = config.get("nodeId", "")
    if run_id:
        await repo.append_event(
            run_id,
            node_id,
            "log",
            payload={
                "kind": "usage",
                "model": getattr(response, "model", model),
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "cost_usd": cost,
            },
            cost_usd=cost,
            tokens=total_tokens,
        )

    log.info(
        "llm.done",
        chars=len(text),
        model=getattr(response, "model", model),
        tokens=total_tokens,
        cost_usd=cost,
    )
    return write_output(config, text)
