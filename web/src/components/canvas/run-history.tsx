"use client";

import { useEffect, useState } from "react";
import { listRuns, type RunSummary } from "@/lib/workflow/actions";

const STATUS_COLOR: Record<string, string> = {
  done: "text-ok",
  error: "text-err",
  running: "text-run",
  paused: "text-run",
};

export function RunHistory({ workflowId }: { workflowId: string }) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listRuns(workflowId)
      .then(setRuns)
      .finally(() => setLoading(false));
  }, [workflowId]);

  return (
    <div className="space-y-2 p-4">
      {loading ? (
        <p className="text-sm text-fg-muted">Loading…</p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No runs yet. Hit Run to execute this workflow.
        </p>
      ) : (
        runs.map((run) => <RunRow key={run.id} run={run} />)
      )}
    </div>
  );
}

function RunRow({ run }: { run: RunSummary }) {
  const [open, setOpen] = useState(false);
  const when = run.started_at ? new Date(run.started_at).toLocaleString() : "";

  return (
    <div className="rounded-md border border-border bg-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex flex-col">
          <span className={`text-xs font-medium ${STATUS_COLOR[run.status] ?? "text-fg-muted"}`}>
            {run.status}
          </span>
          <span className="text-[11px] text-fg-muted">{when}</span>
        </span>
        <span className="text-xs text-fg-muted">
          {run.cost_usd != null ? `$${run.cost_usd.toFixed(4)}` : ""}
        </span>
      </button>
      {open && (
        <pre className="overflow-x-auto whitespace-pre-wrap border-t border-border px-3 py-2 font-mono text-[11px] text-fg">
          {run.error ? run.error : format(run.output)}
        </pre>
      )}
    </div>
  );
}

function format(output: unknown): string {
  if (output == null) return "no output";
  const vars =
    typeof output === "object" && output !== null && "vars" in output
      ? (output as { vars: unknown }).vars
      : output;
  try {
    return JSON.stringify(vars, null, 2);
  } catch {
    return String(vars);
  }
}
