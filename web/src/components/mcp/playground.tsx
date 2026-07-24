"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Copy, Check, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isErrorValue } from "@/components/canvas/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type RunState =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "paused"; runId: string }
  | { phase: "error"; message: string }
  | { phase: "done"; vars: Record<string, unknown>; status: string };

export function Playground({
  workflowId,
  name,
  toolName,
  usesInput = true,
}: {
  workflowId: string;
  name: string;
  toolName: string;
  usesInput?: boolean;
}) {
  return (
    <div>
      <Link
        href={`/app/${workflowId}`}
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={14} /> Back to canvas
      </Link>
      <p className="mt-8 text-xs font-medium uppercase tracking-wider text-accent">
        MCP Playground
      </p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">{name}</h1>
      <div className="mt-6">
        <PlaygroundRunner
          workflowId={workflowId}
          name={name}
          toolName={toolName}
          usesInput={usesInput}
        />
      </div>
    </div>
  );
}

export function PlaygroundRunner({
  workflowId,
  toolName,
  usesInput = true,
}: {
  workflowId: string;
  name: string;
  toolName: string;
  usesInput?: boolean;
}) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<RunState>({ phase: "idle" });
  const [copied, setCopied] = useState(false);

  function copyToolName() {
    navigator.clipboard.writeText(toolName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function run() {
    setState({ phase: "running" });
    try {
      const started = await fetch(`${API_URL}/run/${workflowId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!started.ok) {
        setState({ phase: "error", message: `Could not start run (${started.status}).` });
        return;
      }
      const { run_id } = await started.json();
      await poll(run_id);
    } catch (e) {
      setState({ phase: "error", message: String(e) });
    }
  }

  async function poll(runId: string) {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const status = await (await fetch(`${API_URL}/runs/${runId}`)).json();
      if (status.status === "error") {
        setState({ phase: "error", message: status.error ?? "The run failed." });
        return;
      }
      if (status.status === "paused") {
        setState({ phase: "paused", runId });
        return;
      }
      if (status.status === "done") {
        const vars =
          (status.output?.vars as Record<string, unknown>) ?? status.output ?? {};
        setState({ phase: "done", vars, status: status.status });
        return;
      }
    }
    setState({ phase: "error", message: "Timed out waiting for the run." });
  }

  async function decide(runId: string, decision: "approved" | "denied") {
    setState({ phase: "running" });
    await fetch(`${API_URL}/runs/${runId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    await poll(runId);
  }

  return (
    <div>
      <button
        onClick={copyToolName}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        {toolName}
        {copied ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
      </button>

      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-fg-muted">Input</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Passed to the workflow as {{input}}"
          />
        </label>
        {!usesInput && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-fg-muted">
            <AlertTriangle size={12} className="mt-0.5 shrink-0 text-accent" />
            This workflow doesn&apos;t reference{" "}
            <code className="font-mono text-accent">{"{{input}}"}</code>, so your text
            won&apos;t change the result.
          </p>
        )}
        <Button className="mt-4" onClick={run} disabled={state.phase === "running"}>
          <Play size={14} />
          {state.phase === "running" ? "Running…" : "Run tool"}
        </Button>
      </div>

      <Result state={state} onDecide={decide} />
    </div>
  );
}

function Result({
  state,
  onDecide,
}: {
  state: RunState;
  onDecide: (runId: string, decision: "approved" | "denied") => void;
}) {
  if (state.phase === "idle") return null;

  if (state.phase === "paused") {
    return (
      <div className="mt-4 rounded-xl border border-run/40 bg-run/5 p-5">
        <p className="text-sm font-medium text-fg">Waiting for approval</p>
        <p className="mt-1 text-xs text-fg-muted">
          This workflow paused at a human-approve step.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onDecide(state.runId, "approved")}
            className="rounded-md bg-ok px-3 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90"
          >
            Approve
          </button>
          <button
            onClick={() => onDecide(state.runId, "denied")}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-err/50 hover:text-err"
          >
            Deny
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "running") {
    return (
      <div className="mt-4 rounded-xl border border-border bg-surface p-5 text-sm text-fg-muted">
        Running the workflow…
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="mt-4 rounded-xl border border-err/40 bg-err/5 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-err">
          <AlertTriangle size={15} /> Run failed
        </div>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-err/90">
          {state.message}
        </pre>
      </div>
    );
  }

  const entries = Object.entries(state.vars).filter(([k]) => !k.startsWith("__"));
  const anyError = entries.some(([, v]) => isErrorValue(v));

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-5">
      <div
        className={`flex items-center gap-2 text-sm font-medium ${anyError ? "text-accent" : "text-ok"}`}
      >
        {anyError ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
        {anyError ? "Finished with warnings" : "Success"}
      </div>
      <div className="mt-3 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-fg-muted">This run produced no output.</p>
        ) : (
          entries.map(([key, value]) => (
            <OutputField key={key} name={key} value={value} />
          ))
        )}
      </div>
    </div>
  );
}

function OutputField({ name, value }: { name: string; value: unknown }) {
  const isError = isErrorValue(value);
  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <div>
      <span className="font-mono text-xs text-accent">{name}</span>
      <pre
        className={`mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-md border px-3 py-2 font-mono text-xs ${
          isError
            ? "border-err/30 bg-err/5 text-err/90"
            : "border-border bg-bg text-fg"
        }`}
      >
        {text}
      </pre>
    </div>
  );
}
