"""WorkflowRunner abstraction so the execution backend (in-process now, queue later) is swappable."""

from __future__ import annotations

from typing import Any, Protocol

from app.graph import executor


class WorkflowRunner(Protocol):
    async def start_run(
        self, run_id: str, workflow_graph: dict[str, Any], input_text: str
    ) -> None: ...

    async def resume_run(
        self, run_id: str, workflow_graph: dict[str, Any], decision: str
    ) -> None: ...


class InProcessRunner:
    async def start_run(
        self, run_id: str, workflow_graph: dict[str, Any], input_text: str
    ) -> None:
        await executor.start_run(run_id, workflow_graph, input_text)

    async def resume_run(
        self, run_id: str, workflow_graph: dict[str, Any], decision: str
    ) -> None:
        await executor.resume_run(run_id, workflow_graph, decision)


def get_runner() -> WorkflowRunner:
    return InProcessRunner()
