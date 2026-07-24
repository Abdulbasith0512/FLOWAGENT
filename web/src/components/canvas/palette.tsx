"use client";

import { LayoutGrid, StickyNote } from "lucide-react";
import { NODE_TYPES } from "@/lib/workflow/types";
import { NODE_SPECS } from "@/lib/workflow/registry";
import { Kicker } from "@/components/brand/kicker";

export function Palette({
  onAddNote,
  onAutoLayout,
}: {
  onAddNote: () => void;
  onAutoLayout: () => void;
}) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-surface p-3">
      <Kicker>Nodes</Kicker>
      <div className="mt-3 space-y-2">
        {NODE_TYPES.map((type) => {
          const spec = NODE_SPECS[type];
          const Icon = spec.icon;
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/flowagent-node", type);
                e.dataTransfer.effectAllowed = "move";
              }}
              className="flex cursor-grab items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-sm transition-colors hover:border-border-strong active:cursor-grabbing"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-tint text-accent">
                <Icon size={14} />
              </span>
              {spec.label}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onAddNote}
          className="flex w-full items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-sm transition-colors hover:border-border-strong"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-tint text-accent">
            <StickyNote size={14} />
          </span>
          Add note
        </button>
        <button
          type="button"
          onClick={onAutoLayout}
          className="flex w-full items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-sm transition-colors hover:border-border-strong"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-tint text-accent">
            <LayoutGrid size={14} />
          </span>
          Auto-layout
        </button>
      </div>
    </aside>
  );
}
