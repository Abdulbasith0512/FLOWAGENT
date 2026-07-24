import type { WorkflowGraph } from "./types";

export const CURRENT_SCHEMA_VERSION = 2;

type Migration = (graph: WorkflowGraph) => WorkflowGraph;

const MIGRATIONS: Record<number, Migration> = {
  1: (graph) => graph,
};

export function migrateGraph(
  graph: WorkflowGraph,
  fromVersion: number,
): { graph: WorkflowGraph; version: number } {
  let current = graph;
  let version = fromVersion;

  while (version < CURRENT_SCHEMA_VERSION) {
    const migration = MIGRATIONS[version];
    if (!migration) break;
    current = migration(current);
    version += 1;
  }

  return { graph: current, version };
}
