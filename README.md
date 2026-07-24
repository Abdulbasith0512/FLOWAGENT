# flowagent

a visual builder for ai workflows. drag nodes onto a canvas, wire them up, hit run, and watch each node light up live as it executes. every workflow you publish becomes an mcp tool, so claude desktop can run it by name.
<img width="1519" height="877" alt="image" src="https://github.com/user-attachments/assets/37805260-1e80-4a6e-9f3a-78940c405b7b" />


## what it does

- turns a react flow canvas into a real langgraph state machine at runtime
- streams node status to the canvas over a websocket while it runs, with reconnect and heartbeat
- runs durably on a redis-backed queue, so a server restart mid-run does not lose work
- registers every published workflow as an mcp tool automatically
- pauses on a human-approve node, emails a signed approve/deny link, resumes from a checkpoint when you click

## demo

[![watch the demo](https://img.youtube.com/vi/lo2CjSAurz4/maxresdefault.jpg)](https://youtu.be/lo2CjSAurz4)

## how it's put together

three services in one repo:

- `web/` - next.js 16, react flow, tailwind v4, drizzle, better auth (port 3000)
- `backend/` - fastapi, langgraph, litellm, arq worker (port 8000)
- `mcp/` - fastmcp server (port 8001)

the web app writes workflows to postgres. the backend reads them, builds the graph, runs it on a queue worker, and streams events over redis pub/sub. the mcp server polls the same db and exposes each published workflow as a tool that calls the backend.

## nodes

| node | what it does |
|---|---|
| llm | calls claude via litellm, with a fallback model and cost tracking |
| search | web search via tavily |
| code | runs python in a locked-down docker sandbox (no network, read-only, dropped caps) |
| http | outbound request with a dns-rebind-safe ssrf guard and circuit breaker |
| email | sends mail via resend |
| condition | branches on a safe expression, single or multi-branch switch |
| human approve | pauses for a signed email approval, resumes from a checkpoint |
| sub-workflow | runs another saved workflow and returns its output |
| loop | maps a workflow over each item of a list |
| merge | combines outputs from several upstream nodes |
| delay | waits a number of seconds |
| transform | reshapes data with a sandboxed jinja template |
| memory | stores and retrieves text by embedding similarity |
| trigger | starts a run on cron, a signed webhook, or an mcp call |

`{{var}}` in any field pulls in output from an upstream node. structured paths work too: `{{state.search.results[0].title}}`.

## what else is in here

- **credentials**: an encrypted (aes-256-gcm) store; reference secrets as `{{credentials.slug}}` without putting them in the graph. oauth connect for google, github, and slack.
- **teams**: workspaces with owner/admin/editor/viewer roles, per-workflow permissions, and comments.
- **reliability**: per-node retry, dead-letter queue, idempotency keys, result caching.
- **observability**: per-run cost rollup, an analytics dashboard, monthly budget caps that block a run when exceeded, and a run history panel that keeps every past run with its status, cost, and output.
- **honest run state**: nodes that degrade to a fallback show as a warning, not a false success, and the failing value is surfaced in red so you always know what actually happened.
- **mcp**: a tool description sanitizer, usage analytics, a health resource, batch mode, and a playground to test a tool without claude desktop, with a hub to switch between all your published tools.
- **canvas**: keyboard shortcuts, a command palette (cmd+k), undo/redo, a context menu, sticky notes, dagre auto-layout, search (cmd+f), color labels, and an inspector/output/history tabbed sidebar.
- **onboarding**: describe a workflow in plain english and claude generates the graph, a getting-started checklist, and a starter template library.

## running it

```bash
corepack enable --install-directory ~/.corepack-bin pnpm   # if you don't have pnpm

pnpm install
(cd backend && uv sync) && (cd mcp && uv sync)

cp .env.example .env          # set DATABASE_URL and ANTHROPIC_API_KEY
pnpm db:up                    # local postgres + redis in docker
pnpm db:migrate
pnpm dev                      # web, backend, worker, mcp
```

only the db url and one llm key are needed. it runs through litellm, so you can use anthropic, or set `GROQ_API_KEY` for a free provider (groq llama) and it takes over automatically. missing keys fall back gracefully: no redis means in-memory checkpoints and in-process execution, no tavily/resend key returns a labeled mock, no docker means the code node uses a restricted subprocess.

then open localhost:3000, sign up, build a workflow, and run it.

### claude desktop

publish a workflow, then add this to `claude_desktop_config.json` and it shows up as a `run_workflow_<slug>` tool:

```json
{ "mcpServers": { "flowagent": { "url": "http://localhost:8001/mcp" } } }
```

## engineering worth a look

the parts i am most proud of, and what each one demonstrates:

- **a visual canvas compiled to a real agent at runtime** (`backend/app/graph/builder.py`). the json a user draws becomes a langgraph `StateGraph`: nodes map to handlers, edges wire control flow, fan-in and controlled loops are supported, and disabled or note nodes are bridged out before compile. the drawing is the program.

- **durable execution, not fire-and-forget** (`backend/app/queue`, `backend/app/graph/retry.py`). runs execute on an arq + redis worker so a server restart mid-run resumes from a langgraph checkpoint. per-node retry with backoff, a circuit breaker, an llm fallback model, idempotency keys, a dead-letter queue, and node-output caching round it out.

- **cross-process live updates** (`backend/app/ws/manager.py`, `web/src/lib/ws/use-run-socket.ts`). a worker emits events to redis pub/sub; the web tier subscribes and fans them to browser sockets. the client reconnects with an event cursor and a heartbeat, so no events are missed or duplicated.

- **a structured state engine with safe interpolation** (`backend/app/graph/state.py`). `{{state.search.results[0].title}}` resolves nested paths and array indexes against real typed values, with a schema-version migration path so older saved graphs upgrade on load.

- **security taken seriously**: the code node runs in a locked-down docker sandbox (no network, read-only root, dropped caps, memory and pid limits); the http node pins the resolved ip to defeat dns rebinding; mcp tool descriptions are sanitized against the tool-poisoning class of attack (cve-2025-54136); credentials are aes-256-gcm encrypted and injected only at runtime, never persisted to logs or events.

- **a workspace + rbac retrofit done atomically** (`web/src/lib/workspace/rbac.ts`). adding multi-tenant teams to a live schema meant one migration that backfills a personal workspace per user and assigns every existing row, plus an access check on every query. owner / admin / editor / viewer roles, per-workflow overrides, and comments.

- **every workflow is an mcp tool** (`mcp/`). a poller turns each published workflow into a `run_workflow_<slug>` tool with a sanitized description, usage analytics, a health resource, batch mode, and a playground to test it without claude desktop.

- **describe it, get a workflow** (`backend/app/routes/generate.py`). a plain-english description goes to claude and comes back as a graph that validates against the same zod schema the canvas uses, then opens on the canvas ready to run.

built across three languages and three services with a dual-language schema (drizzle owns migrations, sqlalchemy mirrors them), graceful degradation when keys are missing, and a $0 local stack (docker postgres + redis, no paid services).
