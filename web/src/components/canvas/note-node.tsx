"use client";

import { memo, useState } from "react";
import { NodeResizer, useReactFlow, type NodeProps } from "@xyflow/react";
import { NOTE_COLORS, colorToken } from "./colors";

export interface NoteNodeData {
  kind: "note";
  text: string;
  color: string;
  [key: string]: unknown;
}

function NoteNodeComponent({ id, data, selected }: NodeProps) {
  const note = data as NoteNodeData;
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);

  function patch(partial: Partial<NoteNodeData>) {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...partial } } : n)),
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col rounded-md border border-border-strong/60 shadow-sm"
      style={{ background: colorToken(NOTE_COLORS, note.color) ?? "var(--color-accent-tint)" }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={96}
        lineClassName="border-accent!"
        handleClassName="bg-accent! border-accent-fg!"
      />
      <div className="flex items-center justify-between px-2 pt-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-fg-muted">
          Note
        </span>
        <div className="flex items-center gap-1">
          {NOTE_COLORS.map((swatch) => (
            <button
              key={swatch.key}
              type="button"
              aria-label={swatch.label}
              onClick={() => patch({ color: swatch.key })}
              className="h-3 w-3 rounded-full border border-border-strong/50 transition-transform hover:scale-110"
              style={{ background: swatch.token }}
            />
          ))}
        </div>
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={note.text}
          onChange={(e) => patch({ text: e.target.value })}
          onBlur={() => setEditing(false)}
          placeholder="Write a note…"
          className="nodrag flex-1 resize-none bg-transparent px-2.5 py-2 text-xs text-fg placeholder:text-fg-muted focus:outline-none"
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          className="flex-1 cursor-text whitespace-pre-wrap px-2.5 py-2 text-xs text-fg"
        >
          {note.text || (
            <span className="text-fg-muted">Double-click to edit…</span>
          )}
        </div>
      )}
    </div>
  );
}

NoteNodeComponent.displayName = "NoteNode";
export const NoteNode = memo(NoteNodeComponent);
