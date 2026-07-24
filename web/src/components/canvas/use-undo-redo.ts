import { useCallback, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

interface Options {
  getGraph: () => Snapshot;
  setGraph: (snapshot: Snapshot) => void;
  limit?: number;
}

function clone({ nodes, edges }: Snapshot): Snapshot {
  return {
    nodes: nodes.map((n) => ({ ...n, data: { ...n.data }, position: { ...n.position } })),
    edges: edges.map((e) => ({ ...e })),
  };
}

export function useUndoRedo({ getGraph, setGraph, limit = 100 }: Options) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);

  const takeSnapshot = useCallback(() => {
    past.current.push(clone(getGraph()));
    if (past.current.length > limit) past.current.shift();
    future.current = [];
  }, [getGraph, limit]);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(clone(getGraph()));
    setGraph(previous);
  }, [getGraph, setGraph]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(clone(getGraph()));
    setGraph(next);
  }, [getGraph, setGraph]);

  return { takeSnapshot, undo, redo };
}
