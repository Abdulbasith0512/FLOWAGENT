---
name: flowagent
description: Run FlowAgent workflows as tools. Use when the user asks to trigger a saved FlowAgent workflow by name, or to run an agent workflow built on the FlowAgent canvas.
---

# FlowAgent

FlowAgent exposes every published workflow as an MCP tool named `run_workflow_<slug>`.

## Running a workflow

Connect to the FlowAgent MCP server (default `http://localhost:8001/mcp`) and call the tool:

```
run_workflow_<slug>(input="<your input>")
```

The tool runs the workflow on the FlowAgent engine and returns its output. A workflow that pauses for human approval returns "Workflow paused" until the approver clicks the emailed link.

## Discovering workflows

List the available tools on the MCP server. Each `run_workflow_*` tool maps to one published workflow; its description explains what it does and when to use it.

## Notes

- Only published workflows are exposed. A draft must be published in the FlowAgent UI first.
- Batch mode: `run_workflows_batch(workflow_id, user_id, inputs=[...])` runs one workflow over many inputs in parallel.
