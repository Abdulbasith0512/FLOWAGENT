"""Generates a workflow graph from a natural-language description via Claude."""

from __future__ import annotations

import json

import litellm
from fastapi import APIRouter
from pydantic import BaseModel

from app.graph.registry import NODE_HANDLERS
from app.logging_config import get_logger
from app.settings import get_settings

log = get_logger("flowagent.routes.generate")
router = APIRouter()

_SYSTEM = """You design FlowAgent workflow graphs. Output ONLY valid JSON with this shape:
{"nodes":[{"id":"n1","type":"<type>","position":{"x":0,"y":0},"data":{"config":{...}}}],"edges":[{"id":"e1","source":"n1","target":"n2"}]}
Available node types: %s.
Common configs: llm {systemPrompt,promptTemplate,outputVar}; search {queryTemplate,outputVar}; code {code,outputVar}; http {method,urlTemplate,outputVar}; email {to,subject,bodyTemplate}; condition {expression}; approve {approverEmail,message}; transform {template,outputVar}.
Reference upstream output with {{outputVar}} or {{input}}. Lay nodes left to right (x increments of 280). Keep it minimal and runnable.""" % ", ".join(sorted(NODE_HANDLERS))


class GenerateRequest(BaseModel):
    description: str


@router.post("/generate")
async def generate(body: GenerateRequest):
    llm = get_settings().llm
    if not llm.enabled:
        return {"graph": {"nodes": [], "edges": []}, "error": "no_api_key"}

    try:
        response = await litellm.acompletion(
            model=llm.model,
            api_key=llm.api_key,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": body.description},
            ],
            temperature=0,
            max_tokens=2000,
        )
        text = response.choices[0].message.content or "{}"
        start = text.find("{")
        end = text.rfind("}")
        graph = json.loads(text[start : end + 1])
        log.info("generate.done", nodes=len(graph.get("nodes", [])))
        return {"graph": graph}
    except Exception as exc:
        log.warning("generate.failed", error=str(exc))
        return {"graph": {"nodes": [], "edges": []}, "error": str(exc)}
