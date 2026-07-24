"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid,
  Maximize,
  Play,
  Save,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { NODE_TYPES } from "@/lib/workflow/types";
import { NODE_SPECS } from "@/lib/workflow/registry";
import type { NodeType } from "@/lib/workflow/types";

export interface CommandActions {
  onAddNode: (type: NodeType) => void;
  onAddNote: () => void;
  onRun: () => void;
  onSave: () => void;
  onFitView: () => void;
  onAutoLayout: () => void;
}

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number }>;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  actions: CommandActions;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      { id: "run", label: "Run workflow", icon: Play, run: actions.onRun },
      { id: "save", label: "Save", icon: Save, run: actions.onSave },
      { id: "fit", label: "Fit to screen", icon: Maximize, run: actions.onFitView },
      { id: "layout", label: "Auto-layout", icon: LayoutGrid, run: actions.onAutoLayout },
      { id: "note", label: "Add note", icon: StickyNote, run: actions.onAddNote },
    ];
    const adds: Command[] = NODE_TYPES.map((type) => ({
      id: `add-${type}`,
      label: `Add ${NODE_SPECS[type].label} node`,
      hint: NODE_SPECS[type].description,
      icon: Sparkles,
      run: () => actions.onAddNode(type),
    }));
    return [...base, ...adds];
  }, [actions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q),
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  const activeIndex = Math.min(active, Math.max(filtered.length - 1, 0));

  function close() {
    setQuery("");
    setActive(0);
    onClose();
  }

  function choose(index: number) {
    const command = filtered[index];
    if (!command) return;
    command.run();
    close();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/40 px-4 pt-[18vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a command…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none"
        />
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-fg-muted">
              No matching commands
            </li>
          )}
          {filtered.map((command, index) => {
            const Icon = command.icon;
            return (
              <li key={command.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors " +
                    (index === activeIndex
                      ? "bg-accent-tint text-fg"
                      : "text-fg-muted hover:bg-surface-2")
                  }
                >
                  <Icon size={15} />
                  <span className="flex-1 text-fg">{command.label}</span>
                  {command.hint && (
                    <span className="truncate text-xs text-fg-muted">
                      {command.hint}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
