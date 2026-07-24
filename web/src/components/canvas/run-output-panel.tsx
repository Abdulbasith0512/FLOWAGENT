"use client";

import { useState } from "react";
import { isErrorValue } from "./ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Status = "idle" | "running" | "paused" | "done" | "error";

interface Props {
  vars: Record<string, unknown>;
  status?: Status;
  error?: string | null;
  runId?: string | null;
}

export function RunOutputPanel({
  vars,
  status = "done",
  error = null,
  runId = null,
}: Props) {
  const entries = Object.entries(vars).filter(([k]) => !k.startsWith("__"));

  return (
    <div className="space-y-2 p-4">
      {status === "error" && error && (
        <p className="rounded-md border border-err/40 bg-err/10 px-3 py-2 text-xs text-err">
          {error}
        </p>
      )}
      {status === "paused" && <ApprovalGate runId={runId} />}
      {entries.length === 0 ? (
        <p className="text-sm text-fg-muted">
          {status === "running"
            ? "Running… node outputs will appear here."
            : "This run produced no output."}
        </p>
      ) : (
        entries.map(([key, value]) => (
          <OutputEntry key={key} name={key} value={value} />
        ))
      )}
    </div>
  );
}

function ApprovalGate({ runId }: { runId: string | null }) {
  const [pending, setPending] = useState<"approved" | "denied" | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function decide(decision: "approved" | "denied") {
    if (!runId) return;
    setPending(decision);
    try {
      const res = await fetch(`${API_URL}/runs/${runId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) setDone(decision);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-md border border-run/40 bg-run/10 p-3">
      <p className="text-xs font-medium text-fg">Waiting for approval</p>
      {done ? (
        <p className="mt-1 text-xs text-fg-muted">
          {done === "approved" ? "Approved. Resuming…" : "Denied."}
        </p>
      ) : (
        <>
          <p className="mt-1 text-[11px] text-fg-muted">
            Approve to continue the run, or deny to take the false branch.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => decide("approved")}
              disabled={!!pending || !runId}
              className="flex-1 rounded-md bg-ok px-3 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending === "approved" ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={() => decide("denied")}
              disabled={!!pending || !runId}
              className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-err/50 hover:text-err disabled:opacity-50"
            >
              {pending === "denied" ? "Denying…" : "Deny"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function OutputEntry({ name, value }: { name: string; value: unknown }) {
  const [open, setOpen] = useState(true);
  const isError = isErrorValue(value);

  return (
    <div
      className={`rounded-md border ${isError ? "border-err/30 bg-err/5" : "border-border bg-bg"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className={`font-mono text-xs ${isError ? "text-err" : "text-accent"}`}>
          {name}
        </span>
        <span className="text-xs text-fg-muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <pre
          className={`overflow-x-auto whitespace-pre-wrap break-words border-t px-3 py-2 font-mono text-xs tabular-nums ${
            isError ? "border-err/20 text-err/90" : "border-border text-fg"
          }`}
        >
          {format(value)}
        </pre>
      )}
    </div>
  );
}

function format(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
