"use client";

import { cn } from "@/lib/utils";

export type RunPhase =
  | "idle"
  | "pending"
  | "running"
  | "paused"
  | "done"
  | "warning"
  | "error";

const BADGE: Record<RunPhase, { label: string; cls: string }> = {
  idle: { label: "idle", cls: "text-fg-muted" },
  pending: { label: "queued", cls: "text-fg-muted" },
  running: { label: "running", cls: "text-run" },
  paused: { label: "paused", cls: "text-run" },
  done: { label: "done", cls: "text-ok" },
  warning: { label: "warnings", cls: "text-accent" },
  error: { label: "failed", cls: "text-err" },
};

export function StatusBadge({ phase }: { phase: RunPhase }) {
  const { label, cls } = BADGE[phase];
  return <span className={cn("text-[11px] font-medium", cls)}>{label}</span>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
      {children}
    </p>
  );
}

export function isErrorValue(value: unknown): boolean {
  const text =
    typeof value === "string"
      ? value
      : value
        ? JSON.stringify(value)
        : "";
  return /\[error\]|unavailable|circuit open|authentication_error/i.test(text);
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function Field({ name, value }: { name: string; value: unknown }) {
  const error = isErrorValue(value);
  return (
    <div>
      <span className={cn("font-mono text-xs", error ? "text-err" : "text-accent")}>
        {name}
      </span>
      <pre
        className={cn(
          "mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-md border px-3 py-2 font-mono text-xs",
          error
            ? "border-err/30 bg-err/5 text-err/90"
            : "border-border bg-bg text-fg",
        )}
      >
        {formatValue(value)}
      </pre>
    </div>
  );
}
