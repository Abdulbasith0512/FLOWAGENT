"use client";

import { Handle, Position } from "@xyflow/react";
import { NODE_SPECS } from "@/lib/workflow/registry";
import type { NodeType } from "@/lib/workflow/types";
import { Kicker } from "@/components/brand/kicker";
import { cn } from "@/lib/utils";
import { COLOR_LABELS, colorToken } from "./colors";

export type NodeStatus =
  | "idle"
  | "pending"
  | "running"
  | "done"
  | "warning"
  | "error";

const STATUS_RING: Record<NodeStatus, string> = {
  idle: "ring-border",
  pending: "ring-border-strong",
  running:
    "ring-run scale-[1.02] shadow-[0_0_18px_-2px_color-mix(in_oklch,var(--color-run)_55%,transparent)]",
  done: "ring-ok",
  warning:
    "ring-accent shadow-[0_0_18px_-2px_color-mix(in_oklch,var(--color-accent)_50%,transparent)]",
  error:
    "ring-err shadow-[0_0_18px_-2px_color-mix(in_oklch,var(--color-err)_50%,transparent)]",
};

export function BaseNode({
  type,
  selected,
  status = "idle",
  summary,
  needsSetup,
  outputVar,
  disabled,
  colorLabel,
}: {
  type: NodeType;
  selected?: boolean;
  status?: NodeStatus;
  summary?: string;
  needsSetup?: boolean;
  outputVar?: string;
  disabled?: boolean;
  colorLabel?: string;
}) {
  const spec = NODE_SPECS[type];
  const Icon = spec.icon;
  const labelColor = colorToken(COLOR_LABELS, colorLabel);
  const showSetup = needsSetup && status === "idle";

  return (
    <div
      data-status={status}
      className={cn(
        "relative w-56 overflow-hidden rounded-md border border-border bg-surface ring-2 transition-all duration-300",
        STATUS_RING[status],
        showSetup && "ring-accent/40",
        selected && "border-accent",
        disabled && "opacity-50 grayscale",
      )}
    >
      {labelColor && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: labelColor }}
        />
      )}
      <Handle type="target" position={Position.Left} className="bg-border-strong!" />

      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-tint text-accent">
          <Icon size={14} />
        </span>
        <Kicker>{spec.label}</Kicker>
        {showSetup && (
          <span
            className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
            title="Needs configuration"
          />
        )}
      </div>

      <div className="space-y-1.5 px-3 py-2.5">
        {showSetup ? (
          <p className="text-xs text-accent">Click to configure</p>
        ) : (
          <p className="truncate font-mono text-xs text-fg-muted">{summary}</p>
        )}
        {outputVar && (
          <p className="text-[10px] text-fg-muted/70">
            outputs <span className="font-mono text-accent">{outputVar}</span>
          </p>
        )}
      </div>

      {spec.outputs.map((out, i) => (
        <Handle
          key={out}
          id={out}
          type="source"
          position={Position.Right}
          style={{ top: 40 + i * 18 }}
          className="bg-accent!"
        >
          {spec.outputs.length > 1 && (
            <span className="absolute right-3 -translate-y-1/2 text-[9px] text-fg-muted">
              {out}
            </span>
          )}
        </Handle>
      ))}
    </div>
  );
}
