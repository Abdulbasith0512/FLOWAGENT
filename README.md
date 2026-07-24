# FlowAgent

FlowAgent is a visual builder for AI workflows. You can drag nodes onto a canvas, connect them, run them, and publish them as MCP tools. The platform turns a visual workflow into a live LangGraph execution graph at runtime, so you can build agentic apps without writing a full orchestration layer by hand.

<img width="1519" height="877" alt="image" src="https://github.com/user-attachments/assets/37805260-1e80-4a6e-9f3a-78940c405b7b" />

## Why FlowAgent?

FlowAgent combines three things in one experience:

- a visual workflow canvas for designing agent logic
- a durable execution engine for running those workflows safely
- a publishing layer that turns every workflow into an MCP tool for clients like Claude Desktop

## What it can do

- turns a React Flow canvas into a real LangGraph state machine at runtime
- streams node status to the canvas over WebSockets while a run is in progress
- runs durably on a Redis-backed queue, so restarts do not lose in-flight work
- pauses on human-approval steps and resumes from checkpoints
- publishes workflows as MCP tools automatically
- supports sandboxed code execution, secure HTTP calls, retries, and observability

## Demo

[![watch the demo](https://img.youtube.com/vi/lo2CjSAurz4/maxresdefault.jpg)](https://youtu.be/lo2CjSAurz4)

## Architecture at a glance

This repository is organized into three services:

- `web/` — Next.js app with the visual canvas, authentication, workspace tools, and run UI (port 3000)
- `backend/` — FastAPI + LangGraph execution engine, queue workers, and runtime orchestration (port 8000)
- `mcp/` — FastMCP server that exposes published workflows as tools (port 8001)

The web app stores workflow definitions in Postgres. The backend reads them, builds the graph, executes it in a worker, and streams events over Redis pub/sub. The MCP server polls the same database and exposes each published workflow as a tool that calls the backend.

## Supported node types

| Node | What it does |
|---|---|
| `llm` | calls an LLM through LiteLLM, with fallback model support and cost tracking |
| `search` | performs web search via Tavily |
| `code` | runs Python inside a locked-down Docker sandbox |
| `http` | makes outbound requests with SSRF protection and circuit-breaker logic |
| `email` | sends mail via Resend |
| `condition` | branches on a safe expression, including single or multi-branch flow |
| `human approve` | pauses for a signed approval step and resumes from a checkpoint |
| `sub-workflow` | runs another saved workflow and returns its output |
| `loop` | maps a workflow over each item in a list |
| `merge` | combines outputs from several upstream nodes |
| `delay` | waits for a number of seconds |
| `transform` | reshapes data with a sandboxed Jinja template |
| `memory` | stores and retrieves text using embedding similarity |
| `trigger` | starts a run from cron, signed webhook, or MCP call |

Template interpolation works anywhere in the graph. For example, `{{var}}` pulls output from an upstream node, and nested paths such as `{{state.search.results[0].title}}` are also supported.

## Key product capabilities

- **Credentials**: encrypted AES-256-GCM storage for secrets, with runtime injection through `{{credentials.slug}}`
- **Teams and RBAC**: workspaces with owner/admin/editor/viewer roles, per-workflow permissions, and comments
- **Reliability**: per-node retries, dead-letter queues, idempotency keys, and result caching
- **Observability**: per-run cost rollup, analytics, budget caps, and full run history
- **Honest run state**: fallback degradations show as warnings instead of false success
- **MCP integration**: sanitized tool descriptions, usage analytics, a health resource, batch mode, and a playground
- **Canvas experience**: keyboard shortcuts, command palette, undo/redo, context menus, sticky notes, DAG auto-layout, search, labels, and an inspector/history sidebar
- **Onboarding**: natural-language workflow generation and starter templates

## Quick start

### Prerequisites

- Node.js 20+
- Python 3.12+
- pnpm
- Docker
- uv

### Local development

```bash
corepack enable --install-directory ~/.corepack-bin pnpm   # if pnpm is not installed

pnpm install
(cd backend && uv sync) && (cd mcp && uv sync)

cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm dev
```

Only the database URL and one LLM provider key are required to get started. The app uses LiteLLM, so you can use Anthropic directly or set `GROQ_API_KEY` for a free provider fallback. Missing optional integrations degrade gracefully:

- no Redis means in-memory checkpoints and in-process execution
- no Tavily or Resend key returns a labeled mock
- no Docker means the code node falls back to a restricted subprocess

Then open http://localhost:3000, sign up, build a workflow, and run it.

### Claude Desktop

Publish a workflow, then add this to `claude_desktop_config.json` so it appears as a `run_workflow_<slug>` tool:

```json
{
  "mcpServers": {
    "flowagent": {
      "url": "http://localhost:8001/mcp"
    }
  }
}
```

## Project structure

```text
backend/   # execution engine, graph builder, queue worker, routes
mcp/        # MCP server and tool publishing layer
web/        # Next.js frontend and workflow canvas
```

## What makes this project interesting

- **A visual canvas compiled to a real agent at runtime**: the JSON created on the canvas becomes a LangGraph `StateGraph` with nodes mapped to handlers and edges wired into control flow.
- **Durable execution**: runs execute on an ARQ + Redis worker so a restart mid-run resumes from a LangGraph checkpoint.
- **Live updates across processes**: worker events are streamed over Redis pub/sub and reflected in the web UI with reconnect handling.
- **Secure execution**: the code node runs in a locked-down Docker sandbox, HTTP requests are protected against DNS rebinding, and credentials are encrypted and injected at runtime.
- **Multi-tenant workflows**: the app includes workspaces, RBAC, comments, and per-workflow access control.
- **Workflow-as-tool publishing**: every published workflow becomes an MCP tool with a sanitized description and analytics.
- **Natural-language workflow generation**: a plain-English description can be converted into a graph that validates against the same schema used by the canvas.

Built with a three-service architecture, a dual-language schema layer, graceful degradation when keys are missing, and a local-first setup that can run with Docker Postgres and Redis.

## Contributing

Contributions are welcome. If you want to improve the product, add a new node, strengthen security, or improve the UI, feel free to open a pull request.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for setup steps, guidelines, and contribution expectations.


## Project links

- [Roadmap](docs/roadmap.md)
- [Architecture overview](docs/architecture-overview.md)
- [Getting started](docs/getting-started.md)
