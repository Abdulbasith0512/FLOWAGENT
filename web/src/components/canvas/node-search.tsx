"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Node } from "@xyflow/react";
import { NODE_SPECS } from "@/lib/workflow/registry";
import type { NodeType } from "@/lib/workflow/types";
import type { FlowNodeData } from "./node-types";

function nodeText(node: Node): string {
  if (node.type === "note") {
    return ["note", String((node.data as { text?: string }).text ?? "")].join(" ");
  }
  const type = node.type as NodeType;
  const spec = NODE_SPECS[type];
  const config = (node.data as FlowNodeData).config ?? {};
  return [spec?.label ?? type, type, ...Object.values(config).map(String)]
    .join(" ")
    .toLowerCase();
}

function nodeLabel(node: Node): string {
  if (node.type === "note") return "Note";
  return NODE_SPECS[node.type as NodeType]?.label ?? node.type ?? "Node";
}

export function NodeSearch({
  open,
  nodes,
  onClose,
  onPick,
}: {
  open: boolean;
  nodes: Node[];
  onClose: () => void;
  onPick: (node: Node) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return nodes.filter((n) => nodeText(n).includes(q)).slice(0, 8);
  }, [nodes, query]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  function close() {
    setQuery("");
    setActive(0);
    onClose();
  }

  function pick(index: number) {
    const node = results[index];
    if (!node) return;
    onPick(node);
    close();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  return (
    <div className="absolute right-4 top-4 z-40 w-72 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search size={14} className="text-fg-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Find a node…"
          className="flex-1 bg-transparent py-2.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={close}
          aria-label="Close search"
          className="text-fg-muted hover:text-fg"
        >
          <X size={14} />
        </button>
      </div>
      {query.trim() && (
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-4 text-center text-xs text-fg-muted">
              No matches
            </li>
          )}
          {results.map((node, index) => (
            <li key={node.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(index)}
                className={
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors " +
                  (index === activeIndex
                    ? "bg-accent-tint text-fg"
                    : "text-fg-muted hover:bg-surface-2")
                }
              >
                <span className="text-fg">{nodeLabel(node)}</span>
                <span className="font-mono text-[10px] text-fg-muted">
                  {node.id}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
