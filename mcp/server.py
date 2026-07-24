"""FlowAgent MCP server. Exposes saved workflows as MCP tools over HTTP transport."""

from __future__ import annotations

import asyncio
import json
import os
from contextlib import asynccontextmanager

from fastmcp import FastMCP

from poller import poll_loop
from runner import run_workflow


@asynccontextmanager
async def lifespan(mcp: FastMCP):
    task = asyncio.create_task(poll_loop(mcp))
    try:
        yield
    finally:
        task.cancel()


mcp = FastMCP("flowagent", lifespan=lifespan, on_duplicate="replace")


@mcp.tool
def ping() -> str:
    """Health check - returns 'pong' to confirm the server is up."""
    return "pong"


@mcp.resource("health://status")
async def health() -> str:
    """Reports MCP server health for clients to query before calling tools."""
    tools = await mcp.list_tools()
    return json.dumps({"status": "ok", "tools": len(tools)})


@mcp.tool
async def run_workflows_batch(workflow_id: str, user_id: str, inputs: list[str]) -> str:
    """Runs a workflow once per input and returns all results."""
    results = await asyncio.gather(
        *(run_workflow(workflow_id, user_id, item) for item in inputs)
    )
    return json.dumps(results)


if __name__ == "__main__":
    host = os.environ.get("MCP_HOST", "127.0.0.1")
    port = int(os.environ.get("MCP_PORT", "8001"))
    mcp.run(transport="http", host=host, port=port)
