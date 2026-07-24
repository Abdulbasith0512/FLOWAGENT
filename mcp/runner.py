"""Triggers a workflow run on the backend and waits for it to finish."""

from __future__ import annotations

import asyncio

import httpx

from settings import get_settings

TERMINAL = {"done", "error", "paused"}


async def run_workflow(workflow_id: str, user_id: str, input_text: str) -> str:
    base = get_settings().api_internal_url
    async with httpx.AsyncClient(timeout=30) as client:
        started = await client.post(
            f"{base}/run/{workflow_id}",
            json={"input": input_text, "user_id": user_id},
        )
        started.raise_for_status()
        run_id = started.json()["run_id"]

        for _ in range(120):
            await asyncio.sleep(1)
            status = (await client.get(f"{base}/runs/{run_id}")).json()
            if status["status"] in TERMINAL:
                return _format(status)
    return "Workflow timed out."


def _format(status: dict) -> str:
    if status["status"] == "error":
        return f"Workflow failed: {status.get('error')}"
    if status["status"] == "paused":
        return "Workflow paused - waiting for human approval."
    output = status.get("output") or {}
    return str(output.get("vars", output))
