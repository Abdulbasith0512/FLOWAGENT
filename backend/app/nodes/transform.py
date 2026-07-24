"""Transform node - reshapes structured state with a sandboxed Jinja2 template."""

from __future__ import annotations

from typing import Any

from jinja2.sandbox import SandboxedEnvironment

from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import write_output

log = get_logger("flowagent.node.transform")

_env = SandboxedEnvironment(autoescape=False)


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    template_str = config.get("template", "{{ input }}")
    namespace = {"input": state.get("input", ""), **state.get("vars", {})}

    try:
        rendered = _env.from_string(template_str).render(**namespace)
    except Exception as exc:
        log.warning("transform.error", error=str(exc))
        return write_output(config, f"[transform error: {exc}]")

    log.info("transform.done")
    return write_output(config, rendered)
