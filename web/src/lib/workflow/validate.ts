import type { WorkflowGraph } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateGraph(graph: WorkflowGraph): ValidationResult {
  const errors: string[] = [];
  const { nodes, edges } = graph;

  if (nodes.length === 0) {
    return { ok: false, errors: ["Add at least one node."] };
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references a missing node.`);
      continue;
    }
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)!.push(edge.target);
  }

  const entryNodes = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0);
  if (entryNodes.length === 0) {
    errors.push("No entry node - every node has an incoming edge (cycle).");
  }

  for (const node of nodes) {
    if (node.type === "condition") {
      const branches = edges.filter((e) => e.source === node.id);
      const handles = new Set(branches.map((e) => e.sourceHandle));
      if (!handles.has("true") || !handles.has("false")) {
        errors.push(
          `Condition node ${node.id} needs both a true and a false branch.`,
        );
      }
    }
  }

  if (hasCycle(nodes.map((n) => n.id), outgoing)) {
    errors.push("Graph contains a cycle.");
  }

  return { ok: errors.length === 0, errors };
}

function hasCycle(
  ids: string[],
  outgoing: Map<string, string[]>,
): boolean {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>(ids.map((id) => [id, WHITE]));

  function visit(id: string): boolean {
    color.set(id, GRAY);
    for (const next of outgoing.get(id) ?? []) {
      const c = color.get(next);
      if (c === GRAY) return true;
      if (c === WHITE && visit(next)) return true;
    }
    color.set(id, BLACK);
    return false;
  }

  for (const id of ids) {
    if (color.get(id) === WHITE && visit(id)) return true;
  }
  return false;
}
