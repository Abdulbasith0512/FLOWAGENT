"use client";

import { useEffect, useRef, useState } from "react";
import {
  CopyPlus,
  EyeOff,
  Eye,
  Maximize,
  MousePointerSquareDashed,
  Palette as PaletteIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { Node } from "@xyflow/react";
import { NODE_TYPES } from "@/lib/workflow/types";
import { NODE_SPECS } from "@/lib/workflow/registry";
import type { NodeType } from "@/lib/workflow/types";
import { COLOR_LABELS } from "./colors";
import type { FlowNodeData } from "./node-types";

export interface ContextMenuState {
  x: number;
  y: number;
  node: Node | null;
}

export interface ContextMenuActions {
  onEdit: (node: Node) => void;
  onDuplicate: (node: Node) => void;
  onToggleDisabled: (node: Node) => void;
  onSetColorLabel: (node: Node, colorLabel: string | undefined) => void;
  onDelete: (node: Node) => void;
  onAddNode: (type: NodeType, x: number, y: number) => void;
  onFitView: () => void;
  onSelectAll: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  children,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="group/item relative">
      <button
        type="button"
        onClick={onClick}
        className={
          "flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-2 " +
          (danger ? "text-err" : "text-fg")
        }
      >
        <Icon size={14} />
        <span className="flex-1">{label}</span>
        {children && <span className="text-fg-muted">›</span>}
      </button>
      {children && (
        <div className="invisible absolute left-full top-0 z-10 ml-1 min-w-44 rounded-md border border-border bg-surface p-1 opacity-0 shadow-xl transition-opacity group-hover/item:visible group-hover/item:opacity-100">
          {children}
        </div>
      )}
    </div>
  );
}

export function ContextMenu({
  state,
  actions,
  onClose,
}: {
  state: ContextMenuState | null;
  actions: ContextMenuActions;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!state) return;
    const menu = ref.current;
    if (!menu) {
      setPos({ x: state.x, y: state.y });
      return;
    }
    const rect = menu.getBoundingClientRect();
    const x = Math.min(state.x, window.innerWidth - rect.width - 8);
    const y = Math.min(state.y, window.innerHeight - rect.height - 8);
    setPos({ x, y });
  }, [state]);

  useEffect(() => {
    if (!state) return;
    function onDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (ref.current && target && !ref.current.contains(target)) {
        onClose();
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  const node = state.node;
  const disabled = node ? Boolean((node.data as FlowNodeData).disabled) : false;

  function run(fn: () => void) {
    fn();
    onClose();
  }

  return (
    <div
      ref={ref}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 min-w-48 rounded-md border border-border bg-surface p-1 shadow-xl"
    >
      {node ? (
        <>
          <MenuItem icon={Pencil} label="Edit" onClick={() => run(() => actions.onEdit(node))} />
          <MenuItem
            icon={CopyPlus}
            label="Duplicate"
            onClick={() => run(() => actions.onDuplicate(node))}
          />
          <MenuItem
            icon={disabled ? Eye : EyeOff}
            label={disabled ? "Enable" : "Disable"}
            onClick={() => run(() => actions.onToggleDisabled(node))}
          />
          {node.type !== "note" && (
            <MenuItem icon={PaletteIcon} label="Color">
              <button
                type="button"
                onClick={() => run(() => actions.onSetColorLabel(node, undefined))}
                className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-sm text-fg-muted transition-colors hover:bg-surface-2"
              >
                None
              </button>
              {COLOR_LABELS.map((swatch) => (
                <button
                  key={swatch.key}
                  type="button"
                  onClick={() => run(() => actions.onSetColorLabel(node, swatch.key))}
                  className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-sm text-fg transition-colors hover:bg-surface-2"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: swatch.token }}
                  />
                  {swatch.label}
                </button>
              ))}
            </MenuItem>
          )}
          <div className="my-1 h-px bg-border" />
          <MenuItem
            icon={Trash2}
            label="Delete"
            danger
            onClick={() => run(() => actions.onDelete(node))}
          />
        </>
      ) : (
        <>
          <MenuItem icon={Plus} label="Add node">
            {NODE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => run(() => actions.onAddNode(type, state.x, state.y))}
                className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-sm text-fg transition-colors hover:bg-surface-2"
              >
                {NODE_SPECS[type].label}
              </button>
            ))}
          </MenuItem>
          <MenuItem
            icon={Maximize}
            label="Fit to screen"
            onClick={() => run(actions.onFitView)}
          />
          <MenuItem
            icon={MousePointerSquareDashed}
            label="Select all"
            onClick={() => run(actions.onSelectAll)}
          />
        </>
      )}
    </div>
  );
}
