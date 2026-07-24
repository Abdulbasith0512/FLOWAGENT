"""Plain-English run summary and markdown export endpoints."""

from __future__ import annotations

from typing import Any

import litellm
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.db import repo
from app.logging_config import get_logger
from app.settings import get_settings

log = get_logger("flowagent.routes.runs_extra")
router = APIRouter()



def _event_line(event: dict[str, Any]) -> str:
    node = event["node_id"] or "run"
    parts = [f"- **{node}** `{event['type']}`"]
    if event.get("duration_ms") is not None:
        parts.append(f"{event['duration_ms']} ms")
    if event.get("cost_usd") is not None:
        parts.append(f"${event['cost_usd']}")
    if event.get("tokens") is not None:
        parts.append(f"{event['tokens']} tokens")
    return " · ".join(parts)


def _basic_summary(run: dict[str, Any], events: list[dict[str, Any]]) -> str:
    lines = [f"- Run finished with status **{run['status']}**."]
    starts = [e for e in events if e["type"] == "node_start"]
    lines.append(f"- {len(starts)} node(s) executed.")
    errors = [e for e in events if e["type"] == "node_error"]
    if errors:
        lines.append(f"- {len(errors)} node(s) reported errors.")
    if run.get("error"):
        lines.append(f"- Error: {run['error']}")
    lines.append("- See the full event log for per-node detail.")
    return "\n".join(lines)


def _events_log(events: list[dict[str, Any]]) -> str:
    return "\n".join(_event_line(e) for e in events) or "- No events recorded."


@router.get("/runs/{run_id}/summary")
async def run_summary(run_id: str):
    run = await repo.get_run(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    events = await repo.list_events(run_id)

    llm = get_settings().llm
    fallback = _basic_summary(run, events)
    if not llm.enabled:
        return {"run_id": run_id, "summary": fallback}

    prompt = (
        "Summarize this workflow run in exactly 5 markdown bullet points. "
        "Be concise and plain-English. Cover what ran, the outcome, and any errors.\n\n"
        f"Status: {run['status']}\n"
        f"Input: {run.get('input')}\n"
        f"Output: {run.get('output')}\n"
        f"Error: {run.get('error')}\n\n"
        f"Events:\n{_events_log(events)}"
    )

    try:
        response = await litellm.acompletion(
            model=llm.fallback_model,
            api_key=llm.api_key,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=512,
        )
        summary = response.choices[0].message.content or fallback
    except Exception as exc:
        log.warning("summary.failed", run_id=run_id, error=str(exc))
        summary = fallback

    return {"run_id": run_id, "summary": summary}


@router.get("/runs/{run_id}/export", response_class=PlainTextResponse)
async def export_run(run_id: str):
    run = await repo.get_run(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    run_graph = await repo.get_run_graph(run_id)
    name = "Workflow"
    if run_graph and isinstance(run_graph.get("graph"), dict):
        name = run_graph["graph"].get("name", name)

    events = await repo.list_events(run_id)
    lines = [
        f"# {name} - Run {run_id}",
        "",
        f"- Status: {run['status']}",
        f"- Input: {run.get('input')}",
        f"- Output: {run.get('output')}",
    ]
    if run.get("error"):
        lines.append(f"- Error: {run['error']}")
    if run.get("cost_usd") is not None:
        lines.append(f"- Cost: ${run['cost_usd']}")
    if run.get("tokens_total") is not None:
        lines.append(f"- Tokens: {run['tokens_total']}")
    lines += ["", "## Events", "", _events_log(events), ""]

    markdown = "\n".join(lines)
    headers = {"Content-Disposition": f'attachment; filename="run-{run_id}.md"'}
    return PlainTextResponse(markdown, media_type="text/markdown", headers=headers)
