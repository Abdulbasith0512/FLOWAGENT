export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { loadWorkflow, listRuns } from "@/lib/workflow/actions";
import { Canvas } from "@/components/canvas/canvas";
import type { WorkflowGraph } from "@/lib/workflow/types";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await loadWorkflow(id);
  if (!workflow) notFound();

  const graph = workflow.graph as WorkflowGraph;
  const runs = await listRuns(workflow.id);
  const published = workflow.publishedAt != null;
  const unpublishedChanges =
    published && !graphsEqual(graph, workflow.publishedGraph as WorkflowGraph | null);

  return (
    <div className="h-screen">
      <Canvas
        workflowId={workflow.id}
        slug={workflow.slug}
        initialName={workflow.name}
        initialDescription={workflow.description}
        initialPublished={published}
        initialUnpublishedChanges={unpublishedChanges}
        initialHasRuns={runs.length > 0}
        initialNodes={graph.nodes ?? []}
        initialEdges={graph.edges ?? []}
      />
    </div>
  );
}

function graphsEqual(a: WorkflowGraph, b: WorkflowGraph | null): boolean {
  if (!b) return false;
  return normalize(a) === normalize(b);
}

function normalize(g: WorkflowGraph): string {
  const nodes = (g.nodes ?? [])
    .map((n) => ({ id: n.id, type: n.type, data: n.data }))
    .sort((x, y) => x.id.localeCompare(y.id));
  const edges = (g.edges ?? [])
    .map((e) => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle }))
    .sort((x, y) => `${x.source}${x.target}`.localeCompare(`${y.source}${y.target}`));
  return JSON.stringify({ nodes, edges });
}
