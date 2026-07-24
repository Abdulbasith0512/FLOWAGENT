"use client";

import { useEffect, useRef, useState } from "react";
import type { Node } from "@xyflow/react";
import { NODE_SPECS } from "@/lib/workflow/registry";
import type { NodeType } from "@/lib/workflow/types";
import { Input } from "@/components/ui/input";
import type { FlowNodeData } from "./node-types";

interface Props {
  node: Node | null;
  onChange: (nodeId: string, config: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}

export function ConfigSidebar({ node, onChange, onDelete }: Props) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nodeId = node?.id ?? null;
  const config = node ? ((node.data as FlowNodeData).config ?? {}) : {};

  useEffect(() => {
    setDraft(config);
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  if (!node) {
    return (
      <div className="p-4">
        <p className="text-sm text-fg-muted">Select a node to configure it.</p>
      </div>
    );
  }

  const type = node.type as NodeType;
  const spec = NODE_SPECS[type];

  function update(key: string, raw: string, kind: string) {
    const value = kind === "number" ? Number(raw) : raw;
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => onChange(node!.id, next), 250);
  }

  function commitNow() {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    onChange(node!.id, draft);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-tint text-accent">
          <spec.icon size={14} />
        </span>
        <span className="text-sm font-medium text-fg">{spec.label}</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <p className="rounded-md border border-border bg-bg px-3 py-2 text-xs leading-relaxed text-fg-muted">
          Reference upstream data with{" "}
          <code className="font-mono text-accent">{"{{input}}"}</code> or{" "}
          <code className="font-mono text-accent">{"{{outputVar}}"}</code>.
        </p>
        {spec.fields.map((field) => {
          const value = draft[field.key] ?? "";
          return (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs text-fg-muted">
                {field.label}
              </span>
              {field.kind === "textarea" ? (
                <textarea
                  value={String(value)}
                  onChange={(e) => update(field.key, e.target.value, field.kind)}
                  onBlur={commitNow}
                  rows={4}
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-xs tabular-nums text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                />
              ) : field.kind === "select" ? (
                <select
                  value={String(value)}
                  onChange={(e) => update(field.key, e.target.value, field.kind)}
                  onBlur={commitNow}
                  className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.kind === "number" ? "number" : "text"}
                  value={String(value)}
                  onChange={(e) => update(field.key, e.target.value, field.kind)}
                  onBlur={commitNow}
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          className="w-full rounded-md border border-border px-3 py-2 text-xs text-fg-muted transition-colors hover:border-err/50 hover:text-err"
        >
          Delete node
        </button>
      </div>
    </div>
  );
}
